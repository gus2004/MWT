import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response) {
  try {
    const {
      email, password, nombre, apellido, cui, fecha_nacimiento, genero,
      telefono_personal, direccion, dorsal_preferido, tipo_sangre, alergias,
      condiciones_medicas, nombre_contacto_emergencia, parentesco_emergencia,
      telefono_emergencia, seguro_medico_empresa, poliza_seguro,
    } = req.body;
    const data = await authService.register({
      email, password, nombre, apellido, cui, fecha_nacimiento, genero,
      telefono_personal, direccion, dorsal_preferido, tipo_sangre, alergias,
      condiciones_medicas, nombre_contacto_emergencia, parentesco_emergencia,
      telefono_emergencia, seguro_medico_empresa, poliza_seguro,
    });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error en registro' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { password } = req.body;
    const email = req.body.email || req.body.username || req.body.usuario;
    const data = await authService.login({ email, password });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(401).json({ message: error.message || 'Error en login' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'No autenticado' });
    const data = await authService.me(req.user.id);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(404).json({ message: error.message || 'Usuario no encontrado' });
  }
}

export async function actualizarPerfil(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'No autenticado' });
    const data = await authService.actualizarPerfil(req.user.id, req.body || {});
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No se pudo actualizar el perfil.' });
  }
}