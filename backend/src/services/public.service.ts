import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getPublicEventos(limit = 4) {
  const take = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 20)) : 4;

  const eventos = await prisma.evento.findMany({
    where: {
      visible_portada: true,
      estado: {
        in: ["ABIERTO", "EN_CURSO", "FINALIZADO"],
      },
    },
    take,
    orderBy: { fecha_inicio: "asc" },
    include: { campeonato: true },
  });

  return eventos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    fechaInicio: e.fecha_inicio,
    fechaFin: e.fecha_fin,
    organizador: e.campeonato?.nombre ?? "MWT",
    logoUrl: null,
  }));
}

export async function getCircuitos() {
  // Try to get "Autódromo Los Volcanes" (main circuit)
  let circuito = await prisma.circuito.findFirst({
    where: { nombre: "Autódromo Los Volcanes" },
  });

  // If not found, create it
  if (!circuito) {
    circuito = await prisma.circuito.create({
      data: {
        nombre: "Autódromo Los Volcanes",
        ubicacion_url: null,
        longitud_km: null,
        numero_curvas: null,
        foto_mapa_url: null,
        esta_activo: true,
      },
    });
  }

  return [circuito];
}

export async function getInscripciones() {
  // Return all inscripciones from database with related data
  return await prisma.inscripcion.findMany({
    include: {
      evento: true,
      piloto: {
        include: {
          usuario: true, // Include Usuario for nombre/apellido
        },
      },
      categoria: true,
      motocicleta: {
        include: {
          marca: true,
          piloto: {
            include: {
              usuario: true,
            },
          },
        },
      },
      historial_motocicletas: {
        include: {
          motocicleta: {
            include: {
              marca: true,
              piloto: {
                include: {
                  usuario: true,
                },
              },
            },
          },
        },
      },
      sanciones: {
        include: {
          comisario: true,
          tipo_sancion: true,
        },
      },
    },
    orderBy: { fecha_registro: "desc" },
  });
}

