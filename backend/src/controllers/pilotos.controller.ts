import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import * as pilotosService from '../services/pilotos.service';

const P2002_MESSAGE = 'Ya existe un registro con ese valor único, verifica los datos e intenta de nuevo';

function handleError(res: Response, error: any, fallback: string, status = 400) {
  // Only treat explicit Prisma P2002 as unique constraint conflict
  if (error?.code === 'P2002' || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
    const rawTarget = error?.meta?.target;
    const fields = Array.isArray(rawTarget) ? rawTarget.map(String) : rawTarget ? [String(rawTarget)] : [];

    return res.status(409).json({
      message: P2002_MESSAGE,
      field: fields[0] || null,
      fields,
    });
  }

  if (error?.message && typeof error.message === 'string') {
    return res.status(status).json({ message: error.message });
  }

  return res.status(500).json({ message: fallback });
}

export async function createPiloto(req: Request, res: Response) {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      cui,
      fecha_nacimiento,
      genero,
      telefono_personal,
      direccion,
      departamento_id,
      municipio_id,
      pais_id,
      dorsal_preferido,
      tipo_sangre,
      alergias,
      condiciones_medicas,
      nombre_contacto_emergencia,
      parentesco_emergencia,
      telefono_emergencia,
      seguro_medico_empresa,
      poliza_seguro,
      usuario_id,
    } = req.body;

    if (!nombre || !apellido || !email || !password || !usuario_id) {
      return res.status(400).json({ message: 'nombre, apellido, email, password y usuario_id son requeridos.' });
    }

    const data = await pilotosService.crearPiloto({
      nombre,
      apellido,
      email,
      password,
      cui,
      fecha_nacimiento,
      genero,
      telefono_personal,
      direccion,
      departamento_id,
      municipio_id,
      pais_id,
      dorsal_preferido: Number.isFinite(Number(dorsal_preferido)) ? Number(dorsal_preferido) : undefined,
      tipo_sangre,
      alergias,
      condiciones_medicas,
      nombre_contacto_emergencia,
      parentesco_emergencia,
      telefono_emergencia,
      seguro_medico_empresa,
      poliza_seguro,
      usuario_operador_id: usuario_id,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible crear el piloto.');
  }
}

export async function createMotocicleta(req: Request, res: Response) {
  try {
    const { piloto_id } = req.params;
    const { marca_id, modelo, anio, cilindrada_real, vin, color, apodo_moto } = req.body;

    if (!piloto_id || !marca_id || !modelo || !Number.isFinite(Number(anio)) || !Number.isFinite(Number(cilindrada_real))) {
      return res.status(400).json({
        message: 'piloto_id, marca_id, modelo, anio y cilindrada_real son requeridos.',
      });
    }

    const data = await pilotosService.registrarMotocicleta({
      piloto_id,
      marca_id,
      modelo,
      anio: Number(anio),
      cilindrada_real: Number(cilindrada_real),
      vin,
      color,
      apodo_moto,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible registrar la motocicleta.');
  }
}

export async function listPilotos(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const items = await pilotosService.listarPilotos(q);
    return res.status(200).json({ items });
  } catch (_error) {
    return res.status(500).json({ message: 'No fue posible listar pilotos.' });
  }
}

export async function getPiloto(req: Request, res: Response) {
  try {
    const { piloto_id } = req.params;
    const item = await pilotosService.obtenerPiloto(piloto_id);
    return res.status(200).json(item);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible obtener el piloto.', 404);
  }
}

export async function updatePiloto(req: Request, res: Response) {
  try {
    const { piloto_id } = req.params;
    const {
      email,
      password,
      usuario_id,
      nombre,
      apellido,
      cui,
      fecha_nacimiento,
      genero,
      telefono_personal,
      direccion,
      departamento_id,
      municipio_id,
      pais_id,
      dorsal_preferido,
      tipo_sangre,
      alergias,
      condiciones_medicas,
      nombre_contacto_emergencia,
      parentesco_emergencia,
      telefono_emergencia,
      seguro_medico_empresa,
      poliza_seguro,
    } = req.body;

    if (email !== undefined || password !== undefined) {
      return res.status(400).json({ message: 'No se permite actualizar email ni password desde este endpoint.' });
    }

    if (!usuario_id) {
      return res.status(400).json({ message: 'usuario_id es requerido para auditoría.' });
    }

    const data = await pilotosService.actualizarPiloto({
      piloto_id,
      nombre,
      apellido,
      cui,
      fecha_nacimiento,
      genero,
      telefono_personal,
      direccion,
      departamento_id,
      municipio_id,
      pais_id,
      dorsal_preferido: dorsal_preferido !== undefined && Number.isFinite(Number(dorsal_preferido)) ? Number(dorsal_preferido) : undefined,
      tipo_sangre,
      alergias,
      condiciones_medicas,
      nombre_contacto_emergencia,
      parentesco_emergencia,
      telefono_emergencia,
      seguro_medico_empresa,
      poliza_seguro,
      usuario_operador_id: usuario_id,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible actualizar el piloto.');
  }
}

export async function deletePiloto(req: Request, res: Response) {
  try {
    const { piloto_id } = req.params;
    const usuario_id = req.body.usuario_id || req.query.usuario_id || req.headers['x-usuario-id'];

    if (!piloto_id) return res.status(400).json({ message: 'piloto_id es requerido.' });
    if (!usuario_id) return res.status(400).json({ message: 'usuario_id es requerido para auditoría.' });

    const result = await pilotosService.eliminarPiloto(String(piloto_id), String(usuario_id));
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, 'No fue posible eliminar el piloto.');
  }
}
