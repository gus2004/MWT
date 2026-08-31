import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import * as mantenimientoService from '../services/mantenimiento.service';

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

export async function createMarca(req: Request, res: Response) {
  try {
    const { nombre } = req.body;

    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ message: 'El nombre de la marca es requerido.' });
    }

    const data = await mantenimientoService.createMarca({ nombre });
    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No se pudo crear la marca.');
  }
}

export async function listMarcas(_req: Request, res: Response) {
  try {
    const items = await mantenimientoService.listMarcas();
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No se pudo listar las marcas.' });
  }
}

export async function createCampeonato(req: Request, res: Response) {
  try {
    const { nombre, anio, descripcion } = req.body;

    if (!nombre || !Number.isFinite(Number(anio))) {
      return res.status(400).json({ message: 'nombre y anio son requeridos.' });
    }

    const data = await mantenimientoService.createCampeonato({
      nombre,
      anio: Number(anio),
      descripcion,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No se pudo crear el campeonato.');
  }
}

export async function listCampeonatos(_req: Request, res: Response) {
  try {
    const items = await mantenimientoService.listCampeonatosActivos();
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No se pudieron listar los campeonatos.' });
  }
}

export async function createCategoria(req: Request, res: Response) {
  try {
    const { campeonato_id, nombre, cilindrada_min, cilindrada_max, descripcion, precio_inscripcion } = req.body;

    if (!campeonato_id || !nombre) {
      return res.status(400).json({ message: 'campeonato_id y nombre son requeridos.' });
    }

    if (!Number.isFinite(Number(cilindrada_min)) || !Number.isFinite(Number(cilindrada_max))) {
      return res.status(400).json({ message: 'cilindrada_min y cilindrada_max deben ser numéricos.' });
    }

    const data = await mantenimientoService.createCategoria({
      campeonato_id,
      nombre,
      cilindrada_min: Number(cilindrada_min),
      cilindrada_max: Number(cilindrada_max),
      descripcion,
      precio_inscripcion: Number.isFinite(Number(precio_inscripcion)) ? Number(precio_inscripcion) : 0,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No se pudo crear la categoría.');
  }
}

export async function listCategorias(req: Request, res: Response) {
  try {
    const campeonato_id = typeof req.query.campeonato_id === 'string' ? req.query.campeonato_id : '';

    if (!campeonato_id) {
      return res.status(400).json({ message: 'campeonato_id es requerido.' });
    }

    const items = await mantenimientoService.listCategoriasByCampeonato(campeonato_id);
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No se pudieron listar las categorías.' });
  }
}

export async function createCircuito(req: Request, res: Response) {
  try {
    const { nombre, ubicacion_url, longitud_km, numero_curvas } = req.body;

    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ message: 'El nombre del circuito es requerido.' });
    }

    const data = await mantenimientoService.createCircuito({
      nombre,
      ubicacion_url,
      longitud_km: Number.isFinite(Number(longitud_km)) ? Number(longitud_km) : undefined,
      numero_curvas: Number.isFinite(Number(numero_curvas)) ? Number(numero_curvas) : undefined,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No se pudo crear el circuito.');
  }
}

export async function listCircuitos(_req: Request, res: Response) {
  try {
    const items = await mantenimientoService.listCircuitosActivos();
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No se pudieron listar los circuitos.' });
  }
}
