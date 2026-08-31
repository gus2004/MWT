import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as inscripcionesService from '../services/inscripciones.service';

export async function eventosDisponibles(req: Request, res: Response) {
  try {
    const items = await inscripcionesService.getEventosDisponibles();
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No fue posible obtener los eventos disponibles.' });
  }
}

export async function categoriasPorEvento(req: Request, res: Response) {
  try {
    const evento_id = typeof req.query.evento_id === 'string' ? req.query.evento_id : '';

    if (!evento_id) {
      return res.status(400).json({ message: 'evento_id es requerido.' });
    }

    const items = await inscripcionesService.getCategoriasPorEvento(evento_id);
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'No fue posible obtener categorías del evento.' });
  }
}

export async function buscarPiloto(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!q) {
      return res.status(200).json({ items: [] });
    }

    const rows = await inscripcionesService.buscarPiloto(q);

    const items = rows.map((u) => ({
      piloto_id: u.id,
      nombre_completo: `${u.nombre} ${u.apellido}`.trim(),
      cui: u.perfil_personal?.cui ?? null,
      dorsal_preferido: u.perfil_piloto?.dorsal_preferido ?? null,
    }));

    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No fue posible buscar pilotos.' });
  }
}

export async function validarPiloto(req: Request, res: Response) {
  try {
    const piloto_id = typeof req.query.piloto_id === 'string' ? req.query.piloto_id : '';
    const evento_id = typeof req.query.evento_id === 'string' ? req.query.evento_id : '';
    const categoria_id = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : '';

    if (!piloto_id || !evento_id || !categoria_id) {
      return res.status(400).json({ message: 'piloto_id, evento_id y categoria_id son requeridos.' });
    }

    const result = await inscripcionesService.validarPiloto({ piloto_id, evento_id, categoria_id });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'No fue posible validar al piloto.' });
  }
}

export async function dorsalDisponible(req: Request, res: Response) {
  try {
    const evento_id = typeof req.query.evento_id === 'string' ? req.query.evento_id : '';
    const categoria_id = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : '';
    const dorsalRaw = typeof req.query.dorsal === 'string' ? req.query.dorsal : '';
    const dorsal = Number(dorsalRaw);

    if (!evento_id || !categoria_id || !Number.isFinite(dorsal)) {
      return res.status(400).json({ message: 'evento_id, categoria_id y dorsal válidos son requeridos.' });
    }

    const result = await inscripcionesService.dorsalDisponible({ evento_id, categoria_id, dorsal });
    return res.status(200).json(result);
  } catch (_error) {
    return res.status(500).json({ message: 'No fue posible validar disponibilidad de dorsal.' });
  }
}

export async function dorsalesTomados(req: Request, res: Response) {
  try {
    const evento_id = typeof req.query.evento_id === 'string' ? req.query.evento_id : '';
    const categoria_id = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : '';

    if (!evento_id || !categoria_id) {
      return res.status(400).json({ message: 'evento_id y categoria_id son requeridos.' });
    }

    const dorsales = await inscripcionesService.dorsalesTomados({ evento_id, categoria_id });
    return res.status(200).json({ items: dorsales });
  } catch (_error) {
    return res.status(500).json({ message: 'No fue posible obtener los dorsales tomados.' });
  }
}

export async function dorsalesDisponibles(req: Request, res: Response) {
  try {
    const categoria_id = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : '';
    const evento_id = typeof req.query.evento_id === 'string' ? req.query.evento_id : undefined;

    if (!categoria_id) return res.status(400).json({ message: 'categoria_id es requerido.' });

    const result = await inscripcionesService.getDorsalesDisponibles({ categoria_id, evento_id });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || 'No fue posible calcular dorsales disponibles.' });
  }
}

export async function crearInscripcion(req: Request, res: Response) {
  try {
    const {
      evento_id,
      piloto_id,
      categoria_id,
      motocicleta_id,
      dorsal_asignado,
      metodo_pago,
      id_transaccion,
      nit_factura,
      nombre_factura,
      direccion_factura,
      usuario_id,
    } = req.body;

    if (!evento_id || !piloto_id || !categoria_id || !motocicleta_id || !dorsal_asignado || !metodo_pago || !usuario_id) {
      return res.status(400).json({
        message:
          'evento_id, piloto_id, categoria_id, motocicleta_id, dorsal_asignado, metodo_pago y usuario_id son requeridos.',
      });
    }

    const data = await inscripcionesService.crearInscripcion({
      evento_id,
      piloto_id,
      categoria_id,
      motocicleta_id,
      dorsal_asignado: Number(dorsal_asignado),
      metodo_pago,
      id_transaccion,
      nit_factura,
      nombre_factura,
      direccion_factura,
      usuario_id,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    if (error?.code === 'P2002' || error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(409).json({
        message: 'El dorsal ya fue asignado por otro usuario al mismo tiempo, elige otro número',
      });
    }

    if (error?.message && typeof error.message === 'string') {
      const controlled = [
        'Evento no encontrado.',
        'Piloto no encontrado.',
        'Categoría no encontrada.',
        'Motocicleta no encontrada.',
        'La categoría no corresponde al evento seleccionado.',
        'La motocicleta seleccionada no pertenece al piloto.',
        'No se pudo completar la inscripción.',
      ];

      if (controlled.includes(error.message)) {
        return res.status(400).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: 'No fue posible registrar la inscripción.' });
  }
}
