import prisma from '../../prisma.config';
import PDFDocument = require('pdfkit');
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const P2002_MESSAGE = 'Ya existe un registro con ese valor, verifica los datos';

export async function getResumen(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { campeonato: true, circuito: true },
  });

  if (!evento) throw new Error('Evento no encontrado');

  // Count inscritos por categoria para este evento
  const inscritos = await prisma.inscripcion.groupBy({
    by: ['categoria_id'],
    where: { evento_id: eventoId },
    _count: { categoria_id: true },
  });

  const conteoMap: Record<string, number> = {};
  inscritos.forEach((r) => (conteoMap[r.categoria_id] = r._count.categoria_id));

  const categorias = await prisma.categoria.findMany({
    where: {
      OR: [
        { campeonato_id: evento.campeonato_id },
        ...(inscritos.length ? [{ id: { in: inscritos.map((r) => r.categoria_id) } }] : []),
      ],
    },
    orderBy: { nombre: 'asc' },
  });
  const categoriasVisibles = Array.from(categorias.reduce((map, categoria) => {
    const anterior = map.get(categoria.nombre.toLowerCase());
    if (!anterior || (conteoMap[categoria.id] || 0) > (conteoMap[anterior.id] || 0)) {
      map.set(categoria.nombre.toLowerCase(), categoria);
    }
    return map;
  }, new Map<string, (typeof categorias)[number]>()).values());

  const categoriasConConteo = categoriasVisibles.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    cilindrada_min: c.cilindrada_min,
    cilindrada_max: c.cilindrada_max,
    precio_inscripcion: c.precio_inscripcion,
    total_inscritos: conteoMap[c.id] ?? 0,
  }));

  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  const cronograma = await prisma.actividadCronograma.findMany({
    where: { evento_id: eventoId },
    orderBy: { hora_inicio: 'asc' },
  });

  return {
    evento,
    categorias: categoriasConConteo,
    grupos,
    cronograma,
  };
}

export async function updateDatos(eventoId: string, payload: any, operadorId: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) throw new Error('Evento no encontrado');

  if (evento.estado === 'EN_CURSO' || evento.estado === 'FINALIZADO') {
    throw new Error('No se pueden modificar los datos de un evento en curso o finalizado');
  }

  const antes = {
    nombre: evento.nombre,
    fecha_inicio: evento.fecha_inicio,
    fecha_fin: evento.fecha_fin,
    costo_base: evento.costo_base,
    circuito_id: evento.circuito_id,
    visible_portada: evento.visible_portada,
  };

  try {
    const actualizado = await prisma.evento.update({
      where: { id: eventoId },
      data: {
        nombre: payload.nombre ?? evento.nombre,
        fecha_inicio: payload.fecha_inicio ? new Date(payload.fecha_inicio) : evento.fecha_inicio,
        fecha_fin: payload.fecha_fin ? new Date(payload.fecha_fin) : evento.fecha_fin,
        costo_base: payload.costo_base !== undefined ? Number(payload.costo_base) : evento.costo_base,
        circuito_id: payload.circuito_id ?? evento.circuito_id,
        visible_portada: payload.visible_portada !== undefined ? Boolean(payload.visible_portada) : evento.visible_portada,
      },
    });

    await prisma.auditoria.create({
      data: {
        usuario_id: operadorId,
        tabla_afectada: 'eventos',
        accion: 'UPDATE',
        registro_id: eventoId,
        valor_anterior: antes as any,
        valor_nuevo: {
          nombre: actualizado.nombre,
          fecha_inicio: actualizado.fecha_inicio.toISOString(),
          fecha_fin: actualizado.fecha_fin.toISOString(),
          costo_base: actualizado.costo_base,
          circuito_id: actualizado.circuito_id,
          visible_portada: actualizado.visible_portada,
        },
      },
    });

    return actualizado;
  } catch (err: any) {
    if (err?.code === 'P2002') throw new Error(P2002_MESSAGE);
    throw new Error('No se pudo actualizar el evento');
  }
}

export async function listInscripciones(eventoId: string, categoriaId?: string) {
  const where: any = { evento_id: eventoId };
  if (categoriaId) where.categoria_id = categoriaId;

  const items = await prisma.inscripcion.findMany({
    where,
    include: {
      piloto: { include: { usuario: true } },
      categoria: true,
      motocicleta: { include: { marca: true } },
      revision_tecnica: true,
    },
    orderBy: { fecha_registro: 'desc' },
  });

  return items;
}

