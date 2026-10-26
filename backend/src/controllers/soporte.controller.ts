import { Request, Response } from 'express';
import * as soporteService from '../services/soporte.service';
import * as reportService from '../services/comisariato-report.service';
import * as reglamentoPdfService from '../services/reglamento-pdf.service';
import { calificarIncidencia, alertasRiesgo } from '../services/ia.service';
import { tipoEvidencia } from '../middlewares/upload.middleware';

// ── Asistente IA del comisariato ─────────────────────────────

export async function iaCalificarIncidencia(req: Request, res: Response) {
  try {
    const { descripcion, tipo_infraccion, articulo, dorsal, evento, evento_id, categoria } = req.body || {};
    if (!descripcion?.trim()) return res.status(400).json({ message: 'La descripción de la incidencia es requerida.' });
    const data = await calificarIncidencia({ descripcion, tipo_infraccion, articulo, dorsal, evento, evento_id, categoria });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error del asistente IA.' });
  }
}

export async function iaAlertasRiesgo(_req: Request, res: Response) {
  try {
    const items = await alertasRiesgo();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error calculando alertas de riesgo.' });
  }
}

export async function listSanciones(_req: Request, res: Response) {
  try {
    const items = await soporteService.listSanciones();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo sanciones.' });
  }
}

export async function createSancion(req: Request, res: Response) {
  try {
    const { inscripcion_id, comisario_id, tipo_sancion_id, motivo, estado, penalizacion, evidencias } = req.body;
    if (!inscripcion_id) return res.status(400).json({ message: 'inscripcion_id es requerido.' });
    if (!motivo?.trim()) return res.status(400).json({ message: 'El motivo es requerido.' });

    const data = await soporteService.createSancion({
      inscripcion_id,
      comisario_id,
      tipo_sancion_id,
      motivo,
      estado,
      penalizacion,
      evidencias,
    });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error creando sanción.' });
  }
}

export async function updateSancion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { estado, motivo, penalizacion, tipo_sancion_id } = req.body;
    const data = await soporteService.updateSancion(id, { estado, motivo, penalizacion, tipo_sancion_id });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error actualizando sanción.' });
  }
}

export async function listTiposSancion(_req: Request, res: Response) {
  try {
    const items = await soporteService.listTiposSancion();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo tipos de sanción.' });
  }
}

export async function createTipoSancion(req: Request, res: Response) {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ message: 'El nombre es requerido.' });
    const data = await soporteService.createTipoSancion({ nombre, descripcion });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error creando tipo de sanción.' });
  }
}

export async function listApelaciones(_req: Request, res: Response) {
  try {
    const items = await soporteService.listApelaciones();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo apelaciones.' });
  }
}

export async function createApelacion(req: Request, res: Response) {
  try {
    const { sancion_id, inscripcion_id, piloto_id, motivo } = req.body;
    if (!sancion_id || !inscripcion_id || !piloto_id) {
      return res.status(400).json({ message: 'sancion_id, inscripcion_id y piloto_id son requeridos.' });
    }
    if (!motivo?.trim()) return res.status(400).json({ message: 'El motivo es requerido.' });
    const data = await soporteService.createApelacion({ sancion_id, inscripcion_id, piloto_id, motivo });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error creando apelación.' });
  }
}

export async function updateApelacion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { estado, resolucion, comisario_id } = req.body;
    const data = await soporteService.updateApelacion(id, { estado, resolucion, comisario_id });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error actualizando apelación.' });
  }
}

export async function listItemsChecklist(_req: Request, res: Response) {
  try {
    const items = await soporteService.listItemsChecklist();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo checklist.' });
  }
}

export async function listRevisionesTecnicas(_req: Request, res: Response) {
  try {
    const items = await soporteService.listRevisionesTecnicas();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo revisiones técnicas.' });
  }
}

export async function updateRevisionTecnica(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { estado, observaciones, detalles } = req.body;
    const data = await soporteService.updateRevisionTecnica(id, { estado, observaciones, detalles });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error actualizando revisión técnica.' });
  }
}

export async function listNotificaciones(req: Request, res: Response) {
  try {
    const items = await soporteService.listNotificaciones();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo notificaciones.' });
  }
}

export async function createNotificacion(req: Request, res: Response) {
  try {
    const { usuario_id, evento_id, titulo, mensaje, tipo } = req.body;
    if (!titulo?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ message: 'titulo y mensaje son requeridos.' });
    }
    const data = await soporteService.createNotificacion({ usuario_id, evento_id, titulo, mensaje, tipo });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error creando notificación.' });
  }
}

export async function marcarNotificacionLeida(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const leida = req.body?.leida !== false;
    const data = await soporteService.marcarNotificacionLeida(id, leida);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error actualizando notificación.' });
  }
}

export async function listPlantillas(_req: Request, res: Response) {
  try {
    const items = await soporteService.listPlantillasConFallback();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo plantillas.' });
  }
}

export async function createPlantilla(req: Request, res: Response) {
  try {
    const { clave, titulo, cuerpo, tipo, descripcion } = req.body;
    if (!clave?.trim() || !titulo?.trim() || !cuerpo?.trim()) {
      return res.status(400).json({ message: 'clave, titulo y cuerpo son requeridos.' });
    }
    const data = await soporteService.createPlantilla({ clave, titulo, cuerpo, tipo, descripcion });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error guardando plantilla.' });
  }
}

export async function listPreferencias(_req: Request, res: Response) {
  try {
    const items = await soporteService.listPreferencias();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo preferencias.' });
  }
}

