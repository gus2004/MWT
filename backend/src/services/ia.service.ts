import prisma from '../../prisma.config';

interface ReglamentoArticulo {
  id: string;
  codigo: string;
  titulo: string;
  texto: string;
  area?: string | null;
}

// ─────────────────────────────────────────────
//  IA DEL COMISARIATO (MWT Motorsport)
//  1) calificarIncidencia: asistente de calificación de incidencias.
//     - Si existe una API key de un proveedor LLM en el entorno
//       (OPENAI_API_KEY | GEMINI_API_KEY | ANTHROPIC_API_KEY) usa IA generativa
//       real y responde con fuente: "ia".
//     - Si no hay clave (o el proveedor falla), responde con el motor de
//       reglas local (palabras clave del reglamento) y fuente: "local".
//     El asistente nunca deja al comisariato inoperativo.
//  2) alertasRiesgo: detección de patrones de riesgo a partir de los datos
//     reales del sistema (sanciones, revisiones técnicas y apelaciones).
//     No requiere servicios externos.
// ─────────────────────────────────────────────

export type FuenteIA = 'ia' | 'local';

export interface CalificacionIncidencia {
  fuente: FuenteIA;
  proveedor: string;
  confianza: number;
  gravedad: 'LEVE' | 'MODERADA' | 'GRAVE' | 'MUY_GRAVE';
  penalizacion: string;
  resolucion: string;
  fundamentos: string[];
  /**
   * Artículo del reglamento sugerido por el asistente según el tipo de
   * infracción y el análisis de la descripción detallada del hecho:
   * { id, codigo, titulo } o null si ninguno aplica.
   */
  articulo_sugerido: { id: string; codigo: string; titulo: string } | null;
}

export interface AlertaRiesgo {
  tipo: 'SANCIONES_REPETIDAS' | 'REVISIONES_RECHAZADAS' | 'EVENTO_CON_INCIDENCIAS' | 'APELACIONES_PENDIENTES';
  nivel: 'ALTO' | 'MEDIO' | 'BAJO';
  titulo: string;
  detalle: string;
  valor: number;
  referencia: string;
}

interface IncidenciaInput {
  descripcion: string;
  tipo_infraccion?: string;
  articulo?: string;
  dorsal?: number | string | null;
  evento?: string;
  evento_id?: string;
  categoria?: string;
}

// ── Motor de reglas local ─────────────────────────────────────

interface ReglaLocal {
  puntos: number;
  fundamento: string;
  palabras: string[];
}