export async function listClasificaciones(eventoId: string) {
  // For each group, get resultados_tiempos for inscripciones in this evento whose categoria_id is in group's categories
  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  const result = [];

  for (const grupo of grupos) {
    const categoriaIds = (grupo.categorias_en_grupo as any[]).map((cg: any) => cg.categoria_id);

    const resultados = await prisma.resultadoTiempo.findMany({
      where: {
        inscripcion: { evento_id: eventoId, categoria_id: { in: categoriaIds } },
      },
      include: {
        inscripcion: { include: { piloto: { include: { usuario: true } } } },
      },
      orderBy: { tiempo_total: 'asc' },
    });

    result.push({
      grupo_id: grupo.id,
      nombre: grupo.nombre,
      tiene_clasificacion: grupo.tiene_clasificacion,
      clasificacion_completada: grupo.clasificacion_completada,
      resultados: resultados.map((r) => ({
        piloto_nombre: r.inscripcion.piloto.usuario.nombre,
        piloto_apellido: r.inscripcion.piloto.usuario.apellido,
        dorsal: r.inscripcion.dorsal_asignado,
        mejor_vuelta: r.mejor_vuelta,
        tiempo_total: r.tiempo_total,
        puntos_ganados: r.puntos_ganados,
      })),
    });
  }

  return result;
}

export async function listResultados(eventoId: string) {
  // Group by grupo similar to clasificaciones but include heat info
  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  const out = [];

  for (const grupo of grupos) {
    const categoriaIds = (grupo.categorias_en_grupo as any[]).map((cg: any) => cg.categoria_id);

    const resultados = await prisma.resultadoTiempo.findMany({
      where: {
        inscripcion: { evento_id: eventoId, categoria_id: { in: categoriaIds } },
      },
      include: {
        inscripcion: { include: { piloto: { include: { usuario: true } } } },
        heat: true,
      },
      orderBy: [{ heat: { nombre: 'asc' } }, { posicion: 'asc' }],
    });

    out.push({
      grupo_id: grupo.id,
      nombre: grupo.nombre,
      resultados: resultados.map((r) => ({
        heat_id: r.heat_id,
        heat_nombre: r.heat?.nombre,
        posicion: r.posicion,
        piloto_nombre: r.inscripcion.piloto.usuario.nombre,
        piloto_apellido: r.inscripcion.piloto.usuario.apellido,
        dorsal: r.inscripcion.dorsal_asignado,
        vueltas: r.vueltas_completadas,
        tiempo_total: r.tiempo_total,
        puntos_ganados: r.puntos_ganados,
      })),
    });
  }

  return out;
}

export async function exportarHorarioCSV(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { campeonato: true, circuito: true },
  });
  if (!evento) throw new Error('Evento no encontrado');

  const cronograma = await prisma.actividadCronograma.findMany({
    where: { evento_id: eventoId },
    orderBy: { hora_inicio: 'asc' },
  });

  const fechaEvento = new Date(evento.fecha_inicio).toLocaleDateString('es-GT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).toUpperCase();

  const lineas: string[] = [];
  lineas.push(`CAMPEONATO ${(evento.campeonato as any)?.nombre || 'MOTORSPORT DE GUATEMALA'}`);
  lineas.push(`${(evento.campeonato as any)?.nombre || ''}`);
  lineas.push(fechaEvento);
  lineas.push('');
  lineas.push('NO. DE HEAT,HORARIO,CATEGORÍA,SESIÓN,VUELTAS');

  let heat = 1;
  let mangaAnterior = 1;

  for (const act of cronograma) {
    const ini = new Date(act.hora_inicio);
    const fin = new Date(act.hora_fin);
    const hi = ini.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hf = fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

    const mangaActual = Number(/^heat\s*(\d+)/i.exec(String(act.nombre || '').trim())?.[1] || 1);
    if (mangaActual > mangaAnterior) {
      lineas.push(`${mangaActual}A MANGA`);
      mangaAnterior = mangaActual;
    }


    const categoria = (act.descripcion || 'CG LIBRE').split(' · ')[0].trim().toUpperCase();
    const sesion = (act.nombre || 'CARRERA 1').toUpperCase();
    const vueltas = '5 VUELTAS';

    lineas.push(`${heat},${hi} - ${hf},${categoria},${sesion},${vueltas}`);
    heat++;
  }

  return { evento, lineas, fechaEvento };
}

