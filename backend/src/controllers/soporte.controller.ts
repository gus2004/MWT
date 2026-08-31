import { Request, Response } from 'express';
import * as soporteService from '../services/soporte.service';

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
    const { inscripcion_id, comisario_id, tipo_sancion_id, motivo, estado, penalizacion } = req.body;
    if (!inscripcion_id) return res.status(400).json({ message: 'inscripcion_id es requerido.' });
    if (!motivo?.trim()) return res.status(400).json({ message: 'El motivo es requerido.' });

    const data = await soporteService.createSancion({
      inscripcion_id,
      comisario_id,
      tipo_sancion_id,
      motivo,
      estado,
      penalizacion,
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