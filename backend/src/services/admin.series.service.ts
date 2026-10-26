import prisma from '../../prisma.config';

/**
 * Serie = "evento" del módulo de eventos organizado por carpetas.
 * Una serie es un Campeonato (serie ACMG o Yamaha de un año). Sus fechas
 * (Primera fecha, Segunda fecha...) son los Eventos vinculados al campeonato.
 *
 * La modalidad (ACMG / YAMAHA / OTRO) se guarda como marcador en la columna
 * descripcion para no depender del nombre libre que escriba el usuario:
 *   descripcion -> "modalidad:ACMG | descripcion libre"
 */

const MODALIDADES = ['ACMG', 'YAMAHA', 'OTRO'] as const;
export type Modalidad = (typeof MODALIDADES)[number];

function extraerModalidad(descripcion?: string | null): string | null {
  const m = descripcion?.match(/modalidad:([a-z]+)/i);
  return m ? m[1].toUpperCase() : null;
}

function construirDescripcion(modalidad?: string | null, descripcion?: string | null): string | null {
  const parts: string[] = [];
  if (modalidad && (MODALIDADES as readonly string[]).includes(modalidad.toUpperCase())) {
    parts.push(`modalidad:${modalidad.toUpperCase()}`);
  }
  if (descripcion?.trim()) parts.push(descripcion.trim());
  return parts.length ? parts.join(' | ') : null;
}

function normalizarModalidad(campeonato: { nombre: string; descripcion?: string | null }): Modalidad {
  const deDesc = extraerModalidad(campeonato.descripcion);
  if (deDesc) return deDesc as Modalidad;
  const n = campeonato.nombre.toUpperCase();
  if (n.includes('ACMG')) return 'ACMG';
  if (n.includes('YAMAHA') || n.includes('YAMMA')) return 'YAMAHA';
  return 'OTRO';
}

// ---------------------------------------------------------------------------
// Árbol de carpetas: años -> series (ACMG/Yamaha) -> fechas
// ---------------------------------------------------------------------------

export async function listarArbolSeries() {
  const campeonatos = await prisma.campeonato.findMany({
    include: {
      eventos: {
        include: { circuito: true },
        orderBy: [{ fecha_inicio: 'asc' }, { nombre: 'asc' }],
      },
    },
    orderBy: [{ anio: 'desc' }, { nombre: 'asc' }],
  });

  const mapaAños = new Map<number, any>();
  for (const c of campeonatos) {
    const totalCategorias = await prisma.categoria.count({ where: { campeonato_id: c.id } });
    const serie = {
      id: c.id,
      nombre: c.nombre,
      anio: c.anio,
      descripcion: c.descripcion,
      modalidad: normalizarModalidad(c),
      esta_activo: c.esta_activo,
      total_categorias: totalCategorias,
      count_fechas: c.eventos.length,
      fechas: c.eventos.map((ev) => ({
        id: ev.id,
        nombre: ev.nombre,
        fecha_inicio: ev.fecha_inicio,
        fecha_fin: ev.fecha_fin,
        estado: ev.estado,
        visible_portada: ev.visible_portada,
        costo_base: ev.costo_base,
        circuito: ev.circuito ? { id: ev.circuito.id, nombre: ev.circuito.nombre } : null,
      })),
    };

    if (!mapaAños.has(c.anio)) {
      mapaAños.set(c.anio, { anio: c.anio, series: [] });
    }
    mapaAños.get(c.anio).series.push(serie);
  }

  const items = [...mapaAños.values()].sort((a, b) => b.anio - a.anio);
  return items;
}

// ---------------------------------------------------------------------------
// CRUD de series (carpetas de evento)
// ---------------------------------------------------------------------------

export async function crearSerie(payload: any) {
  const nombre = String(payload.nombre ?? '').trim();
  const anio = Number(payload.anio);
  if (!nombre) throw new Error('El nombre de la carpeta de evento es requerido.');
  if (!Number.isFinite(anio)) throw new Error('El año es requerido.');

  const campeonato = await prisma.campeonato.create({
    data: {
      nombre,
      anio,
      descripcion: construirDescripcion(payload.modalidad, payload.descripcion),
      esta_activo: true,
    },
  });

  return { ...campeonato, modalidad: normalizarModalidad(campeonato) };
}

