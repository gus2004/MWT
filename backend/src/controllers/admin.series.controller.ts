import { Request, Response } from 'express';
import * as service from '../services/admin.series.service';

function handleError(res: Response, err: any, fallback: string, status = 400) {
  if (err?.message && typeof err.message === 'string') {
    return res.status(status).json({ message: err.message });
  }
  console.error(fallback, err);
  return res.status(500).json({ message: fallback });
}

// Árbol de carpetas: años -> series (ACMG/Yamaha) -> fechas
export async function arbolSeries(req: Request, res: Response) {
  try {
    const items = await service.listarArbolSeries();
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudo cargar el árbol de eventos.');
  }
}

export async function crearSerie(req: Request, res: Response) {
  try {
    const data = await service.crearSerie(req.body);
    return res.status(201).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo crear la carpeta de evento.');
  }
}

export async function editarSerie(req: Request, res: Response) {
  try {
    const { serie_id } = req.params;
    const data = await service.editarSerie(serie_id, req.body);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo editar la carpeta de evento.');
  }
}

export async function eliminarSerie(req: Request, res: Response) {
  try {
    const { serie_id } = req.params;
    const data = await service.eliminarSerie(serie_id);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo eliminar la carpeta de evento.');
  }
}

// Copiar la estructura de un año a otro (carpetas, fechas, categorías)
export async function clonarAnio(req: Request, res: Response) {
  try {
    const data = await service.clonarAnio(req.body);
    return res.status(201).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron copiar las carpetas del año.');
  }
}

// Categorías que participan en ese evento (serie)
export async function listarCategorias(req: Request, res: Response) {
  try {
    const { serie_id } = req.params;
    const data = await service.listarCategoriasDeSerie(serie_id);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar las categorías de la serie.');
  }
}

export async function crearCategoria(req: Request, res: Response) {
  try {
    const { serie_id } = req.params;
    const data = await service.crearCategoriaDeSerie(serie_id, req.body);
    return res.status(201).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo crear la categoría.');
  }
}

export async function importarCategorias(req: Request, res: Response) {
  try {
    const { serie_id } = req.params;
    const data = await service.importarCategoriasDeSerie(serie_id, req.body);
    return res.status(201).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron importar las categorías.');
  }
}

export async function eliminarCategoria(req: Request, res: Response) {
  try {
    const { serie_id, categoria_id } = req.params;
    const data = await service.eliminarCategoriaDeSerie(serie_id, categoria_id);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo eliminar la categoría.');
  }
}