const REGLAS: ReglaLocal[] = [
  {
    puntos: 6,
    fundamento: 'Conducta que compromete la integridad de la competencia',
    palabras: ['bandera negra', 'exclusi', 'dopaje', 'antidoping', 'anti-doping', 'fraude', 'suplant', 'adulter', 'agresi', 'amenaza'],
  },
  {
    puntos: 4,
    fundamento: 'Manejo peligroso o desconocimiento de banderas',
    palabras: ['contacto', 'colision', 'choque', 'causa de la caida', 'lesion', 'manejo peligroso', 'peligroso', 'ignoro la bandera', 'ignoró la bandera', 'bandera amarilla', 'adelantamiento bajo', 'rebasa bajo', 'rebaso bajo', 'rebasó bajo'],
  },
  {
    puntos: 2,
    fundamento: 'Infracción de conducción con obtención de ventaja injusta',
    palabras: ['salida en falso', 'exceso de velocidad', 'velocidad en pit', 'pit lane', 'adelantamiento', 'rebasa', 'corto la pista', 'cortó la pista', 'corte de pista', 'ventaja', 'track limits', 'fuera de pista tomando'],
  },
  {
    puntos: 1,
    fundamento: 'Incidente leve de conducción',
    palabras: ['linea de pista', 'línea de pista', 'recorrido', 'se salio', 'se salió', 'derrap', 'off track', 'abandono'],
  },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const PENALIZACIONES: Record<CalificacionIncidencia['gravedad'], string> = {
  LEVE: 'Advertencia oficial',
  MODERADA: 'Pérdida de posiciones / +5 segundos',
  GRAVE: 'Pena de tiempo (+10 segundos) o vuelta penalizada',
  MUY_GRAVE: 'Exclusión de la competencia (DQ)',
};

function calificarLocal(input: IncidenciaInput, reglamento: ReglamentoArticulo[] = []): CalificacionIncidencia {
  const texto = normalizar(input.descripcion || '');
  const fundamentos: string[] = [];
  let puntos = 0;

  for (const regla of REGLAS) {
    const coincidencia = regla.palabras.some((p) => texto.includes(normalizar(p)));
    if (coincidencia) {
      puntos += regla.puntos;
      if (!fundamentos.includes(regla.fundamento)) fundamentos.push(regla.fundamento);
    }
  }

  const gravedad: CalificacionIncidencia['gravedad'] =
    puntos <= 1 ? 'LEVE' : puntos <= 3 ? 'MODERADA' : puntos <= 6 ? 'GRAVE' : 'MUY_GRAVE';

  // ── Sugerencia de artículo del reglamento ──
  // Prioridad: 1) artículo indicado manualmente por el comisario, 2) artículo
  // del catálogo cuyo título/texto y área mejor correspondan al tipo de
  // infracción y al análisis de la descripción del hecho. Los artículos que
  // vienen del PDF de reglamento del evento reciben bonus de prioridad.
  let articuloSugerido: CalificacionIncidencia['articulo_sugerido'] = null;
  if (input.articulo?.trim()) {
    const buscado = normalizar(input.articulo.trim());
    const propio = reglamento.find((a) => normalizar(a.codigo).includes(buscado) || buscado.includes(normalizar(a.codigo)));
    articuloSugerido = propio
      ? { id: propio.id, codigo: propio.codigo, titulo: propio.titulo }
      : { id: '', codigo: input.articulo.trim(), titulo: 'Artículo indicado por el comisario' };
  } else if (reglamento.length) {
    const terminos = normalizar(`${input.tipo_infraccion || ''} ${input.descripcion || ''}`);
    let mejor: { art: ReglamentoArticulo; puntos: number } | null = null;
    for (const art of reglamento) {
      const contenido = normalizar(`${art.titulo} ${art.texto} ${art.area || ''}`);
      let score = 0;
      for (const palabra of terminos.split(/\s+/)) {
        if (palabra.length >= 5 && contenido.includes(palabra)) score += 1;
      }
      if (art.area && input.tipo_infraccion && contenido.includes(normalizar(input.tipo_infraccion))) score += 3;
      // Bonus: artículo del reglamento oficial del evento (extraído de su PDF)
      if (input.evento_id && (art as any).evento_id === input.evento_id) score += 2;
      if (score >= 2 && (!mejor || score > mejor.puntos)) mejor = { art, puntos: score };
    }
    if (mejor) {
      articuloSugerido = { id: mejor.art.id, codigo: mejor.art.codigo, titulo: mejor.art.titulo };
    }
  }

  const dorsal = input.dorsal ? `#${input.dorsal}` : 'el piloto involucrado';
  const articulo = input.articulo?.trim()
    ? `el artículo ${input.articulo.trim()} del reglamento`
    : articuloSugerido
      ? `el artículo ${articuloSugerido.codigo} (${articuloSugerido.titulo}) del reglamento`
      : 'el reglamento aplicable (ACMG/FMG)';
  const tipo = input.tipo_infraccion?.trim() || 'infracción deportiva';
  const evento = input.evento?.trim() ? `durante el evento "${input.evento.trim()}"` : 'durante la competencia';
  const descripcion = input.descripcion.trim();

  const resolucion = [
    `VISTOS los reportes del comisariato y las evidencias presentadas, en relación con la incidencia del dorsal ${dorsal} ${evento},`,
    `se deja constancia de la siguiente descripción del hecho: "${descripcion}".`,
    `CONSIDERANDO ${articulo} y la tipificación de "${tipo}", el comisariato califica la incidencia como ${gravedad.replace('_', ' ')}.`,
    `POR LO TANTO, se propone aplicar como sanción: ${PENALIZACIONES[gravedad]}.`,
    'El piloto involucrado podrá presentar apelación dentro del plazo establecido en el reglamento.',
    'Firmado: Comisariato Deportivo MWT Motorsport.',
  ].join(' ');

  return {
    fuente: 'local',
    proveedor: 'motor-local',
    confianza: Math.min(60 + puntos * 6, 92),
    gravedad,
    penalizacion: PENALIZACIONES[gravedad],
    resolucion,
    fundamentos: fundamentos.length ? fundamentos : ['Criterio general del reglamento'],
    articulo_sugerido: articuloSugerido,
  };
}

// ── IA generativa (opcional, según API key presente) ─────────

function extraerJson(texto: string): any | null {
  const limpio = texto.replace(/```json/gi, '```').replace(/```/g, '');
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin <= inicio) return null;
  try {
    return JSON.parse(limpio.slice(inicio, fin + 1));
  } catch {
    return null;
  }
}

async function fetchConTimeout(url: string, init: any, ms: number): Promise<any> {
  const f = (globalThis as any).fetch;
  if (typeof f !== 'function') throw new Error('fetch no disponible en este entorno.');
  return await Promise.race([
    f(url, init),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera de la IA agotado.')), ms)),
  ]);
}

function promptSistema(input: IncidenciaInput, reglamento: ReglamentoArticulo[] = [], extractoPdf?: string): string {
  const etiquetaEvento = (a: ReglamentoArticulo) =>
    input.evento_id && (a as any).evento_id === input.evento_id ? '[REGLAMENTO DEL EVENTO · PDF]' : '[catálogo general]';

  const BloqueReglamento = reglamento.length
    ? [
        'CATÁLOGO DEL REGLAMENTO (elige el artículo que mejor corresponda y usa SU código exacto; los marcados como REGLAMENTO DEL EVENTO tienen prioridad):',
        ...reglamento.map((a) => `- ${a.codigo} — ${a.titulo} ${etiquetaEvento(a)}: ${a.texto}`),
      ].join('\n')
    : 'Catálogo del reglamento: no disponible (responde articulo con "NINGUNO").';

  const ExtractoPdf = extractoPdf
    ? `TEXTO OFICIAL DEL REGLAMENTO DEL EVENTO (extraído del PDF subido por el comisario, tiene prioridad sobre tu conocimiento general):\n"""\n${extractoPdf}\n"""`
    : '';

  return [
    'Eres el asistente del comisariato deportivo de MWT Motorsport (motociclismo, Guatemala, reglamento ACMG/FMG).',
    'Analiza el TIPO de infracción y la DESCRIPCIÓN DETALLADA del hecho, y además determina qué artículo del reglamento aplica.',
    'Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, con esta forma exacta:',
    '{"gravedad":"LEVE|MODERADA|GRAVE|MUY_GRAVE","penalizacion":"sanción concreta sugerida","resolucion":"borrador formal de resolución de 3 a 6 líneas","confianza":0-100,"fundamentos":["motivo breve","motivo breve"],"articulo":"código del artículo elegido del catálogo o NINGUNO"}',
    'La resolución debe citar el artículo elegido (ART. X), usar lenguaje oficial de comisariato (VISTOS, CONSIDERANDO, POR LO TANTO) y mencionar el derecho a apelación. Si el texto oficial del reglamento del evento contempla el hecho, la sanción preliminar debe apegarse a lo que ese reglamento indica.',
    BloqueReglamento,
    ExtractoPdf,
    `Tipo de infracción reportado: ${input.tipo_infraccion || 'no especificado'}.`,
    `Artículo del reglamento señalado manualmente por el comisario (tiene prioridad sobre el catálogo si fue indicado): ${input.articulo || 'no indicado'}.`,
    `Dorsal del piloto involucrado: ${input.dorsal ?? 'no especificado'}.`,
    `Evento: ${input.evento || 'no especificado'}. Categoría: ${input.categoria || 'no especificada'}.`,
    `Descripción detallada del incidente: "${input.descripcion}"`,
  ].filter(Boolean).join('\n');
}

async function calificarConLLM(input: IncidenciaInput, reglamento: ReglamentoArticulo[] = [], extractoPdf?: string): Promise<CalificacionIncidencia | null> {
  const openai = process.env.OPENAI_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const prompt = promptSistema(input, reglamento, extractoPdf);

  try {
    let texto = '';
    let proveedor = 'ia';

    if (openai) {
      proveedor = 'openai';
      const r: any = await fetchConTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openai}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            messages: [{ role: 'user', content: prompt }],
          }),
        },
        20000,
      );
      const j: any = await r.json();
      texto = j?.choices?.[0]?.message?.content || '';
    } else if (gemini) {
      proveedor = 'gemini';
      // Cadena de modelos con respaldo: la clave (env GEMINI_MODEL) manda; si
      // no, el alias genérico "gemini-flash-latest" apunta siempre al modelo
      // vigente, y por último los modelos fijos según el registro de la cuenta.
      const candidatos = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.0-flash'].filter(Boolean) as string[];
      for (const modelo of candidatos) {
        const r: any = await fetchConTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${gemini}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) },
          20000,
        );
        if (!r.ok) continue; // modelo no disponible en esta cuenta: probar el siguiente
        const j: any = await r.json();
        texto = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (texto) break;
      }
      if (!texto) texto = '';
    } else if (anthropic) {
      proveedor = 'anthropic';
      const r: any = await fetchConTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropic, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
        },
        20000,
      );
      const j: any = await r.json();
      texto = j?.content?.[0]?.text || '';
    } else {
      return null;
    }

    const j = extraerJson(texto);
    const gravedad = String(j?.gravedad || '').toUpperCase() as CalificacionIncidencia['gravedad'];
    const gravedadesValidas = ['LEVE', 'MODERADA', 'GRAVE', 'MUY_GRAVE'];
    if (!j || !gravedadesValidas.includes(gravedad) || !j?.resolucion) return null;

    // Artículo sugerido por la IA: se valida CONTRA el catálogo real del
    // reglamento (nunca se acepta un código que no exista en él).
    let articuloSugerido: CalificacionIncidencia['articulo_sugerido'] = null;
    const elegido = String(j?.articulo || '').trim();
    if (elegido && !/ninguno/i.test(elegido)) {
      const match = reglamento.find(
        (a) => a.codigo.toLowerCase() === elegido.toLowerCase() || normalizar(a.codigo) === normalizar(elegido),
      );
      if (match) {
        articuloSugerido = { id: match.id, codigo: match.codigo, titulo: match.titulo };
      } else if (input.articulo?.trim()) {
        // El comisario lo señaló manualmente: se respeta su indicación.
        articuloSugerido = { id: '', codigo: input.articulo.trim(), titulo: 'Artículo indicado por el comisario' };
      }
    }

    return {
      fuente: 'ia',
      proveedor,
      confianza: Math.min(Math.max(Number(j.confianza) || 85, 50), 99),
      gravedad,
      penalizacion: String(j.penalizacion || PENALIZACIONES[gravedad]),
      resolucion: String(j.resolucion),
      fundamentos: Array.isArray(j.fundamentos) ? j.fundamentos.slice(0, 5).map(String) : [],
      articulo_sugerido: articuloSugerido,
    };
  } catch {
    return null;
  }
}

