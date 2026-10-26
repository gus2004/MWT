import prisma from '../../prisma.config';
import * as fs from 'fs';
import * as path from 'path';
import { REGLAMENTO_DIR } from '../middlewares/upload.middleware';

// ─────────────────────────────────────────────
// REGLAMENTO POR EVENTO (PDF leído por la IA)
// El comisario sube el PDF del reglamento del evento; el sistema:
//  1) Extrae el texto del PDF (pdf-parse).
//  2) Detecta los artículos (ART. 12.1, ARTÍCULO 7 …) y los carga al
//     catálogo `reglamento_articulos` con origen "PDF" y evento_id.
//  3) La IA (LLM o motor local) PRIORIZA esos artículos al sugerir el
//     artículo aplicable y la sanción preliminar de una incidencia.
// Subir un PDF nuevo para el mismo evento reemplaza al anterior.
// ─────────────────────────────────────────────

// pdf-parse v2: la clase PDFParse se carga desde el paquete principal y lee
// el PDF desde un Buffer (el módulo se requiere con api node en CJS).
const { PDFParse } = require('pdf-parse');

export interface ArticuloDetectado {
  codigo: string;
  titulo: string;
  texto: string;
}

/** Extrae los artículos en formato "ART. / ARTÍCULO <código>" de un reglamento. */
export function extraerArticulos(texto: string): ArticuloDetectado[] {
  const t = (texto || '').replace(/\r/g, '');
  const patron =
    /(?:^|\n)\s*(?:ARTÍCULO|ARTICULO|ART)\.?\s*([0-9]{1,3}(?:\.[0-9]{1,2}){0,3})\.?\s*[-–—:)\.]?\s*/gi;

  const marcas: Array<{ codigo: string; indice: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = patron.exec(t)) !== null) {
    marcas.push({ codigo: `ART. ${m[1]}`, indice: m.index + m[0].length });
    if (marcas.length > 300) break; // salvaguarda
  }
  if (!marcas.length) return [];

  const articulos: ArticuloDetectado[] = [];
  for (let i = 0; i < marcas.length; i++) {
    const fin = i + 1 < marcas.length ? marcas[i + 1].indice : t.length;
    const cuerpo = t.slice(marcas[i].indice, fin).trim();
    if (cuerpo.length < 8) continue; // marcador vacío (ej. índice/tabla)
    const lineas = cuerpo.split('\n').filter((l) => l.trim());
    const titulo = (lineas[0] || '').replace(/^[-–—:)\.]+\s*/, '').trim().slice(0, 100) || 'Artículo del reglamento';
    const contenido = lineas.length > 1 ? lineas.slice(1).join(' ').replace(/\s+/g, ' ').trim().slice(0, 1800) : titulo;
    articulos.push({ codigo: marcas[i].codigo, titulo, texto: contenido });
  }
  return articulos;
}