export async function updatePreferencia(req: Request, res: Response) {
  try {
    const { clave } = req.params;
    const { valor } = req.body;
    if (valor === undefined) return res.status(400).json({ message: 'valor es requerido.' });
    const data = await soporteService.updatePreferencia(clave, String(valor));
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error actualizando preferencia.' });
  }
}

export async function listAuditoria(req: Request, res: Response) {
  try {
    const items = await soporteService.listAuditoria();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo auditoría.' });
  }
}

export async function getReporteResumen(_req: Request, res: Response) {
  try {
    const data = await soporteService.getReporteResumen();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error generando resumen de reportes.' });
  }
}
// -- Cat�logo del reglamento (alimenta la IA del comisariato) --

export async function listReglamento(_req: Request, res: Response) {
  try {
    const items = await soporteService.listReglamento();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo el cat�logo del reglamento.' });
  }
}

export async function createArticuloReglamento(req: Request, res: Response) {
  try {
    const { codigo, titulo, texto, area } = req.body || {};
    const creado_por = (req as any).user?.id || '';
    const data = await soporteService.createArticuloReglamento({ codigo, titulo, texto, area, creado_por });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error registrando art�culo del reglamento.' });
  }
}

export async function deleteArticuloReglamento(req: Request, res: Response) {
  try {
    const data = await soporteService.deleteArticuloReglamento(req.params.id);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error eliminando art�culo del reglamento.' });
  }
}

// -- Evidencias de incidencias (im�genes y videos; solo respaldo, sin an�lisis IA) --

export async function uploadEvidencia(req: Request, res: Response) {
  try {
    const file: any = (req as any).file;
    if (!file) {
      return res.status(400).json({
        message: 'Archivo no admitido. Formatos permitidos: JPG, PNG, WEBP, GIF, MP4, MOV y WEBM.',
      });
    }
    const tipo = tipoEvidencia(file.mimetype);
    if (!tipo) return res.status(400).json({ message: 'Tipo de archivo no admitido.' });

    const creado_por = (req as any).user?.id || '';
    const inscripcion_id = typeof req.body?.inscripcion_id === 'string' ? req.body.inscripcion_id : undefined;

    const evidencia = await soporteService.createEvidencia({
      tipo,
      nombre: file.originalname,
      ruta_archivo: `/uploads/evidencias/${file.filename}`,
      mime: file.mimetype,
      tamano: file.size,
      inscripcion_id,
      creado_por,
    });
    return res.status(201).json(evidencia);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error guardando la evidencia.' });
  }
}

export async function listEvidencias(req: Request, res: Response) {
  try {
    const items = await soporteService.listEvidencias({
      inscripcion_id: (req.query.inscripcion_id as string) || undefined,
      sancion_id: (req.query.sancion_id as string) || undefined,
      soloSinSancion: req.query.soloSinSancion === '1' || req.query.soloSinSancion === 'true',
    });
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo evidencias.' });
  }
}

export async function deleteEvidencia(req: Request, res: Response) {
  try {
    const data = await soporteService.deleteEvidencia(req.params.id);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error eliminando la evidencia.' });
  }
}

// -- Reportes del comisariato (resumen por evento � CSV � PDF) --

export async function comisariatoResumen(req: Request, res: Response) {
  try {
    const eventoId = (req.query.evento_id as string) || undefined;
    const data = await reportService.resumenComisariato(eventoId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error generando el resumen del comisariato.' });
  }
}

export async function comisariatoExportCSV(req: Request, res: Response) {
  try {
    const eventoId = (req.query.evento_id as string) || undefined;
    const resumen = await reportService.resumenComisariato(eventoId);
    const csv = reportService.construirCSV(resumen);
    // BOM para que Excel muestre acentos y � correctamente
    const buffer = Buffer.from('\uFEFF' + csv, 'utf8');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportService.nombreArchivoCSV(resumen.evento_filtro)}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error exportando el CSV del comisariato.' });
  }
}

export async function comisariatoExportPDF(req: Request, res: Response) {
  try {
    const eventoId = (req.query.evento_id as string) || undefined;
    const resumen = await reportService.resumenComisariato(eventoId);
    const pdf = await reportService.construirPDF(resumen);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportService.nombreArchivoPDF(resumen.evento_filtro)}"`);
    res.setHeader('Content-Length', pdf.length);
    return res.status(200).send(pdf);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error exportando el PDF del comisariato.' });
  }
}

// -- Reglamento por evento (PDF que la IA del comisariato S� lee) --

export async function uploadReglamentoDocumento(req: Request, res: Response) {
  try {
    const evento_id = (req.body?.evento_id as string) || '';
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: 'Adjunta el PDF del reglamento (campo "archivo").' });
    const creado_por = (req as any).user?.id || '';
    const data = await reglamentoPdfService.procesarReglamentoPdf({
      rutaTemporal: file.path,
      nombreOriginal: file.originalname || 'reglamento.pdf',
      eventoId: evento_id,
      creadoPor: creado_por,
    });
    return res.status(201).json({ message: 'Reglamento le�do y registrado.', ...data });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error procesando el PDF del reglamento.' });
  }
}

export async function listReglamentoDocumentos(_req: Request, res: Response) {
  try {
    const items = await reglamentoPdfService.listReglamentoDocumentos();
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error listando los reglamentos.' });
  }
}

export async function deleteReglamentoDocumento(req: Request, res: Response) {
  try {
    const data = await reglamentoPdfService.eliminarReglamentoPdf(req.params.eventoId);
    return res.status(200).json({ message: 'Reglamento del evento eliminado.', ...data });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error eliminando el reglamento del evento.' });
  }
}