export async function calificarIncidencia(input: IncidenciaInput): Promise<CalificacionIncidencia> {
  // Catálogo vigente del reglamento: alimenta tanto a la IA generativa como
  // al motor local de reglas (sugerencia de artículo por tipo de infracción).
  // PRIORIDAD: los artículos del reglamento del evento (extraídos de su PDF)
  // van primero y no se repiten los equivalentes del catálogo general.
  let reglamento: ReglamentoArticulo[] = [];
  let extractoPdf: string | undefined;
  if (input.evento_id) {
    const delEvento = await prisma.reglamentoArticulo.findMany({
      where: { evento_id: input.evento_id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, codigo: true, titulo: true, texto: true, area: true, evento_id: true, origen: true },
    } as any);
    const general = await prisma.reglamentoArticulo.findMany({
      where: { evento_id: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, codigo: true, titulo: true, texto: true, area: true, evento_id: true, origen: true },
    } as any);
    const codigos = new Set(delEvento.map((a: any) => a.codigo));
    reglamento = [...delEvento, ...general.filter((a: any) => !codigos.has(a.codigo))] as any;
    const docRows: any = await prisma.$queryRaw`SELECT texto FROM reglamento_documentos WHERE evento_id = ${input.evento_id}`;
    extractoPdf = docRows?.[0]?.texto ? String(docRows[0].texto).slice(0, 5000) : undefined;
  } else {
    reglamento = await prisma.reglamentoArticulo.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, codigo: true, titulo: true, texto: true, area: true, evento_id: true, origen: true },
    } as any);
  }

  const conLLM = await calificarConLLM(input, reglamento as ReglamentoArticulo[], extractoPdf);
  const resultado = conLLM || calificarLocal(input, reglamento as ReglamentoArticulo[]);

  // ── Registrar uso de IA (para el porcentaje en el módulo de Comisario) ──
  await registrarUsoIA(resultado.fuente);

  return resultado;
}