export async function editarSerie(serieId: string, payload: any) {
  const serie = await prisma.campeonato.findUnique({ where: { id: serieId } });
  if (!serie) throw new Error('Serie no encontrada.');

  const modalidadAnterior = extraerModalidad(serie.descripcion);
  const descripcionAnterior = serie.descripcion
    ? serie.descripcion.replace(/modalidad:[a-z]+\s*\|\s*/i, '').replace(/\s*\|\s*modalidad:[a-z]+/i, '').trim()
    : null;

  const data: any = {
    nombre: payload.nombre !== undefined && String(payload.nombre).trim() ? String(payload.nombre).trim() : serie.nombre,
    anio: payload.anio !== undefined && payload.anio !== '' && Number.isFinite(Number(payload.anio)) ? Number(payload.anio) : serie.anio,
  };

  const modalidadNueva = payload.modalidad !== undefined ? String(payload.modalidad) : modalidadAnterior;
  const descripcionNueva = payload.descripcion !== undefined ? String(payload.descripcion) : descripcionAnterior;
  if (modalidadNueva || descripcionNueva) {
    data.descripcion = construirDescripcion(modalidadNueva, descripcionNueva);
  } else {
    data.descripcion = null;
  }

  const campeonato = await prisma.campeonato.update({ where: { id: serieId }, data });
  return { ...campeonato, modalidad: normalizarModalidad(campeonato) };
}

export async function eliminarSerie(serieId: string) {
  const countFechas = await prisma.evento.count({ where: { campeonato_id: serieId } });
  if (countFechas > 0) {
    throw new Error('No se puede eliminar la carpeta porque tiene fechas. Elimina primero sus fechas.');
  }
  const countCategorias = await prisma.categoria.count({ where: { campeonato_id: serieId } });
  if (countCategorias > 0) {
    throw new Error('No se puede eliminar la carpeta porque tiene categorías. Elimina primero sus categorías.');
  }

  await prisma.patrocinadorCampeonato.deleteMany({ where: { campeonato_id: serieId } });
  await prisma.campeonato.delete({ where: { id: serieId } });
  return { ok: true, id: serieId };
}

// ---------------------------------------------------------------------------
// Categorías de la serie (las categorías que participan en ese evento)
// ---------------------------------------------------------------------------