export async function getInscripcionOptions(params: { eventoId?: string; pilotoId?: string } = {}) {
  const eventoId = params.eventoId?.trim();
  const pilotoId = params.pilotoId?.trim();

  const [eventos, pilotos, eventoSeleccionado, pilotoSeleccionado] = await Promise.all([
    prisma.evento.findMany({
      where: {
        // Coordinación 100% con el módulo de Eventos: solo fechas que están
        // "mostradas" (publicadas en portada y en estados activos del ciclo).
        visible_portada: true,
        estado: { in: ["ABIERTO", "EN_CURSO", "FINALIZADO"] },
      },
      select: {
        id: true,
        nombre: true,
        estado: true,
        fecha_inicio: true,
        fecha_fin: true,
        campeonato_id: true,
        campeonato: {
          select: {
            nombre: true,
            _count: { select: { categorias: true } },
          },
        },
        circuito: {
          select: {
            nombre: true,
          },
        },
        _count: { select: { inscripciones: true } },
      },
      orderBy: [{ fecha_inicio: "desc" }, { nombre: "asc" }],
    }),
    prisma.perfilPiloto.findMany({
      include: {
        usuario: true,
        _count: { select: { motocicletas: true, inscripciones: true } },
      },
      orderBy: [{ usuario: { nombre: "asc" } }],
    }),
    eventoId
      ? prisma.evento.findUnique({
          where: { id: eventoId },
          select: {
            id: true,
            campeonato_id: true,
          },
        })
      : Promise.resolve(null),
    pilotoId
      ? prisma.perfilPiloto.findUnique({
          where: { id: pilotoId },
          include: { usuario: true },
        })
      : Promise.resolve(null),
  ]);

  const campeonatoId = eventoSeleccionado?.campeonato_id ?? null;

  const [categorias, motocicletas] = await Promise.all([
    campeonatoId
      ? prisma.categoria.findMany({
          where: { campeonato_id: campeonatoId },
          include: { campeonato: true, _count: { select: { inscripciones: true } } },
          orderBy: { nombre: "asc" },
        })
      : Promise.resolve([]),
    pilotoSeleccionado
      ? prisma.motocicleta.findMany({
          where: { piloto_id: pilotoSeleccionado.id },
          include: { marca: true, piloto: { include: { usuario: true } } },
          orderBy: [{ modelo: "asc" }],
        })
      : prisma.motocicleta.findMany({
          include: { marca: true, piloto: { include: { usuario: true } } },
          orderBy: [{ modelo: "asc" }],
        }),
  ]);
  const marcas = await prisma.marcaMoto.findMany({
    orderBy: { nombre: 'asc' },
  });

  // Conteo de inscripciones por categoría acotado al evento seleccionado (referencia en la UI)
  const conteoPorCategoriaEvento = new Map<string, number>();
  if (eventoId) {
    const filas = await prisma.inscripcion.groupBy({
      by: ["categoria_id"],
      where: { evento_id: eventoId },
      _count: { _all: true },
    });
    for (const fila of filas) {
      if (fila.categoria_id) conteoPorCategoriaEvento.set(fila.categoria_id, Number((fila as any)._count?._all ?? 0));
    }
  }

  // Categorías realmente utilizadas por las inscripciones del evento seleccionado
  // (coordinan la lista con los datos reales aunque el campeonato del evento no coincida)
  const categoriasUsadasPorEvento = eventoId
    ? await prisma.categoria.findMany({
        where: { inscripciones: { some: { evento_id: eventoId } } },
        include: { campeonato: true, _count: { select: { inscripciones: true } } },
        orderBy: { nombre: "asc" },
      })
    : [];

  // Lista final coordinada: primero las que el evento ya usa, luego el resto del campeonato
  // (permite inscribir en cualquier categoría de la serie aunque aún no tenga inscritos)
  const mapaCategorias = new Map<string, any>();
  for (const c of [...categoriasUsadasPorEvento, ...categorias]) {
    if (c?.id) mapaCategorias.set(String(c.id), c);
  }
  let categoriasFinal = Array.from(mapaCategorias.values());

  // Fallback global solo si no hay categorías coordinadas de ninguna fuente
  if (categoriasFinal.length === 0) {
    categoriasFinal = await prisma.categoria.findMany({
      include: { campeonato: true, _count: { select: { inscripciones: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  // Orden con evento seleccionado: primero las con inscritos en este evento (mayor a menor), luego alfabético
  if (eventoId) {
    categoriasFinal = categoriasFinal.slice().sort((a: any, b: any) => {
      const ea = conteoPorCategoriaEvento.get(String(a.id)) ?? 0;
      const eb = conteoPorCategoriaEvento.get(String(b.id)) ?? 0;
      if (ea !== eb) return eb - ea;
      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    });
  }

  return {
    eventos: eventos.map((evento) => ({
      id: evento.id,
      nombre: evento.nombre,
      estado: evento.estado,
      fecha_inicio: evento.fecha_inicio,
      fecha_fin: evento.fecha_fin,
      campeonato_id: evento.campeonato_id,
      campeonato_nombre: evento.campeonato?.nombre ?? "",
      circuito_nombre: evento.circuito?.nombre ?? "",
      total_categorias: (evento as any).campeonato?._count?.categorias ?? 0,
      total_inscripciones: (evento as any)._count?.inscripciones ?? 0,
    })),
    categorias: categoriasFinal.map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      campeonato_id: categoria.campeonato_id,
      campeonato_nombre: categoria.campeonato?.nombre ?? "",
      cilindrada_min: categoria.cilindrada_min,
      cilindrada_max: categoria.cilindrada_max,
      precio_inscripcion: categoria.precio_inscripcion,
      total_inscripciones: (categoria as any)._count?.inscripciones ?? 0,
      total_inscripciones_evento: conteoPorCategoriaEvento.get(categoria.id) ?? 0,
    })),
    pilotos: pilotos.map((piloto) => ({
      id: piloto.id,
      nombre: piloto.usuario.nombre,
      apellido: piloto.usuario.apellido,
      email: piloto.usuario.email,
      dorsal_preferido: piloto.dorsal_preferido,
      total_motos: (piloto as any)._count?.motocicletas ?? 0,
      total_inscripciones: (piloto as any)._count?.inscripciones ?? 0,
    })),
    motocicletas: motocicletas.map((motocicleta) => ({
      id: motocicleta.id,
      modelo: motocicleta.modelo,
      anio: motocicleta.anio,
      cilindrada_real: motocicleta.cilindrada_real,
      vin: motocicleta.vin,
      apodo_moto: motocicleta.apodo_moto,
      piloto_id: motocicleta.piloto_id,
      piloto_nombre: motocicleta.piloto.usuario.nombre,
      piloto_apellido: motocicleta.piloto.usuario.apellido,
      marca_nombre: motocicleta.marca.nombre,
    })),
    marcas: marcas.map((marca) => ({
      id: marca.id,
      nombre: marca.nombre,
    })),
    seleccionado: {
      eventoId: eventoSeleccionado?.id ?? null,
      campeonatoId,
      pilotoId: pilotoSeleccionado?.id ?? null,
    },
  };
}

export async function getMaintenanceModules() {
  // Return a list of maintenance modules present in the DB with simple counts.
  // Adapt keys to frontend expectations.
  const keys = [
    { key: "usuarios", title: "Usuarios", model: "usuario" },
    { key: "roles", title: "Roles", model: "rol" },
    { key: "permisos", title: "Permisos", model: "permiso" },
    { key: "marcas", title: "Marcas", model: "marcaMoto" },
    { key: "motocicletas", title: "Motocicletas", model: "motocicleta" },
    { key: "circuitos", title: "Circuitos", model: "circuito" },
    { key: "campeonatos", title: "Campeonatos", model: "campeonato" },
    { key: "categorias", title: "Categorías", model: "categoria" },
    { key: "eventos", title: "Eventos", model: "evento" },
    { key: "inscripciones", title: "Inscripciones", model: "inscripcion" },
    { key: "pagos", title: "Pagos", model: "pago" },
    { key: "patrocinadores", title: "Patrocinadores", model: "patrocinador" },
    { key: "notificaciones", title: "Notificaciones", model: "notificacion" },
    { key: "preferencias", title: "Preferencias", model: "preferenciaSistema" },
    { key: "documentos", title: "Documentos", model: "documentoEvento" },
    { key: "galeria", title: "Galería", model: "galeriaFoto" },
    { key: "revision-tecnica", title: "Revisión técnica", model: "revisionTecnica" },
    { key: "sanciones", title: "Sanciones", model: "sancion" },
    { key: "heats", title: "Heats", model: "heat" },
  ];

  // Build promises to count each model if exists in prisma client
  const counts = await Promise.all(
    keys.map(async (k) => {
      try {
        // @ts-ignore
        const model = (prisma as any)[k.model];
        if (model && typeof model.count === "function") {
          const c = await model.count();
          return { key: k.key, title: k.title, count: c };
        }
      } catch (e) {
        // ignore
      }
      return { key: k.key, title: k.title, count: 0 };
    })
  );

  return counts;
}

export async function getPublicPilotoDetail(pilotoId: string) {
  const piloto = await prisma.perfilPiloto.findUnique({
    where: { id: pilotoId },
    include: {
      usuario: {
        include: {
          perfil_personal: true,
        },
      },
      motocicletas: {
        include: {
          marca: true,
        },
        orderBy: [{ modelo: 'asc' }],
      },
      inscripciones: {
        include: {
          evento: true,
          categoria: true,
          sanciones: {
            include: {
              tipo_sancion: true,
              comisario: true,
            },
            orderBy: [{ fecha_sancion: 'desc' }],
          },
        },
      },
    },
  });

  if (!piloto) {
    throw new Error('Piloto no encontrado.');
  }

  const sancionesHistoricas = piloto.inscripciones.flatMap((ins) =>
    (ins.sanciones || []).map((s) => ({
      id: s.id,
      fecha_sancion: s.fecha_sancion,
      motivo: s.motivo,
      gravedad: s.gravedad,
      penalizacion: s.penalizacion,
      tipo_sancion: s.tipo_sancion?.nombre || null,
      comisario_nombre: s.comisario ? `${s.comisario.nombre} ${s.comisario.apellido}` : null,
      evento_id: ins.evento_id,
      evento_nombre: ins.evento?.nombre || 'Evento sin nombre',
      categoria_id: ins.categoria_id,
      categoria_nombre: ins.categoria?.nombre || 'Categoría sin nombre',
      dorsal_asignado: ins.dorsal_asignado,
    }))
  );

  sancionesHistoricas.sort((a, b) => new Date(b.fecha_sancion).getTime() - new Date(a.fecha_sancion).getTime());

  return {
    id: piloto.id,
    dorsal_preferido: piloto.dorsal_preferido,
    tipo_sangre: piloto.tipo_sangre,
    alergias: piloto.alergias,
    condiciones_medicas: piloto.condiciones_medicas,
    nombre_contacto_emergencia: piloto.nombre_contacto_emergencia,
    parentesco_emergencia: piloto.parentesco_emergencia,
    telefono_emergencia: piloto.telefono_emergencia,
    seguro_medico_empresa: piloto.seguro_medico_empresa,
    poliza_seguro: piloto.poliza_seguro,
    usuario: {
      id: piloto.usuario.id,
      nombre: piloto.usuario.nombre,
      apellido: piloto.usuario.apellido,
      email: piloto.usuario.email,
      esta_activo: piloto.usuario.esta_activo,
      fecha_creacion: piloto.usuario.fecha_creacion,
    },
    perfil_personal: piloto.usuario.perfil_personal,
    motocicletas: piloto.motocicletas.map((m) => ({
      id: m.id,
      modelo: m.modelo,
      anio: m.anio,
      cilindrada_real: m.cilindrada_real,
      vin: m.vin,
      color: m.color,
      apodo_moto: m.apodo_moto,
      marca_nombre: m.marca?.nombre || null,
    })),
    sanciones_historicas: sancionesHistoricas,
  };
}

export async function getPublicStats() {
  const [pilotos, categorias, eventos, campeonatos] = await Promise.all([
    prisma.perfilPiloto.findMany({
      include: { usuario: { select: { nombre: true, apellido: true } } },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.evento.findMany({
      orderBy: { fecha_inicio: "asc" },
      include: { campeonato: true },
    }),
    prisma.campeonato.findMany({}),
  ]);

  const campeonatoId = campeonatos[0]?.id || null;

  const [clasificaciones, heats, inscripciones] = await Promise.all([
    campeonatoId
      ? prisma.clasificacionGeneral.findMany({
          where: { campeonato_id: campeonatoId },
          include: {
            piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
            categoria: true,
          },
          orderBy: [{ puntos_total: "desc" }],
        })
      : Promise.resolve([]),
    prisma.heat.findMany({
      include: {
        categoria: true,
        resultados: {
          include: { inscripcion: { include: { piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } } } } },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.inscripcion.findMany({
      where: { estado: "VALIDADA" },
      include: {
        evento: true,
        categoria: true,
        piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
      },
      orderBy: [{ evento: { fecha_inicio: "desc" } }, { dorsal_asignado: "asc" }],
    }),
  ]);

  const pilotosPublic = pilotos.map((p) => ({
    id: p.id,
    dorsal: p.dorsal_preferido ?? null,
    nombre: `${p.usuario.nombre} ${p.usuario.apellido}`.trim(),
  }));

  const clasificacionesGeneral = clasificaciones.map((c) => ({
    posicion: c.posicion ?? null,
    dorsal: c.piloto.dorsal_preferido ?? null,
    piloto: `${c.piloto.usuario.nombre} ${c.piloto.usuario.apellido}`.trim(),
    categoria: c.categoria.nombre,
    puntos: c.puntos_total,
  }));

  const resultados = heats.map((h) => ({
    heat: h.nombre,
    categoria: h.categoria.nombre,
    resultados: h.resultados
      .map((r) => ({
        posicion: r.posicion,
        dorsal: r.inscripcion.piloto.dorsal_preferido ?? null,
        piloto: getNombrePiloto(r.inscripcion.piloto),
        vuelta_1: r.vuelta_1,
        vuelta_2: r.vuelta_2,
        mejor_vuelta: r.mejor_vuelta,
        puntos: r.puntos_ganados,
      }))
      .sort((a, b) => a.posicion - b.posicion),
  }));

  const participantesPorCategoria = inscripciones.reduce((acc, ins) => {
    acc[ins.categoria.nombre] = (acc[ins.categoria.nombre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventosPublic = eventos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    fechaInicio: e.fecha_inicio,
    fechaFin: e.fecha_fin,
    estado: e.estado,
    circuito: e.circuito_id ? e.circuito_id : null,
    organizador: e.campeonato?.nombre ?? "MWT",
  }));

  return {
    resumen: {
      pilotos: pilotos.length,
      categorias: categorias.length,
      eventos: eventos.length,
      eventos_proximos: eventos.filter((e) => e.estado === "ABIERTO" || e.estado === "EN_CURSO").length,
      sedes: 0,
    },
    categorias: categorias.map((c) => c.nombre),
    participantes_por_categoria: participantesPorCategoria,
    pilotos: pilotosPublic,
    eventos: eventosPublic,
    clasificaciones: clasificacionesGeneral,
    resultados,
  };
}

function getNombrePiloto(p: any): string {
  const n = p?.usuario?.nombre || "";
  const a = p?.usuario?.apellido || "";
  return `${n} ${a}`.trim() || "Piloto";
}