// ── Contadores de uso de IA (almacenados en PreferenciaSistema) ───────────

export async function registrarUsoIA(fuente: FuenteIA) {
  const totalKey = 'ia_uso_total';
  const iaKey = 'ia_uso_ia';
  const localKey = 'ia_uso_local';

  const [totalPref, iaPref, localPref] = await Promise.all([
    prisma.preferenciaSistema.findUnique({ where: { clave: totalKey } }),
    prisma.preferenciaSistema.findUnique({ where: { clave: iaKey } }),
    prisma.preferenciaSistema.findUnique({ where: { clave: localKey } }),
  ]);

  const totalActual = totalPref ? parseInt(totalPref.valor, 10) : 0;
  const iaActual = iaPref ? parseInt(iaPref.valor, 10) : 0;
  const localActual = localPref ? parseInt(localPref.valor, 10) : 0;

  await Promise.all([
    prisma.preferenciaSistema.upsert({
      where: { clave: totalKey },
      update: { valor: String(totalActual + 1) },
      create: { clave: totalKey, valor: String(totalActual + 1), descripcion: 'Total de usos del asistente IA del comisariato' },
    }),
    prisma.preferenciaSistema.upsert({
      where: { clave: fuente === 'ia' ? iaKey : localKey },
      update: { valor: String((fuente === 'ia' ? iaActual : localActual) + 1) },
      create: {
        clave: fuente === 'ia' ? iaKey : localKey,
        valor: String((fuente === 'ia' ? iaActual : localActual) + 1),
        descripcion: fuente === 'ia' ? 'Usos con IA generativa (LLM)' : 'Usos con motor de reglas local',
      },
    }),
  ]);
}