export async function listarCategoriasDeSerie(serieId: string) {
  const serie = await prisma.campeonato.findUnique({ where: { id: serieId } });
  if (!serie) throw new Error('Serie no encontrada.');

  const eventos = await prisma.evento.findMany({ where: { campeonato_id: serieId }, select: { id: true } });
  const eventoIds = eventos.map((ev) => ev.id);

  // Include legacy categories already used by the series' registrations. Older
  // events may point to a different campeonato, but their registrations remain valid.
  const registros = eventoIds.length
    ? await prisma.inscripcion.findMany({
        where: {
          evento_id: { in: eventoIds },
        },
        select: { categoria_id: true },
      })
    : [];
  const conteo = registros.reduce<Record<string, number>>((acc, r) => {
    acc[r.categoria_id] = (acc[r.categoria_id] || 0) + 1;
    return acc;
  }, {});

  const categorias = await prisma.categoria.findMany({
    where: {
      OR: [
        { campeonato_id: serieId },
        ...(Object.keys(conteo).length ? [{ id: { in: Object.keys(conteo) } }] : []),
      ],
    },
    orderBy: { nombre: 'asc' },
  });
  const categoriasVisibles = Array.from(categorias.reduce((map, categoria) => {
    const anterior = map.get(categoria.nombre.toLowerCase());
    if (!anterior || (conteo[categoria.id] || 0) > (conteo[anterior.id] || 0)) {
      map.set(categoria.nombre.toLowerCase(), categoria);
    }
    return map;
  }, new Map<string, (typeof categorias)[number]>()).values());

  // Pool de categorías ya registradas en otros campeonatos (para importar)
  const pool = await prisma.categoria.findMany({
    where: { campeonato_id: { not: serieId } },
    include: { campeonato: { select: { id: true, nombre: true, anio: true } } },
    orderBy: [{ campeonato: { anio: 'desc' } }, { nombre: 'asc' }],
  });

  const idsActuales = new Set(categoriasVisibles.map((c) => c.id));

  return {
    modalidad: normalizarModalidad(serie),
    items: categoriasVisibles.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      cilindrada_min: c.cilindrada_min,
      cilindrada_max: c.cilindrada_max,
      descripcion: c.descripcion,
      precio_inscripcion: c.precio_inscripcion,
      total_inscritos: conteo[c.id] || 0,
      administrable: c.campeonato_id === serieId,
    })),
    pool: pool
      .filter((c) => !idsActuales.has(c.id))
      .map((c) => ({
        id: c.id,
        nombre: c.nombre,
        cilindrada_min: c.cilindrada_min,
        cilindrada_max: c.cilindrada_max,
        precio_inscripcion: c.precio_inscripcion,
        modalidad: normalizarModalidad(c.campeonato),
        origen_id: c.campeonato.id,
        origen_nombre: c.campeonato.nombre,
        origen_anio: c.campeonato.anio,
      })),
  };
}

export async function crearCategoriaDeSerie(serieId: string, payload: any) {
  const serie = await prisma.campeonato.findUnique({ where: { id: serieId } });
  if (!serie) throw new Error('Serie no encontrada.');

  const nombre = String(payload.nombre ?? '').trim();
  const cilindrada_min = Number(payload.cilindrada_min);
  const cilindrada_max = Number(payload.cilindrada_max);
  if (!nombre) throw new Error('El nombre de la categoría es requerido.');
  if (!Number.isFinite(cilindrada_min) || !Number.isFinite(cilindrada_max)) {
    throw new Error('cilindrada_min y cilindrada_max son requeridos.');
  }

  const categoria = await prisma.categoria.create({
    data: {
      campeonato_id: serieId,
      nombre,
      cilindrada_min,
      cilindrada_max,
      descripcion: payload.descripcion?.trim() || null,
      precio_inscripcion: Number.isFinite(Number(payload.precio_inscripcion)) ? Number(payload.precio_inscripcion) : 0,
    },
  });

  if (payload.usuario_id) {
    await prisma.auditoria.create({
      data: {
        usuario_id: payload.usuario_id,
        tabla_afectada: 'categorias',
        accion: 'INSERT',
        registro_id: categoria.id,
        valor_nuevo: { id: categoria.id, nombre: categoria.nombre, campeonato_id: serieId },
      },
    });
  }

  return categoria;
}

export async function importarCategoriasDeSerie(serieId: string, payload: any) {
  const serie = await prisma.campeonato.findUnique({ where: { id: serieId } });
  if (!serie) throw new Error('Serie no encontrada.');

  const ids = Array.isArray(payload.categoria_ids)
    ? payload.categoria_ids.map(String)
    : payload.categoria_id
      ? [String(payload.categoria_id)]
      : [];
  if (!ids.length) throw new Error('Selecciona al menos una categoría para importar.');

  const origen = await prisma.categoria.findMany({ where: { id: { in: ids } } });
  if (origen.length !== ids.length) throw new Error('Alguna categoría seleccionada no existe.');

  const actuales = await prisma.categoria.findMany({ where: { campeonato_id: serieId }, select: { id: true, nombre: true } });
  const nombresActuales = new Set(actuales.map((c) => c.nombre.toLowerCase()));

  const creadas = [];
  for (const c of origen) {
    if (nombresActuales.has(c.nombre.toLowerCase())) continue; // ya existe con el mismo nombre
    const nueva = await prisma.categoria.create({
      data: {
        campeonato_id: serieId,
        nombre: c.nombre,
        cilindrada_min: c.cilindrada_min,
        cilindrada_max: c.cilindrada_max,
        descripcion: c.descripcion,
        precio_inscripcion: c.precio_inscripcion,
      },
    });
    creadas.push(nueva);
    nombresActuales.add(c.nombre.toLowerCase());
  }

  if (payload.usuario_id) {
    await prisma.auditoria.create({
      data: {
        usuario_id: payload.usuario_id,
        tabla_afectada: 'categorias',
        accion: 'IMPORT',
        registro_id: serieId,
        valor_nuevo: { campeonato_id: serieId, importadas: creadas.map((c) => c.id), omitidas: ids.length - creadas.length },
      },
    });
  }

  return { importadas: creadas.length, omitidas: ids.length - creadas.length, creadas };
}

