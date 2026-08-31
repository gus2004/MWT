import { Request, Response } from 'express';
import { deleteEventoFromDb, publishEventoToDb, saveDraftEventoToDb } from '../services/admin.eventos.service';

export async function publishEventoController(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    if (!payload.nombre || !payload.fecha_inicio || !payload.fecha_fin) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, fecha_inicio, fecha_fin' });
    }
    // Validate dates
    const inicio = new Date(payload.fecha_inicio);
    const fin = new Date(payload.fecha_fin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ message: 'Formato de fecha inválido. Use YYYY-MM-DD o ISO.' });
    }

    const result = await publishEventoToDb(payload);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error('Error publicando evento:', err);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: err?.message || String(err) });
    }
    return res.status(500).json({ message: 'Error publicando evento' });
  }
}

export async function deleteEventoController(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    if (!evento_id) {
      return res.status(400).json({ message: 'evento_id es requerido.' });
    }

    const result = await deleteEventoFromDb(evento_id);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error eliminando evento:', err);
    const message = err?.message || 'Error eliminando evento';
    return res.status(500).json({ message });
  }
}

export async function saveDraftEventoController(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    if (!payload.nombre || !payload.fecha_inicio || !payload.fecha_fin) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, fecha_inicio, fecha_fin' });
    }

    const inicio = new Date(payload.fecha_inicio);
    const fin = new Date(payload.fecha_fin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ message: 'Formato de fecha inválido. Use YYYY-MM-DD o ISO.' });
    }

    const result = await saveDraftEventoToDb(payload);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error guardando borrador de evento:', err);
    return res.status(500).json({ message: err?.message || 'Error guardando borrador' });
  }
}