export async function obtenerUsoIA() {
  const [totalPref, iaPref] = await Promise.all([
    prisma.preferenciaSistema.findUnique({ where: { clave: 'ia_uso_total' } }),
    prisma.preferenciaSistema.findUnique({ where: { clave: 'ia_uso_ia' } }),
  ]);
  const total = totalPref ? parseInt(totalPref.valor, 10) : 0;
  const iaCount = iaPref ? parseInt(iaPref.valor, 10) : 0;
  const porcentaje = total > 0 ? Math.round((iaCount / total) * 100) : 0;
  return { total, iaCount, localCount: total - iaCount, porcentaje };
}

// ── Panel de alertas de riesgo (sin servicios externos) ──────

function nombrePiloto(inscripcion: any): string {
  const u = inscripcion?.piloto?.usuario;
  if (u?.nombre || u?.apellido) return `${u?.nombre || ''} ${u?.apellido || ''}`.trim();
  return inscripcion?.piloto?.nombre_completo || 'Piloto sin identificar';
}

const NIVEL_ORDEN: Record<AlertaRiesgo['nivel'], number> = { ALTO: 0, MEDIO: 1, BAJO: 2 };

export async function alertasRiesgo(): Promise<AlertaRiesgo[]> {
  const [sanciones, revisiones, apelacionesPendientes] = await Promise.all([
    prisma.sancion.findMany({
      include: {
        inscripcion: { include: { evento: true, piloto: { include: { usuario: true } } } },
        tipo_sancion: true,
      },
    }),
    prisma.revisionTecnica.findMany({
      where: { estado: { in: ['RECHAZADA', 'CONDICIONAL'] } },
      include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } },
    }),
    prisma.apelacion.count({ where: { estado: 'PENDIENTE' } }),
  ]);

  const alertas: AlertaRiesgo[] = [];

  // 1) Pilotos con sanciones repetidas
  const sancionesPorPiloto = new Map<string, { nombre: string; cantidad: number; ultima: string }>();
  for (const s of sanciones) {
    const ins: any = s.inscripcion;
    if (!ins?.piloto) continue;
    const clave = ins.piloto.id;
    const previa = sancionesPorPiloto.get(clave) || { nombre: nombrePiloto(ins), cantidad: 0, ultima: '' };
    previa.cantidad += 1;
    previa.ultima = s.fecha_sancion ? new Date(s.fecha_sancion).toLocaleDateString('es-GT') : previa.ultima;
    sancionesPorPiloto.set(clave, previa);
  }
  for (const { nombre, cantidad, ultima } of sancionesPorPiloto.values()) {
    if (cantidad >= 2) {
      alertas.push({
        tipo: 'SANCIONES_REPETIDAS',
        nivel: cantidad >= 3 ? 'ALTO' : 'MEDIO',
        titulo: `${nombre} acumula ${cantidad} sanciones`,
        detalle: `Reincidencia detectada: ${cantidad} infracciones registradas${ultima ? `, la más reciente el ${ultima}` : ''}. Se recomienda vigilancia reforzada en la próxima competencia.`,
        valor: cantidad,
        referencia: nombre,
      });
    }
  }

  // 2) Pilotos con revisiones técnicas rechazadas o condicionales
  const revPorPiloto = new Map<string, { nombre: string; cantidad: number; estados: string[] }>();
  for (const rev of revisiones) {
    const ins: any = rev.inscripcion;
    if (!ins?.piloto) continue;
    const clave = ins.piloto.id;
    const previa = revPorPiloto.get(clave) || { nombre: nombrePiloto(ins), cantidad: 0, estados: [] as string[] };
    previa.cantidad += 1;
    previa.estados.push(rev.estado);
    revPorPiloto.set(clave, previa);
  }
  for (const { nombre, cantidad, estados } of revPorPiloto.values()) {
    alertas.push({
      tipo: 'REVISIONES_RECHAZADAS',
      nivel: cantidad >= 2 ? 'ALTO' : 'MEDIO',
      titulo: `${nombre}: ${cantidad} revisión(es) técnica(s) con observaciones`,
      detalle: `Estados registrados: ${estados.join(', ')}. Verificar el estado mecánico de la motocicleta antes de permitir su participación.`,
      valor: cantidad,
      referencia: nombre,
    });
  }

  // 3) Evento con mayor número de incidencias
  const sancionesPorEvento = new Map<string, number>();
  for (const s of sanciones) {
    const nombreEvento = (s.inscripcion as any)?.evento?.nombre;
    if (!nombreEvento) continue;
    sancionesPorEvento.set(nombreEvento, (sancionesPorEvento.get(nombreEvento) || 0) + 1);
  }
  const topEvento = [...sancionesPorEvento.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topEvento && topEvento[1] >= 2) {
    alertas.push({
      tipo: 'EVENTO_CON_INCIDENCIAS',
      nivel: topEvento[1] >= 4 ? 'ALTO' : 'MEDIO',
      titulo: `"${topEvento[0]}" concentra ${topEvento[1]} infracciones`,
      detalle: 'Evento con mayor número de infracciones registradas. Analizar condiciones de pista, supervisión o densidad de pilotos por heat.',
      valor: topEvento[1],
      referencia: topEvento[0],
    });
  }

  // 4) Apelaciones pendientes de resolver
  if (apelacionesPendientes > 0) {
    alertas.push({
      tipo: 'APELACIONES_PENDIENTES',
      nivel: 'BAJO',
      titulo: `${apelacionesPendientes} apelación(es) pendiente(s) de resolución`,
      detalle: 'Existen apelaciones de pilotos sin resolver. El reglamento recomienda resolverlas antes de la próxima fecha del campeonato.',
      valor: apelacionesPendientes,
      referencia: 'Comisariato',
    });
  }

  return alertas
    .sort((a, b) => NIVEL_ORDEN[a.nivel] - NIVEL_ORDEN[b.nivel] || b.valor - a.valor)
    .slice(0, 20);
}