export async function eliminarCategoriaDeSerie(serieId: string, categoriaId: string) {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!categoria) throw new Error('Categoría no encontrada.');
  if (categoria.campeonato_id !== serieId) throw new Error('La categoría no pertenece a esta serie.');

  const inscritos = await prisma.inscripcion.count({ where: { categoria_id: categoriaId } });
  if (inscritos > 0) {
    throw new Error('No se puede eliminar la categoría porque tiene inscripciones asociadas.');
  }
  const enHeats = await prisma.heat.count({ where: { categoria_id: categoriaId } });
  if (enHeats > 0) {
    throw new Error('No se puede eliminar la categoría porque ya tiene heats creados.');
  }
  const enClasificaciones = await prisma.clasificacionGeneral.count({ where: { categoria_id: categoriaId } });
  if (enClasificaciones > 0) {
    throw new Error('No se puede eliminar la categoría porque tiene clasificaciones registradas.');
  }

  await (prisma as any).categoriaEnGrupo.deleteMany({ where: { categoria_id: categoriaId } });
  await prisma.categoria.delete({ where: { id: categoriaId } });

  return { ok: true, id: categoriaId };
}

// ---------------------------------------------------------------------------
// Copiar año: clona la estructura (carpetas ACMG/Yamaha) de un año a otro,
// con sus fechas en borrador, categorías y cronograma.
// ---------------------------------------------------------------------------

function derivarNombreAnio(nombre: string, origenAnio: number, destinoAnio: number): string {
  // "Campeonato ACMG 2026" -> "Campeonato ACMG 2027". Si no lleva el año, se anexa.
  const re = new RegExp(String(origenAnio), 'g');
  const reemplazado = nombre.replace(re, String(destinoAnio));
  return reemplazado !== nombre ? reemplazado : `${nombre} ${destinoAnio}`;
}

