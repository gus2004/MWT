import { Request, Response } from 'express';
import * as eventosService from '../services/eventos.service';

export async function listCategorias(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await eventosService.listarCategoriasDeEvento(evento_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    console.error('Error listando categorias de evento:', err);
    return res.status(500).json({ message: err?.message || 'Error listando categorías' });
  }
}

export async function createCategoria(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { nombre, cilindrada_min, cilindrada_max, descripcion, precio_inscripcion, usuario_id } = req.body;

    if (!nombre || !Number.isFinite(Number(cilindrada_min)) || !Number.isFinite(Number(cilindrada_max)) || !usuario_id) {
      return res.status(400).json({ message: 'Campos requeridos: nombre, cilindrada_min, cilindrada_max, usuario_id' });
    }

    const item = await eventosService.crearCategoriaParaEvento({
      evento_id,
      nombre,
      cilindrada_min: Number(cilindrada_min),
      cilindrada_max: Number(cilindrada_max),
      descripcion,
      precio_inscripcion: precio_inscripcion !== undefined ? Number(precio_inscripcion) : undefined,
      usuario_id,
    });

    return res.status(201).json(item);
  } catch (err: any) {
    console.error('Error creando categoria:', err);
    return res.status(500).json({ message: err?.message || 'Error creando categoría' });
  }
}

export async function updateCategoria(req: Request, res: Response) {
  try {
    const { evento_id, categoria_id } = req.params;
    const { nombre, cilindrada_min, cilindrada_max, descripcion, precio_inscripcion, usuario_id } = req.body;

    if (!usuario_id) return res.status(400).json({ message: 'usuario_id es requerido para auditoría.' });

    const item = await eventosService.actualizarCategoriaEnEvento({
      evento_id,
      categoria_id,
      nombre,
      cilindrada_min: cilindrada_min !== undefined ? Number(cilindrada_min) : undefined,
      cilindrada_max: cilindrada_max !== undefined ? Number(cilindrada_max) : undefined,
      descripcion,
      precio_inscripcion: precio_inscripcion !== undefined ? Number(precio_inscripcion) : undefined,
      usuario_id,
    });

    return res.status(200).json(item);
  } catch (err: any) {
    console.error('Error actualizando categoria:', err);
    return res.status(500).json({ message: err?.message || 'Error actualizando categoría' });
  }
}

export async function deleteCategoria(req: Request, res: Response) {
  try {
    const { evento_id, categoria_id } = req.params;
    const { usuario_id } = req.body;

    if (!usuario_id) return res.status(400).json({ message: 'usuario_id es requerido para auditoría.' });

    await eventosService.eliminarCategoriaDeEvento({ evento_id, categoria_id, usuario_id });
    return res.status(204).send(undefined);
  } catch (err: any) {
    console.error('Error eliminando categoria:', err);
    return res.status(500).json({ message: err?.message || 'Error eliminando categoría' });
  }
}
