import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import * as eventosService from '../services/eventos.service';

const P2002_MESSAGE = 'Ya existe un registro con ese valor único, verifica los datos e intenta de nuevo';

function handleError(res: Response, error: any, fallback: string, status = 400) {
  if (error?.code === 'P2002' || error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(409).json({ message: P2002_MESSAGE });
  }

  if (error?.message && typeof error.message === 'string') {
    return res.status(status).json({ message: error.message });
  }

  return res.status(500).json({ message: fallback });
}

export async function createEvento(req: Request, res: Response) {
  try {
    const { nombre, campeonato_id, circuito_id, fecha_inicio, fecha_fin, costo_base, visible_portada, usuario_id } = req.body;

    if (!nombre || !campeonato_id || !circuito_id || !fecha_inicio || !usuario_id) {
      return res
        .status(400)
        .json({ message: 'nombre, campeonato_id, circuito_id, fecha_inicio y usuario_id son requeridos.' });
    }

    const data = await eventosService.crearEvento({
      nombre,
      campeonato_id,
      circuito_id,
      fecha_inicio,
      fecha_fin,
      costo_base: costo_base !== undefined ? Number(costo_base) : undefined,
      visible_portada: visible_portada !== undefined ? Boolean(visible_portada) : undefined,
      usuario_id,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible crear el evento.');
  }
}

export async function updateEvento(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { nombre, campeonato_id, circuito_id, fecha_inicio, fecha_fin, costo_base, visible_portada, usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ message: 'usuario_id es requerido para auditoría.' });
    }

    const data = await eventosService.actualizarEvento({
      evento_id,
      nombre,
      campeonato_id,
      circuito_id,
      fecha_inicio,
      fecha_fin,
      costo_base: costo_base !== undefined ? Number(costo_base) : undefined,
      visible_portada: visible_portada !== undefined ? Boolean(visible_portada) : undefined,
      usuario_id,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible actualizar el evento.');
  }
}

export async function listEventos(req: Request, res: Response) {
  try {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
    const items = await eventosService.listarEventos(estado);
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No fue posible listar eventos.' });
  }
}

export async function getEvento(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const item = await eventosService.obtenerEvento(evento_id);
    return res.status(200).json(item);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible obtener el evento.', 404);
  }
}

export async function updateEstadoEvento(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { estado_nuevo, usuario_id } = req.body;

    if (!estado_nuevo || !usuario_id) {
      return res.status(400).json({ message: 'estado_nuevo y usuario_id son requeridos.' });
    }

    const data = await eventosService.cambiarEstadoEvento({
      evento_id,
      estado_nuevo,
      usuario_id,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible cambiar el estado del evento.');
  }
}

export async function createActividad(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { nombre, hora_inicio, hora_fin, descripcion, es_pista } = req.body;

    if (!nombre || !hora_inicio || !hora_fin) {
      return res.status(400).json({ message: 'nombre, hora_inicio y hora_fin son requeridos.' });
    }

    const data = await eventosService.crearActividadCronograma({
      evento_id,
      nombre,
      hora_inicio,
      hora_fin,
      descripcion,
      es_pista: Boolean(es_pista),
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible crear la actividad del cronograma.');
  }
}

export async function listCronograma(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await eventosService.listarCronograma(evento_id);
    return res.status(200).json({ items });
  } catch (error: any) {
    return handleError(res, error, 'No fue posible listar el cronograma.', 404);
  }
}

export async function updateActividad(req: Request, res: Response) {
  try {
    const { evento_id, actividad_id } = req.params;
    const { nombre, hora_inicio, hora_fin, descripcion, es_pista } = req.body;

    const data = await eventosService.actualizarActividadCronograma({
      evento_id,
      actividad_id,
      nombre,
      hora_inicio,
      hora_fin,
      descripcion,
      es_pista: es_pista !== undefined ? Boolean(es_pista) : undefined,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible actualizar la actividad del cronograma.');
  }
}

export async function deleteActividad(req: Request, res: Response) {
  try {
    const { evento_id, actividad_id } = req.params;
    const data = await eventosService.eliminarActividadCronograma(evento_id, actividad_id);
    return res.status(200).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible eliminar la actividad del cronograma.', 404);
  }
}
