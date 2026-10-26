import prisma from '../../prisma.config';
import PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────
//  REPORTES DEL COMISARIATO (MWT Motorsport)
//  Resumen estructurado de infracciones por evento,
//  listo para exportar a CSV (Excel) y a PDF oficial
//  con diseño corporativo MWT. Fechas y horas en
//  formato local (es-GT).
// ─────────────────────────────────────────────

// Paleta corporativa MWT
const MWT = {
  NAVY: '#08111F',
  NAVY2: '#0F172A',
  CYAN: '#67E8F9',
  BLUE: '#2563EB',
  LIGHT: '#EDF4FF',
  MUTED: '#64748B',
  WHITE: '#FFFFFF',
  ROSE: '#E11D48',
  AMBER: '#B45309',
  GREEN: '#047857',
};

interface FilaInfraccion {
  ref: string;
  fecha: string;   // YYYY-MM-DD
  hora: string;    // HH:mm
  piloto: string;
  dorsal: string;
  categoria: string;
  tipo: string;
  estado: string;
  penalizacion: string;
  comisario: string;
  evidencias: number;
  apelacion: string;
  motivo: string;
}

export interface ResumenComisariatoDTO {
  evento: { id: string; nombre: string; estado: string; fecha: string } | null;
  evento_filtro: string;
  generado: string;
  generado_hora: string;
  kpis: {
    infracciones: number;
    apelaciones: number;
    apelaciones_pendientes: number;
    revisiones: number;
    revisiones_pendientes: number;
    evidencias: number;
    resueltas: number;
  };
  por_estado: Array<{ estado: string; total: number }>;
  por_tipo: Array<{ tipo: string; total: number }>;
  por_categoria: Array<{ categoria: string; total: number }>;
  infracciones: FilaInfraccion[];
  apelaciones: Array<{
    ref: string;
    fecha: string;
    hora: string;
    piloto: string;
    dorsal: string;
    categoria: string;
    sancion: string;
    estado: string;
    resolucion: string;
  }>;
}

function fechaPart(d: Date): string {
  return d ? new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';
}
function horaPart(d: Date): string {
  return d ? new Date(d).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
}
function slug(texto: string): string {
  return String(texto || 'todos')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'todos';
}