export async function exportarHorarioExcel(eventoId: string): Promise<Buffer> {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { campeonato: true, circuito: true },
  });
  if (!evento) throw new Error('Evento no encontrado');

  const cronograma = await prisma.actividadCronograma.findMany({
    where: { evento_id: eventoId },
    orderBy: { hora_inicio: 'asc' },
  });
  const publicDir = path.resolve(__dirname, '../../../frontend/public');
  const modalidadTexto = `${evento.nombre} ${evento.campeonato?.nombre || ''}`.toUpperCase();
  const copaLogo = modalidadTexto.includes('YAMAHA') ? 'Yamaha-Logо.png' : 'LOGO-ACMG.png';
  const logoMwt = path.join(publicDir, 'MWT - COLORS.png');
  const logoCopa = path.join(publicDir, copaLogo);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MWT Motorsport';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Horario', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
    properties: { defaultRowHeight: 20 },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  worksheet.columns = [
    { key: 'heat', width: 10 },
    { key: 'horario', width: 18 },
    { key: 'categoria', width: 32 },
    { key: 'manga', width: 12 },
    { key: 'vueltas', width: 14 },
  ];
  worksheet.mergeCells('A1:E1');
  worksheet.mergeCells('A2:E2');
  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A1').value = 'HORARIO OFICIAL DE HEATS';
  worksheet.getCell('A2').value = evento.campeonato?.nombre || evento.nombre;
  worksheet.getCell('A3').value = `${new Date(evento.fecha_inicio).toLocaleDateString('es-GT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} · ${(evento.circuito as any)?.nombre || ''}`;
  ['A1', 'A2', 'A3'].forEach((cell) => {
    worksheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  worksheet.getRow(1).height = 28;
  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 20;
  worksheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
  worksheet.getCell('A2').font = { bold: true, color: { argb: 'FFFFD700' }, size: 12 };
  worksheet.getCell('A3').font = { color: { argb: 'FFFFFFFF' }, size: 10 };
  ['A1', 'A2', 'A3'].forEach((cell) => { worksheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC01818' } }; });
  if (fs.existsSync(logoMwt)) {
    const imageId = workbook.addImage({ filename: logoMwt, extension: 'png' });
    worksheet.addImage(imageId, { tl: { col: 0.1, row: 0.15 }, ext: { width: 105, height: 35 } });
  }
  if (fs.existsSync(logoCopa)) {
    const imageId = workbook.addImage({ filename: logoCopa, extension: 'png' });
    worksheet.addImage(imageId, { tl: { col: 4.1, row: 0.15 }, ext: { width: 85, height: 38 } });
  }

  const encabezado = worksheet.addRow(['HEAT', 'HORARIO', 'CATEGORÍA', 'MANGA', 'VUELTAS']);
  encabezado.height = 24;
  encabezado.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF08111F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
  });

  let heat = 1;
  let mangaAnterior = 1;
  for (const act of cronograma) {
    const manga = Number(/^heat\s*(\d+)/i.exec(String(act.nombre || '').trim())?.[1] || 1);
    if (manga > mangaAnterior) {
      const separador = worksheet.addRow([`${manga}A MANGA`]);
      worksheet.mergeCells(`A${separador.number}:E${separador.number}`);
      separador.height = 20;
      separador.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      separador.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF08111F' } };
      mangaAnterior = manga;
    }
    const ini = new Date(act.hora_inicio);
    const fin = new Date(act.hora_fin);
    const categoria = (act.descripcion || 'CG LIBRE').split(' · ')[0].trim().toUpperCase();
    const vueltas = ((act.descripcion || '').match(/·\s*(\d+)\s*VUELTAS/i)?.[1] || '5') + ' VUELTAS';
    const fila = worksheet.addRow([
      heat,
      `${ini.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
      categoria,
      manga,
      vueltas,
    ]);
    fila.eachCell((cell, index) => {
      cell.alignment = { horizontal: index === 3 ? 'left' : 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } } };
      if (heat % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    });
    heat++;
  }
  worksheet.autoFilter = { from: 'A4', to: `E${worksheet.rowCount}` };
  worksheet.pageSetup.printArea = `A1:E${worksheet.rowCount}`;
  worksheet.headerFooter.oddFooter = '&CHorario generado por MWT Motorsport';
  return Buffer.from(await workbook.xlsx.writeBuffer());
    }


// ═══════════════════════════════════════════════════════════════════════
//  EXPORTACIÓN PDF DEL HORARIO (diseño estilo ACMG)
// ═══════════════════════════════════════════════════════════════════════

export async function exportarHorarioPDF(eventoId: string): Promise<Buffer> {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { campeonato: true, circuito: true },
  });
  if (!evento) throw new Error('Evento no encontrado');

  const cronograma = await prisma.actividadCronograma.findMany({
    where: { evento_id: eventoId },
    orderBy: { hora_inicio: 'asc' },
  });

  const fechaEvento = new Date(evento.fecha_inicio).toLocaleDateString('es-GT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).toUpperCase();

  const doc: any = new PDFDocument({
    layout: 'portrait',
    size: 'A4',
    margin: { top: 24, bottom: 24, left: 28, right: 28 } as any,
    info: { Title: `Horario - ${evento.nombre}`, Author: 'MWT Motorsport' },
  });

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const ROJO = '#C01818';
  const NAVY = '#08111F';
  const GRIS = '#94A3B8';
  const publicDir = path.resolve(__dirname, '../../../frontend/public');
  const modalidadTexto = `${evento.nombre} ${evento.campeonato?.nombre || ''}`.toUpperCase();
  const copaLogo = modalidadTexto.includes('YAMAHA') ? 'Yamaha-Logо.png' : 'LOGO-ACMG.png';
  const logoMwt = path.join(publicDir, 'MWT - COLORS.png');
  const logoCopa = path.join(publicDir, copaLogo);
  const logoDisponible = (archivo: string) => fs.existsSync(archivo);

  const filas = cronograma.length;
  const encabezadoAlto = 92;
  const pieAlto = 28;
  const espacioFilas = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - encabezadoAlto - pieAlto;
  const altoFila = Math.max(12, Math.min(20, Math.floor(espacioFilas / Math.max(filas, 1))));
  const fuenteFila = Math.max(6, Math.min(8.5, altoFila * 0.48));
  const yInicioTabla = doc.page.margins.top + encabezadoAlto;
  const colX = [doc.page.margins.left, doc.page.margins.left + 54, doc.page.margins.left + 126, doc.page.margins.left + 280, doc.page.margins.left + 360];
  const colW = [46, 72, 154, 80, pageWidth - 360];

  doc.rect(0, 0, doc.page.width, encabezadoAlto).fill(ROJO);
  if (logoDisponible(logoMwt)) doc.image(logoMwt, doc.page.margins.left, 8, { fit: [92, 34] });
  if (logoDisponible(logoCopa)) doc.image(logoCopa, doc.page.width - doc.page.margins.right - 78, 8, { fit: [78, 38] });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12);
  doc.text('HORARIO OFICIAL DE HEATS', doc.page.margins.left + 100, 14, { width: pageWidth - 200, align: 'center', lineBreak: false });
  doc.fillColor('#FFD700').fontSize(9);
  doc.text(evento.campeonato?.nombre || evento.nombre, doc.page.margins.left + 100, 31, { width: pageWidth - 200, align: 'center', lineBreak: false });
  doc.fillColor('#FFFFFF').font('Helvetica').fontSize(8);
  doc.text(`${fechaEvento} · ${(evento.circuito as any)?.nombre || ''}`, doc.page.margins.left + 100, 46, { width: pageWidth - 200, align: 'center', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
  doc.text('MANGA 1 → MANGA 2', doc.page.margins.left + 100, 62, { width: pageWidth - 200, align: 'center', lineBreak: false });

  doc.rect(doc.page.margins.left, yInicioTabla - 18, pageWidth, 18).fill(NAVY);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(Math.max(6, fuenteFila));
  ['HEAT', 'HORARIO', 'CATEGORÍA', 'MANGA', 'VUELTAS'].forEach((h: string, i: number) => {
    doc.text(h, colX[i] + 4, yInicioTabla - 13, { width: colW[i] - 8, align: 'center', lineBreak: false });
  });
  let y = yInicioTabla;

  let heat = 1;
  let mangaAnterior = 1;

  for (const act of cronograma) {
    const ini = new Date(act.hora_inicio);
    const fin = new Date(act.hora_fin);
    const hi = ini.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hf = fin.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

    const mangaActual = Number(/^heat\s*(\d+)/i.exec(String(act.nombre || '').trim())?.[1] || 1);
    if (mangaActual > mangaAnterior) {
      doc.rect(doc.page.margins.left, y, pageWidth, Math.min(12, altoFila)).fill(NAVY);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      doc.text(`${mangaActual}A MANGA`, doc.page.margins.left + 8, y + 2, { lineBreak: false });
      y += Math.min(16, altoFila + 4);
      mangaAnterior = mangaActual;
    }

    const categoria = (act.descripcion || 'CG LIBRE').split(' · ')[0].trim().toUpperCase();
    const sesion = (act.nombre || 'HEAT 1').replace(/^heat\s*/i, '').toUpperCase();
    const vueltas = ((act.descripcion || '').match(/·\s*(\d+)\s*VUELTAS/i)?.[1] || '5') + ' VUELTAS';
    const rowHeight = altoFila;

    const bg = heat % 2 === 1 ? '#FFFFFF' : '#F5F5F5';
    doc.rect(doc.page.margins.left, y, pageWidth, rowHeight).fill(bg);

    const values = [String(heat), `${hi} - ${hf}`, categoria, sesion, vueltas];
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(fuenteFila);
    values.forEach((v: string, i: number) => {
      doc.text(v, colX[i] + 4, y + Math.max(2, (rowHeight - fuenteFila) / 2), { width: colW[i] - 8, align: i === 1 || i === 0 ? 'center' : 'left', lineBreak: false });
    });

    y += rowHeight + 2;
    heat++;
  }

  // Pie de página
  y = doc.page.height - doc.page.margins.bottom - pieAlto;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).lineWidth(0.75).strokeColor(GRIS).stroke();
  y += 8;
  doc.fillColor(GRIS).font('Helvetica-Oblique').fontSize(7.5);
  doc.text('Todos los pilotos deben estar 30 minutos antes de su categoría / deberán estar atentos a los llamados a parrilla.', doc.page.margins.left, y, { width: pageWidth, align: 'center', lineBreak: false });
  y += 10;
  doc.text('Nota: este horario está sujeto a posibles cambios por dirección de evento, organización, cantidad de pilotos o clima.', doc.page.margins.left, y, { width: pageWidth, align: 'center', lineBreak: false });

  doc.end();
  return done;
}

// ═══════════════════════════════════════════════════════════════════════
//  GENERACIÓN AUTOMÁTICA DE HORARIO
// ═══════════════════════════════════════════════════════════════════════

export async function generarHorarioAutomatico(eventoId: string, input: {
  vueltas?: number;
  vueltasPorCategoria?: Record<string, number>;
  fechaEvento?: string;
  horaInicio?: string;
  mangas?: number;
  duracionPorHeat?: number;
}) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { campeonato: true },
  });
  if (!evento) throw new Error('Evento no encontrado');

  // Borrar cronograma existente para regenerar limpio
  await prisma.actividadCronograma.deleteMany({ where: { evento_id: eventoId } });

  const inicio = new Date(evento.fecha_inicio);
  if (input.fechaEvento) {
    const fecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.fechaEvento);
    if (!fecha) throw new Error('La fecha de los heats debe tener el formato AAAA-MM-DD.');
    inicio.setFullYear(Number(fecha[1]), Number(fecha[2]) - 1, Number(fecha[3]));
    if (Number.isNaN(inicio.getTime())) throw new Error('La fecha de los heats no es válida.');
  }
  const horaInicio = String(input.horaInicio || '').trim();
  if (horaInicio) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(horaInicio);
    if (!match) throw new Error('La hora de inicio debe tener el formato HH:MM.');
    if (Number(match[1]) > 23 || Number(match[2]) > 59) {
      throw new Error('La hora de inicio no es válida.');
    }
    inicio.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }
  const fin = new Date(inicio);
  fin.setHours(23, 59, 59, 999);
  const primerDia = new Date(evento.fecha_inicio);
  primerDia.setHours(0, 0, 0, 0);
  const ultimoDia = new Date(evento.fecha_fin);
  ultimoDia.setHours(23, 59, 59, 999);
  if (inicio < primerDia || inicio > ultimoDia) {
    throw new Error('El día seleccionado debe estar dentro de las fechas del evento.');
  }

  // Parámetros del usuario con valores por defecto
  const vueltasUsuario = input.vueltas ?? 5;
  const sesionesUsuario = Math.max(1, Math.min(20, Math.floor(input.mangas ?? 2)));
  const duracionUsuario = input.duracionPorHeat ?? 30;
  const transicion = 5; // minutos entre actividades

  // Obtener categorías con inscripciones en este evento
  const inscripciones = await prisma.inscripcion.findMany({
    where: { evento_id: eventoId },
    select: { categoria_id: true },
    distinct: ['categoria_id'],
  });
  const categoriaIds = [...new Set(inscripciones.map((i) => i.categoria_id))];

  let categorias: any[] = [];
  if (categoriaIds.length > 0) {
    categorias = await prisma.categoria.findMany({
      where: { id: { in: categoriaIds } },
      orderBy: { nombre: 'asc' },
    });
  } else {
    // Fallback: categorías del campeonato
    categorias = await prisma.categoria.findMany({
      where: { campeonato_id: evento.campeonato_id },
      orderBy: { nombre: 'asc' },
    });
  }

  if (categorias.length === 0) {
    throw new Error('No hay categorías definidas para este evento.');
  }

  const totalMinutosDisponibles = Math.round((fin.getTime() - inicio.getTime()) / 60000);

  // Validar que las sesiones pedidas quepan en el tiempo disponible
  const totalActividades = categorias.length * sesionesUsuario;
  const totalTransiciones = Math.max(0, totalActividades - 1);
  const tiempoParaCarreras = totalMinutosDisponibles - totalTransiciones * transicion;

  let duracionPorHeat = duracionUsuario;

  // Si el tiempo pedido por heat excede lo disponible, ajustar automáticamente
  const tiempoNecesario = totalActividades * duracionUsuario + totalTransiciones * transicion;
  if (tiempoNecesario > totalMinutosDisponibles) {
    // Ajustar duración para que quepa exactamente
    duracionPorHeat = Math.max(10, Math.floor(tiempoParaCarreras / totalActividades));
  }
  if (duracionPorHeat * totalActividades + totalTransiciones * transicion > totalMinutosDisponibles) {
    throw new Error('Los heats no caben en el mismo día desde la hora de inicio indicada.');
  }

  const actividades = [];
  let horaActual = new Date(inicio);

  // Ejecutar una manga completa para todas las categorías antes de iniciar
  // la siguiente manga: Heat 1 de cada categoría, luego Heat 2 de cada una.
  for (let s = 1; s <= sesionesUsuario; s++) {
    for (const cat of categorias) {
      const vueltasCategoria = Number(input.vueltasPorCategoria?.[cat.id] ?? vueltasUsuario);
      if (!Number.isInteger(vueltasCategoria) || vueltasCategoria < 1 || vueltasCategoria > 100) {
        throw new Error(`Las vueltas de ${cat.nombre} deben estar entre 1 y 100.`);
      }
      const vueltasTexto = `${vueltasCategoria} VUELTAS`;
      const horaFin = new Date(horaActual.getTime() + duracionPorHeat * 60000);

      actividades.push({
        evento_id: eventoId,
        nombre: `Heat ${s}`,
        descripcion: `${cat.nombre} · ${vueltasTexto}`,
        hora_inicio: horaActual,
        hora_fin: horaFin,
        es_pista: true,
      });

      horaActual = new Date(horaFin.getTime() + transicion * 60000);
    }
  }

  if (actividades.length === 0) {
    throw new Error('No se pudo generar el horario: el tiempo del evento es insuficiente para las categorías.');
  }

  const creadas = await prisma.actividadCronograma.createMany({
    data: actividades,
  });

  return {
    creadas: creadas.count,
    actividades,
    resumen: {
      categorias: categorias.length,
      sesionesPorCategoria: sesionesUsuario,
      duracionPorHeat,
      vueltas: vueltasUsuario,
      transicion,
      totalMinutosDisponibles,
      tiempoUtilizado: actividades.reduce((acc) => acc + duracionPorHeat, 0) + totalTransiciones * transicion,
    },
  };
}
