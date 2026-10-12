import { Response } from 'express';
import * as service from '../services/resultados.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getPilotosParaHeat(req: AuthRequest, res: Response) {
  try {
    const { grupo_id } = req.params;
    const heat = Number(req.query.heat ?? req.params.numero ?? 1);
    const categoriaId = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : undefined;
    const items = await service.getPilotosParaHeat(grupo_id, heat, categoriaId);
    return res.status(200).json({ items });
  } catch (err: any) {
    return res.status(400).json({ message: err.message || 'No fue posible obtener pilotos para el heat' });
  }
}

export async function postResultadosHeat(req: AuthRequest, res: Response) {
  try {
    const { grupo_id, numero } = req.params;
    const usuario_id = String(req.user?.id || req.body.usuario_id || req.headers['x-usuario-id'] || '');
    if (!usuario_id) return res.status(400).json({ message: 'usuario_id es requerido en body para auditoría' });

    const resultados = Array.isArray(req.body.resultados) ? req.body.resultados : [];
    const resp = await service.postHeatResultados(grupo_id, Number(numero), resultados, usuario_id, req.body.categoria_id);
    return res.status(200).json(resp);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || 'No fue posible guardar resultados del heat' });
  }
}

export async function getResultadosHeat(req: AuthRequest, res: Response) {
  try {
    const { grupo_id, numero } = req.params;
    const categoriaId = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : undefined;
    const items = await service.getResultadosHeat(grupo_id, Number(numero), categoriaId);
    return res.status(200).json({ items });
  } catch (err: any) {
    return res.status(400).json({ message: err.message || 'No fue posible obtener resultados del heat' });
  }
}