export async function clonarAnio(payload: any) {
  const origenAnio = Number(payload.origen_anio);
  const destinoAnio = Number(payload.destino_anio);
  if (!Number.isFinite(origenAnio) || !Number.isFinite(destinoAnio)) {
    throw new Error('Se requiere el año de origen y el año de destino.');
  }
  if (origenAnio === destinoAnio) {
    throw new Error('El año de origen y el de destino deben ser diferentes.');
  }

  const copiarFechas = payload.copiar_fechas !== false;
  const copiarCategorias = payload.copiar_categorias !== false;
  const copiarCronograma = payload.copiar_cronograma !== false;

  const origen = await prisma.campeonato.findMany({
    where: { anio: origenAnio },
    include: {
      categorias: true,
      eventos: { include: { cronograma: true } },
    },
    orderBy: { nombre: 'asc' },
  });
  if (!origen.length) {
    throw new Error(`No hay carpetas de evento en el año ${origenAnio} para copiar.`);
  }

  const existentes = await prisma.campeonato.findMany({
    where: { anio: destinoAnio },
    select: { nombre: true },
  });
  const nombresDestino = new Set(existentes.map((c) => c.nombre.toLowerCase()));
  const diffAnios = destinoAnio - origenAnio;

  const seriesCreadas: any[] = [];
  let fechasCreadas = 0;
  let categoriasCreadas = 0;
  let cronogramaCreado = 0;

  for (const campeonato of origen) {
    const nuevoNombre = derivarNombreAnio(campeonato.nombre, origenAnio, destinoAnio);
    if (nombresDestino.has(nuevoNombre.toLowerCase())) continue; // ya existe con ese nombre en el año destino

    const nuevo = await prisma.campeonato.create({
      data: {
        nombre: nuevoNombre,
        anio: destinoAnio,
        descripcion: campeonato.descripcion,
        esta_activo: true,
      },
    });
    nombresDestino.add(nuevoNombre.toLowerCase());
    seriesCreadas.push({ id: nuevo.id, nombre: nuevo.nombre });

    if (copiarCategorias && campeonato.categorias.length) {
      const nombresNuevos = new Set<string>();
      for (const cat of campeonato.categorias) {
        if (nombresNuevos.has(cat.nombre.toLowerCase())) continue;
        await prisma.categoria.create({
          data: {
            campeonato_id: nuevo.id,
            nombre: cat.nombre,
            cilindrada_min: cat.cilindrada_min,
            cilindrada_max: cat.cilindrada_max,
            descripcion: cat.descripcion,
            precio_inscripcion: cat.precio_inscripcion,
          },
        });
        nombresNuevos.add(cat.nombre.toLowerCase());
        categoriasCreadas += 1;
      }
    }

    if (copiarFechas && campeonato.eventos.length) {
      for (const ev of campeonato.eventos) {
        const fechaInicio = new Date(ev.fecha_inicio);
        const fechaFin = new Date(ev.fecha_fin);
        fechaInicio.setFullYear(fechaInicio.getFullYear() + diffAnios);
        fechaFin.setFullYear(fechaFin.getFullYear() + diffAnios);

        const nuevoEvento = await prisma.evento.create({
          data: {
            campeonato_id: nuevo.id,
            circuito_id: ev.circuito_id,
            nombre: derivarNombreAnio(ev.nombre, origenAnio, destinoAnio),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: 'BORRADOR',
            visible_portada: false,
            costo_base: ev.costo_base,
          },
        });
        fechasCreadas += 1;

        if (copiarCronograma && ev.cronograma.length) {
          const offsetMs = fechaInicio.getTime() - ev.fecha_inicio.getTime();
          for (const act of ev.cronograma) {
            await prisma.actividadCronograma.create({
              data: {
                evento_id: nuevoEvento.id,
                nombre: act.nombre,
                hora_inicio: new Date(act.hora_inicio.getTime() + offsetMs),
                hora_fin: new Date(act.hora_fin.getTime() + offsetMs),
                descripcion: act.descripcion,
                es_pista: act.es_pista,
              },
            });
            cronogramaCreado += 1;
          }
        }
      }
    }
  }

  if (!seriesCreadas.length) {
    throw new Error(`El año ${destinoAnio} ya tiene las mismas carpetas que el año ${origenAnio}.`);
  }

  if (payload.usuario_id) {
    await prisma.auditoria.create({
      data: {
        usuario_id: payload.usuario_id,
        tabla_afectada: 'campeonatos',
        accion: 'CLONAR_ANIO',
        registro_id: `${origenAnio}-${destinoAnio}`,
        valor_nuevo: {
          origen_anio: origenAnio,
          destino_anio: destinoAnio,
          series_creadas: seriesCreadas.map((c) => c.id),
          fechas_creadas: fechasCreadas,
          categorias_creadas: categoriasCreadas,
          criterios: { copiar_fechas: copiarFechas, copiar_categorias: copiarCategorias, copiar_cronograma: copiarCronograma },
        },
      },
    });
  }

  return {
    ok: true,
    origen_anio: origenAnio,
    destino_anio: destinoAnio,
    series_creadas: seriesCreadas.length,
    series_omitidas: origen.length - seriesCreadas.length,
    fechas_creadas: fechasCreadas,
    categorias_creadas: categoriasCreadas,
    cronograma_creado: cronogramaCreado,
  };
}