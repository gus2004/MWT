import { Request, Response } from 'express';
import { createInscripcionToDb, deleteInscripcionById, updateInscripcionStatus } from '../services/admin.inscripciones.service';

export async function createInscripcionController(req: Request, res: Response) {
  try {
    const payload = req.body || {};

    if (!payload.evento_id || !payload.piloto_id || !payload.categoria_id || !payload.motocicleta_id) {
      return res.status(400).json({ message: 'Faltan campos requeridos: evento_id, piloto_id, categoria_id, motocicleta_id' });
    }

    const result = await createInscripcionToDb(payload);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error('Error creando inscripcion:', err);
    const message = err?.message || 'Error creando inscripcion';
    const controlledMessages = [
      'Evento no encontrado',
      'Piloto no encontrado',
      'Categoría no encontrada',
      'Motocicleta no encontrada',
      'La categoría no pertenece al campeonato del evento seleccionado',
      'La motocicleta no pertenece al piloto seleccionado',
      'Dorsal inválido',
      'No puede ingresar a esta categoría porque la cilindrada de su moto',
      'El dorsal ya está ocupado en esta categoría para este evento',
      'Este piloto ya está inscrito en esta categoría/evento con el dorsal',
    ];
    const isControlled = controlledMessages.some((text) => message.includes(text));
    return res.status(isControlled ? 400 : 500).json({ message });
  }
}

export async function updateInscripcionController(req: Request, res: Response) {
  try {
    const inscripcionId = req.params.id || req.body.id;
    const usuario_id = req.body.usuario_id || req.query.usuario_id || req.headers['x-usuario-id'];

    if (!inscripcionId) return res.status(400).json({ message: 'inscripcion id es requerido.' });

    const updates = {
      estado: req.body.estado,
      dorsal_asignado: req.body.dorsal_asignado !== undefined ? Number(req.body.dorsal_asignado) : undefined,
    };

    const result = await updateInscripcionStatus(String(inscripcionId), updates, String(usuario_id || ''));
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error actualizando inscripcion:', err);
    return res.status(500).json({ message: err?.message || 'Error actualizando inscripción' });
  }
}

export async function deleteInscripcionController(req: Request, res: Response) {
  try {
    const inscripcionId = req.params.id || req.body.id;

    if (!inscripcionId) return res.status(400).json({ message: 'inscripcion id es requerido.' });

    const result = await deleteInscripcionById(String(inscripcionId));
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error eliminando inscripcion:', err);
    return res.status(400).json({ message: err?.message || 'Error eliminando inscripción' });
  }
}
