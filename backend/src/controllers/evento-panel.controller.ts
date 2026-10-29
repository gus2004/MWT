import { Request, Response } from 'express';
import * as service from '../services/evento-panel.service';

const P2002_MESSAGE = 'Ya existe un registro con ese valor, verifica los datos';

function handleError(res: Response, err: any, fallback = 'Ocurrió un error') {
  if (err?.code === 'P2002') return res.status(409).json({ message: P2002_MESSAGE });
  return res.status(400).json({ message: err?.message || fallback });
}

export async function getResumen(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const data = await service.getResumen(evento_id);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo obtener el resumen del evento');
  }
}

export async function patchDatos(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const operadorId = String(req.body.usuario_id || req.body.operadorId || req.headers['x-usuario-id'] || '');
    if (!operadorId) return res.status(400).json({ message: 'usuario_id es requerido en el body para auditoría.' });

    const data = await service.updateDatos(evento_id, req.body, operadorId);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo actualizar los datos del evento');
  }
}

export async function getInscripciones(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const categoria_id = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : undefined;
    const items = await service.listInscripciones(evento_id, categoria_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar las inscripciones');
  }
}

export async function getClasificaciones(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await service.listClasificaciones(evento_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar las clasificaciones');
  }
}

export async function getResultados(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await service.listResultados(evento_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar los resultados');
  }
}

export async function exportarHorarioCSV(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { lineas } = await service.exportarHorarioCSV(evento_id);
    const csv = lineas.join('\n');
    const buffer = Buffer.from('\uFEFF' + csv, 'utf8');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Horario-Evento-${evento_id}.csv"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error exportando horario CSV.' });
  }
}

export async function exportarHorarioExcel(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const excel = await service.exportarHorarioExcel(evento_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Horario-Evento-${evento_id}.xlsx"`);
    res.setHeader('Content-Length', excel.length);
    return res.status(200).send(excel);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error exportando horario Excel.' });
  }
}

export async function exportarHorarioPDF(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const pdf = await service.exportarHorarioPDF(evento_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Horario-Evento-${evento_id}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    return res.status(200).send(pdf);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error exportando horario PDF.' });
  }
}

export async function generarHorarioAutomatico(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { vueltas, vueltas_por_categoria, fecha_evento, hora_inicio, mangas, duracion_por_heat } = req.body || {};
    const data = await service.generarHorarioAutomatico(evento_id, {
      vueltas: vueltas ? Number(vueltas) : undefined,
      vueltasPorCategoria: vueltas_por_categoria,
      fechaEvento: fecha_evento || undefined,
      horaInicio: hora_inicio || undefined,
      mangas: mangas ? Number(mangas) : undefined,
      duracionPorHeat: duracion_por_heat ? Number(duracion_por_heat) : undefined,
    });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error generando horario automático.' });
  }
}