async function cargarDatos(eventoId?: string) {
  const evento = eventoId
    ? await prisma.evento.findUnique({
        where: { id: eventoId },
        select: { id: true, nombre: true, estado: true, fecha_inicio: true },
      })
    : null;

  const sanciones = await prisma.sancion.findMany({
    where: eventoId ? { inscripcion: { evento_id: eventoId } } : {},
    orderBy: { fecha_sancion: 'desc' },
    include: {
      tipo_sancion: true,
      comisario: { select: { nombre: true, apellido: true } },
      apelacion: { select: { estado: true, resolucion: true } },
      evidencias: { select: { id: true } },
      inscripcion: {
        include: {
          evento: { select: { nombre: true, estado: true, fecha_inicio: true, id: true } },
          categoria: { select: { nombre: true } },
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
    },
  });

  const apelacionesRows = await prisma.apelacion.findMany({
    where: eventoId ? { inscripcion: { evento_id: eventoId } } : {},
    orderBy: { fecha: 'desc' },
    include: {
      sancion: { select: { penalizacion: true, motivo: true } },
      inscripcion: {
        include: {
          categoria: { select: { nombre: true } },
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
    },
  });

  const revisionesRows = await prisma.revisionTecnica.findMany({
    where: eventoId ? { inscripcion: { evento_id: eventoId } } : {},
    select: { estado: true },
  });

  return { evento, sanciones, apelacionesRows, revisionesRows };
}

function construirResumen(data: Awaited<ReturnType<typeof cargarDatos>>): ResumenComisariatoDTO {
  const { evento, sanciones, apelacionesRows, revisionesRows } = data;

  const infracciones: FilaInfraccion[] = sanciones.map((s: any, idx: number) => ({
    ref: `INF-${String(s.id).slice(0, 6).toUpperCase()}`,
    fecha: fechaPart(s.fecha_sancion),
    hora: horaPart(s.fecha_sancion),
    piloto: [s.inscripcion?.piloto?.usuario?.nombre, s.inscripcion?.piloto?.usuario?.apellido].filter(Boolean).join(' ') || 'Piloto sin identificar',
    dorsal: s.inscripcion?.dorsal_asignado != null ? `#${s.inscripcion.dorsal_asignado}` : '—',
    categoria: s.inscripcion?.categoria?.nombre || '—',
    tipo: s.tipo_sancion?.nombre || 'Sin tipo',
    estado: (s.gravedad || 'PENDIENTE').toUpperCase(),
    penalizacion: s.penalizacion || '—',
    comisario: [s.comisario?.nombre, s.comisario?.apellido].filter(Boolean).join(' ') || '—',
    evidencias: (s.evidencias || []).length,
    apelacion: s.apelacion ? s.apelacion.estado : '',
    motivo: s.motivo || '',
  }));

  const apelaciones = apelacionesRows.map((a: any) => ({
    ref: `APE-${String(a.id).slice(0, 6).toUpperCase()}`,
    fecha: fechaPart(a.fecha),
    hora: horaPart(a.fecha),
    piloto: [a.inscripcion?.piloto?.usuario?.nombre, a.inscripcion?.piloto?.usuario?.apellido].filter(Boolean).join(' ') || 'Piloto sin identificar',
    dorsal: a.inscripcion?.dorsal_asignado != null ? `#${a.inscripcion.dorsal_asignado}` : '—',
    categoria: a.inscripcion?.categoria?.nombre || '—',
    sancion: a.sancion?.penalizacion || '—',
    estado: (a.estado || 'PENDIENTE').toUpperCase(),
    resolucion: a.resolucion || '',
  }));

  // Agrupaciones
  const contar = <T extends string>(arr: T[]): Array<{ key: T; total: number }> => {
    const m = new Map<T, number>();
    for (const k of arr) m.set(k, (m.get(k) || 0) + 1);
    return [...m.entries()].map(([key, total]) => ({ key, total })).sort((a, b) => b.total - a.total);
  };

  const porEstado = contar(infracciones.map((i) => i.estado));
  const porTipo = contar(infracciones.map((i) => i.tipo));
  const porCategoria = contar(infracciones.map((i) => i.categoria));

  return {
    evento: evento
      ? {
          id: evento.id,
          nombre: evento.nombre,
          estado: String(evento.estado),
          fecha: fechaPart(evento.fecha_inicio),
        }
      : null,
    evento_filtro: evento ? evento.nombre : 'TODOS LOS EVENTOS',
    generado: fechaPart(new Date()),
    generado_hora: horaPart(new Date()),
    kpis: {
      infracciones: sanciones.length,
      apelaciones: apelacionesRows.length,
      apelaciones_pendientes: apelacionesRows.filter((a: any) => (a.estado || '').toUpperCase() === 'PENDIENTE').length,
      revisiones: revisionesRows.length,
      revisiones_pendientes: revisionesRows.filter((r: any) => (r.estado || '').toUpperCase() === 'PENDIENTE').length,
      evidencias: sanciones.reduce((acc: number, s: any) => acc + (s.evidencias?.length || 0), 0),
      resueltas: sanciones.filter((s: any) => (s.gravedad || '').toUpperCase() === 'RESUELTO').length,
    },
    por_estado: porEstado.map((x) => ({ estado: x.key, total: x.total })),
    por_tipo: porTipo.map((x) => ({ tipo: x.key, total: x.total })),
    por_categoria: porCategoria.map((x) => ({ categoria: x.key, total: x.total })),
    infracciones,
    apelaciones,
  };
}

export async function resumenComisariato(eventoId?: string): Promise<ResumenComisariatoDTO> {
  return construirResumen(await cargarDatos(eventoId));
}

// ── CSV (Excel) ──────────────────────────────────────────────

function csvCelda(v: string | number): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export function construirCSV(res: ResumenComisariatoDTO): string {
  const lineas: string[] = [];
  const now = new Date();
  const stamp = `${fechaPart(now)} ${horaPart(now)}`;

  lineas.push(csvCelda('MWT MOTORSPORT · COMISARIATO DEPORTIVO'));
  lineas.push(csvCelda(`RESUMEN DE INFRACCIONES — ${res.evento_filtro}${res.evento ? ` (${res.evento.estado}, ${res.evento.fecha})` : ''}`));
  lineas.push(csvCelda(`Generado: ${stamp} · Documento oficial del comisariato`));
  lineas.push('');
  lineas.push('RESUMEN GENERAL');
  lineas.push([csvCelda('Indicador'), csvCelda('Valor')].join(','));
  lineas.push([csvCelda('Infracciones registradas'), res.kpis.infracciones].join(','));
  lineas.push([csvCelda('Infracciones resueltas'), res.kpis.resueltas].join(','));
  lineas.push([csvCelda('Apelaciones presentadas'), res.kpis.apelaciones].join(','));
  lineas.push([csvCelda('Apelaciones pendientes'), res.kpis.apelaciones_pendientes].join(','));
  lineas.push([csvCelda('Revisiones técnicas'), res.kpis.revisiones].join(','));
  lineas.push([csvCelda('Revisiones pendientes'), res.kpis.revisiones_pendientes].join(','));
  lineas.push([csvCelda('Evidencias adjuntas'), res.kpis.evidencias].join(','));
  lineas.push('');

  lineas.push('INFRACCIONES POR ESTADO');
  lineas.push([csvCelda('Estado'), csvCelda('Total')].join(','));
  for (const e of res.por_estado) lineas.push([csvCelda(e.estado), e.total].join(','));
  lineas.push('');

  lineas.push('INFRACCIONES POR TIPO');
  lineas.push([csvCelda('Tipo de infracción'), csvCelda('Total')].join(','));
  for (const t of res.por_tipo) lineas.push([csvCelda(t.tipo), t.total].join(','));
  lineas.push('');

  lineas.push('INFRACCIONES POR CATEGORÍA');
  lineas.push([csvCelda('Categoría'), csvCelda('Total')].join(','));
  for (const c of res.por_categoria) lineas.push([csvCelda(c.categoria), c.total].join(','));
  lineas.push('');

  lineas.push('DETALLE DE INFRACCIONES');
  lineas.push([
    'Nº', 'Referencia', 'Fecha', 'Hora', 'Dorsal', 'Piloto', 'Categoría', 'Tipo de infracción', 'Estado', 'Penalización', 'Comisario', 'Evidencias', 'Apelación', 'Motivo',
  ].map(csvCelda).join(','));
  res.infracciones.forEach((i, idx) => {
    lineas.push([
      idx + 1, i.ref, i.fecha, i.hora, i.dorsal, i.piloto, i.categoria, i.tipo, i.estado, i.penalizacion, i.comisario, i.evidencias, i.apelacion || '—', i.motivo,
    ].map(csvCelda).join(','));
  });
  lineas.push('');

  if (res.apelaciones.length) {
    lineas.push('APELACIONES');
    lineas.push(['Nº', 'Referencia', 'Fecha', 'Hora', 'Dorsal', 'Piloto', 'Categoría', 'Sanción cuestionada', 'Estado', 'Resolución'].map(csvCelda).join(','));
    res.apelaciones.forEach((a, idx) => {
      lineas.push([idx + 1, a.ref, a.fecha, a.hora, a.dorsal, a.piloto, a.categoria, a.sancion, a.estado, a.resolucion || '—'].map(csvCelda).join(','));
    });
  }

  return lineas.join('\n');
}

export function nombreArchivoCSV(eventoNombre: string): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace(/[T:]/g, '-');
  return `Resumen-Comisariato-${slug(eventoNombre)}-${stamp}.csv`;
}

// ── PDF oficial (pdfkit, diseño corporativo MWT) ─────────────

function colorHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const COLS_DETALLE: Array<{ key: keyof FilaInfraccion; label: string; w: number; align?: 'left' | 'center' }> = [
  { key: 'fecha', label: 'FECHA', w: 58, align: 'center' },
  { key: 'hora', label: 'HORA', w: 42, align: 'center' },
  { key: 'piloto', label: 'PILOTO', w: 118 },
  { key: 'dorsal', label: 'DOR', w: 32, align: 'center' },
  { key: 'categoria', label: 'CATEGORÍA', w: 86 },
  { key: 'tipo', label: 'TIPO DE INFRACCIÓN', w: 118 },
  { key: 'estado', label: 'ESTADO', w: 66, align: 'center' },
  { key: 'penalizacion', label: 'PENALIZACIÓN', w: 112 },
];

export async function construirPDF(res: ResumenComisariatoDTO): Promise<Buffer> {
  const doc = new PDFDocument({
    layout: 'landscape' as any,
    size: 'A4' as any,
    margin: { top: 30, bottom: 42, left: 30, right: 30 } as any,
    info: { Title: `Resumen de Infracciones — ${res.evento_filtro}`, Author: 'MWT Motorsport' },
  });

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Pie de página con paginación
  const stamp = `${res.generado} ${res.generado_hora}`;
  doc.on('pageAdded', (page: any) => {
    const y = doc.page.height - 26;
    doc.fontSize(7).fillColor('#94A3B8');
    doc.text(`MWT Motorsport · Comisariato Deportivo · Documento generado el ${stamp}`, doc.page.margins.left, y, { width: totalWidth, align: 'left', lineBreak: false });
    doc.text(`Página ${(page?.pageNumber ?? 1)}`, doc.page.margins.left, y, { width: totalWidth, align: 'right', lineBreak: false });
  });

  // ── Encabezado con banda navy ──
  const y0 = doc.page.margins.top;
  doc.rect(0, 0, doc.page.width, 86).fill(colorHex(MWT.NAVY));
  doc.rect(0, 86, doc.page.width, 3).fill(colorHex(MWT.CYAN));
  doc.rect(0, 0, 6, 86).fill(colorHex(MWT.BLUE));

  doc.fillColor(colorHex(MWT.CYAN)).font('Helvetica-Bold').fontSize(9);
  doc.text('MWT MOTORSPORT · COMISARIATO DEPORTIVO', doc.page.margins.left + 14, y0 - 4);
  doc.fillColor(colorHex(MWT.WHITE)).font('Helvetica-Bold').fontSize(20);
  doc.text('RESUMEN DE INFRACCIONES', doc.page.margins.left + 14, y0 + 10);
  doc.fillColor(colorHex('#C7D2FE')).font('Helvetica').fontSize(10);
  doc.text(`${res.evento_filtro}${res.evento ? `  ·  ${res.evento.estado}  ·  ${res.evento.fecha}` : ''}`, doc.page.margins.left + 14, y0 + 40);
  doc.font('Helvetica').fontSize(8).fillColor(colorHex('#94A3B8'));
  doc.text(`Documento generado el ${stamp} · Sistema MWT`, doc.page.margins.left + 14, y0 + 58, {
    width: totalWidth - 250,
    align: 'right',
  });

  let y = 108;

  function kpiBox(x: number, w: number, label: string, value: number | string, accent: string) {
    doc.roundedRect(x, y, w, 44, 4).fill(colorHex(MWT.LIGHT));
    doc.roundedRect(x, y, w, 3, 1.5).fill(colorHex(accent));
    doc.fillColor(colorHex(MWT.MUTED)).font('Helvetica-Bold').fontSize(6.5);
    doc.text(label.toUpperCase(), x + 8, y + 9, { width: w - 16, lineBreak: false });
    doc.fillColor(colorHex(MWT.NAVY)).font('Helvetica-Bold').fontSize(17);
    doc.text(String(value), x + 8, y + 19, { width: w - 16, lineBreak: false });
  }

  const gap = 10;
  const kpiW = (totalWidth - gap * 4) / 5;
  kpiBox(doc.page.margins.left, kpiW, 'Infracciones', res.kpis.infracciones, MWT.ROSE);
  kpiBox(doc.page.margins.left + (kpiW + gap), kpiW, 'Resueltas', res.kpis.resueltas, MWT.GREEN);
  kpiBox(doc.page.margins.left + (kpiW + gap) * 2, kpiW, 'Apelaciones', res.kpis.apelaciones, MWT.AMBER);
  kpiBox(doc.page.margins.left + (kpiW + gap) * 3, kpiW, 'Revis. técnicas', res.kpis.revisiones, MWT.BLUE);
  kpiBox(doc.page.margins.left + (kpiW + gap) * 4, kpiW, 'Evidencias', res.kpis.evidencias, MWT.CYAN);
  y += 60;

  function encabezadoSeccion(titulo: string, sub?: string) {
    ensureEspacio(52);
    doc.roundedRect(doc.page.margins.left, y, totalWidth, 22, 3).fill(colorHex(MWT.NAVY2));
    doc.fillColor(colorHex(MWT.CYAN)).font('Helvetica-Bold').fontSize(9);
    doc.text(titulo.toUpperCase(), doc.page.margins.left + 10, y + 7, { lineBreak: false, continued: false });
    if (sub) {
      doc.fillColor(colorHex('#94A3B8')).font('Helvetica').fontSize(7.5);
      doc.text(sub, doc.page.margins.left + 10 + doc.widthOfString(titulo.toUpperCase()) + 14, y + 8, { lineBreak: false });
    }
    y += 26;
  }

  function tabla(headers: Array<{ label: string; w: number; align?: 'left' | 'center' }>, rows: string[][]) {
    // Encabezados
    let x = doc.page.margins.left;
    const h = 18;
    for (const hd of headers) {
      doc.rect(x, y, hd.w, h).fill(colorHex(MWT.BLUE));
      doc.fillColor(colorHex(MWT.WHITE)).font('Helvetica-Bold').fontSize(6.5);
      doc.text(hd.label, x + 4, y + 6, { width: hd.w - 8, align: hd.align || 'left', lineBreak: false });
      x += hd.w;
    }
    y += h;
    ensureEspacio(h * 2);
    // Filas con cebra
    rows.forEach((row, ri) => {
      if (y + 18 > doc.page.height - doc.page.margins.bottom - 18) {
        doc.addPage();
        // repetir encabezado de columnas
        y = doc.page.margins.top + 4;
        let xx = doc.page.margins.left;
        for (const hd of headers) {
          doc.rect(xx, y, hd.w, h).fill(colorHex(MWT.BLUE));
          doc.fillColor(colorHex(MWT.WHITE)).font('Helvetica-Bold').fontSize(6.5);
          doc.text(hd.label, xx + 4, y + 6, { width: hd.w - 8, align: hd.align || 'left', lineBreak: false });
          xx += hd.w;
        }
        y += h;
      }
      if (ri % 2 === 0) doc.rect(doc.page.margins.left, y, totalWidth, 16).fill(colorHex(MWT.LIGHT));
      let cx = doc.page.margins.left;
      row.forEach((cell, ci) => {
        const hd = headers[ci];
        doc.fillColor(colorHex(MWT.NAVY)).font('Helvetica').fontSize(7.5);
        doc.text(String(cell ?? ''), cx + 4, y + 4.5, { width: hd.w - 8, align: hd.align || 'left', lineBreak: false });
        cx += hd.w;
      });
      y += 16;
    });
    y += 4;
  }

  function ensureEspacio(necesario: number) {
    if (y + necesario > doc.page.height - doc.page.margins.bottom - 16) {
      doc.addPage();
      y = doc.page.margins.top + 4;
    }
  }

  // Resumen por estado / tipo / categoría en tablas compactas
  const miniCols = [
    { label: 'CONCEPTO', w: 180 },
    { label: 'TOTAL', w: 60, align: 'center' as const },
  ];
  encabezadoSeccion('Distribución de infracciones', 'Por estado, tipo y categoría');
  const maxMini = Math.max(res.por_estado.length, res.por_tipo.length, res.por_categoria.length, 1);
  const filasEstadoT: string[][] = [];
  const filasTipo: string[][] = [];
  const filasCat: string[][] = [];
  for (let i = 0; i < maxMini; i++) {
    filasEstadoT.push([res.por_estado[i]?.estado || '', res.por_estado[i] ? String(res.por_estado[i].total) : '']);
    filasTipo.push([res.por_tipo[i]?.tipo || '', res.por_tipo[i] ? String(res.por_tipo[i].total) : '']);
    filasCat.push([res.por_categoria[i]?.categoria || '', res.por_categoria[i] ? String(res.por_categoria[i].total) : '']);
  }
  const miniW = (totalWidth - gap * 2) / 3;
  const miniTable = (x: number, titulo: string, rows: string[][]) => {
    doc.rect(x, y, miniW, 16).fill(colorHex(MWT.NAVY2));
    doc.fillColor(colorHex(MWT.CYAN)).font('Helvetica-Bold').fontSize(7);
    doc.text(titulo.toUpperCase(), x + 5, y + 4.5, { lineBreak: false });
    let yy = y + 16;
    rows.forEach((row, ri) => {
      if (ri % 2 === 0) doc.rect(x, yy, miniW, 13).fill(colorHex(MWT.LIGHT));
      doc.rect(x, yy + 13, miniW, 0.5).fill(colorHex('#E2E8F0'));
      doc.fillColor(colorHex(MWT.NAVY)).font('Helvetica').fontSize(7);
      doc.text(row[0], x + 5, yy + 3, { width: miniW - 34, lineBreak: false });
      doc.font('Helvetica-Bold').text(row[1], x + miniW - 32, yy + 3, { width: 26, align: 'right', lineBreak: false });
      yy += 13;
    });
    return yy;
  };
  const endIzq = miniTable(doc.page.margins.left, 'Por estado', filasEstadoT);
  miniTable(doc.page.margins.left + miniW + gap, 'Por tipo de infracción', filasTipo);
  miniTable(doc.page.margins.left + (miniW + gap) * 2, 'Por categoría', filasCat);
  y = Math.max(endIzq, y + filasEstadoT.length * 13 + 16) + 8;

  // Detalle de infracciones
  encabezadoSeccion('Detalle de infracciones registradas', `${res.infracciones.length} registro(s) · fechas y horas locales (es-GT)`);
  const headers = COLS_DETALLE.map((c) => ({ label: c.label, w: c.w, align: c.align }));
  const rows = res.infracciones.map((i) => COLS_DETALLE.map((c) => String(i[c.key])));
  tabla(headers, rows);
  if (!res.infracciones.length) {
    doc.fillColor(colorHex(MWT.MUTED)).font('Helvetica-Oblique').fontSize(8);
    doc.text('No hay infracciones registradas para el evento seleccionado.', doc.page.margins.left, y + 2);
    y += 16;
  }

  // Apelaciones
  if (res.apelaciones.length) {
    y += 6;
    encabezadoSeccion('Apelaciones presentadas', `${res.apelaciones.length} apelación(es)`);
    const colsApe = [
      { label: 'FECHA', w: 58, align: 'center' as const },
      { label: 'HORA', w: 42, align: 'center' as const },
      { label: 'PILOTO', w: 130 },
      { label: 'DOR', w: 32, align: 'center' as const },
      { label: 'CATEGORÍA', w: 90 },
      { label: 'SANCION CUESTIONADA', w: 130 },
      { label: 'ESTADO', w: 70, align: 'center' as const },
      { label: 'RESOLUCIÓN', w: 172 },
    ];
    const rowsApe = res.apelaciones.map((a) => [a.fecha, a.hora, a.piloto, a.dorsal, a.categoria, a.sancion, a.estado, a.resolucion || '—']);
    tabla(colsApe, rowsApe);
  }

  // Bloque de firma
  if (y + 70 > doc.page.height - doc.page.margins.bottom - 20) {
    doc.addPage();
    y = doc.page.margins.top + 10;
  }
  ensureEspacio(80);
  y += 14;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).lineWidth(0.75).strokeColor(colorHex('#CBD5E1')).stroke();
  y += 12;
  doc.fillColor(colorHex(MWT.NAVY)).font('Helvetica-Bold').fontSize(8.5);
  doc.text('VALIDACIÓN DEL COMISARIATO', doc.page.margins.left, y, { lineBreak: false });
  y += 26;
  for (const xLinea of [doc.page.margins.left + totalWidth / 4, doc.page.margins.left + (totalWidth * 3) / 4]) {
    doc.moveTo(xLinea - 70, y).lineTo(xLinea + 70, y).lineWidth(0.75).strokeColor(colorHex('#94A3B8')).stroke();
  }
  doc.fillColor(colorHex(MWT.MUTED)).font('Helvetica').fontSize(7);
  doc.text('Comisario Jefe', doc.page.margins.left + totalWidth / 4 - 70, y + 4, { width: 140, align: 'center' });
  doc.text('Director de Carrera', doc.page.margins.left + (totalWidth * 3) / 4 - 70, y + 4, { width: 140, align: 'center' });

  doc.end();
  return done;
}

export function nombreArchivoPDF(eventoNombre: string): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace(/[T:]/g, '-');
  return `Resumen-Comisariato-${slug(eventoNombre)}-${stamp}.pdf`;
}