function limpiarTexto(texto: string): string {
  return (texto || '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim();
}

export async function procesarReglamentoPdf(input: {
  rutaTemporal: string;
  nombreOriginal: string;
  eventoId: string;
  creadoPor?: string | null;
}): Promise<{ documentoId: string; paginas: number; articulos: number; caracteres: number; tipos_generados: number }> {
  const { rutaTemporal, nombreOriginal, eventoId, creadoPor } = input;

  if (!eventoId) throw new Error('Indica el evento al que pertenece el reglamento.');
  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
  if (!evento) throw new Error('El evento especificado no existe.');

  // 1) Leer y extraer
  let texto: string;
  let paginas: number;
  const parser = new PDFParse({ data: fs.readFileSync(rutaTemporal) });
  try {
    const data = await parser.getText();
    texto = limpiarTexto((data as any).text || '');
    paginas = (data as any).total ?? (data as any).pages?.length ?? 0;
  } catch (e: any) {
    try { await parser.destroy(); } catch { /* noop */ }
    throw new Error(`No se pudo leer el PDF del reglamento: ${e.message || 'formato no soportado'}`);
  } finally {
    try { await parser.destroy(); } catch { /* noop */ }
  }
  if (texto.length < 50) throw new Error('El PDF no contiene texto legible (parece solo imágenes). Reglamentos escaneados sin capa de texto no son procesables.');

  // 2) Detectar artículos
  const articulos = extraerArticulos(texto);

  // 3) Archivo definitivo
  const destino = path.join(REGLAMENTO_DIR, `ev-${eventoId.slice(0, 8)}-${Date.now()}.pdf`);
  fs.renameSync(rutaTemporal, destino);
  const rutaPublica = `/uploads/reglamento/${path.basename(destino)}`;

  // 4) Reemplaza el documento y los artículos PDF previos del evento
  await prisma.$executeRaw`DELETE FROM reglamento_articulos WHERE evento_id = ${eventoId} AND origen = 'PDF'`;
  await prisma.$executeRaw`DELETE FROM reglamento_documentos WHERE evento_id = ${eventoId}`;
  await prisma.$executeRaw`
    INSERT INTO reglamento_documentos (id, evento_id, nombre, ruta_archivo, paginas, texto, estado, creado_por)
    VALUES (gen_random_uuid(), ${eventoId}, ${nombreOriginal}, ${rutaPublica}, ${paginas}, ${texto.slice(0, 400000)}, 'PROCESADO', ${creadoPor || null})`;

  // 5) Cargar artículos al catálogo (origen PDF, asociados al evento)
  for (const art of articulos) {
    await prisma.$executeRaw`
      INSERT INTO reglamento_articulos (id, codigo, titulo, texto, evento_id, origen)
      VALUES (gen_random_uuid(), ${art.codigo}, ${art.titulo}, ${art.texto}, ${eventoId}, 'PDF')`;
  }

  // 6) Generar la TIPOLOGÍA DE INFRACCIONES del evento desde el reglamento:
  // cada artículo del PDF se convierte en un "Tipo de infracción" del evento
  // (ej. ACMG: "ART. 7.1 · Humo en la parrilla de largada"), que el comisario
  // elige en el wizard y que la IA usa para sugerir artículo + sanción.
  await prisma.tipoSancion.deleteMany({ where: { evento_id: eventoId } });
  let tiposGenerados = 0;
  for (const art of articulos) {
    if (!art.titulo || art.titulo === 'Artículo del reglamento') continue;
    await prisma.tipoSancion.create({
      data: {
        nombre: `${art.codigo} · ${art.titulo}`.slice(0, 120),
        descripcion: `Tipo generado del reglamento PDF del evento. ${art.texto}`.slice(0, 400),
        evento_id: eventoId,
        origen: 'PDF',
      },
    });
    tiposGenerados += 1;
    if (tiposGenerados >= 60) break; // salvaguarda
  }

  return {
    documentoId: 'ok',
    paginas: paginas,
    articulos: articulos.length,
    caracteres: texto.length,
    tipos_generados: tiposGenerados,
  };
}

export async function listReglamentoDocumentos() {
  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT d.id, d.evento_id, d.nombre, d.ruta_archivo, d.paginas, d.created_at, e.nombre AS evento_nombre,
            (SELECT COUNT(*)::int FROM reglamento_articulos a WHERE a.evento_id = d.evento_id) AS articulos
       FROM reglamento_documentos d JOIN eventos e ON e.id = d.evento_id
      ORDER BY d.created_at DESC`,
  );
  return rows;
}

export async function eliminarReglamentoPdf(eventoId: string) {
  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT id, ruta_archivo FROM reglamento_documentos WHERE evento_id = '${eventoId.replace(/'/g, "''")}'`,
  );
  if (!rows.length) throw new Error('El evento no tiene reglamento PDF registrado.');
  await prisma.$executeRaw`DELETE FROM reglamento_articulos WHERE evento_id = ${eventoId} AND origen = 'PDF'`;
  await prisma.$executeRaw`DELETE FROM reglamento_documentos WHERE evento_id = ${eventoId}`;
  // Borra el archivo físico (los PDF viven en uploads/reglamento)
  for (const r of rows) {
    const f = path.join(process.cwd(), (r.ruta_archivo || '').replace(/^\//, ''));
    try { fs.unlinkSync(f); } catch { /* ya no existe */ }
  }
  return { eliminado: true };
}
