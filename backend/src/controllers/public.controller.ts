import { Request, Response } from "express";
import { getPublicEventos, getCircuitos, getInscripciones, getInscripcionOptions, getPublicPilotoDetail, getPublicStats } from "../services/public.service";
import { getMaintenanceModules } from "../services/public.service";

export async function getStatsPublicos(req: Request, res: Response) {
  try {
    const stats = await getPublicStats();
    return res.status(200).json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return res.status(500).json({ message: "Error obteniendo estadísticas públicas.", error: message });
  }
}

export async function listPublicEventos(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit ?? 4);
    const items = await getPublicEventos(limit);
    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Error obteniendo eventos públicos." });
  }
}

export async function listCircuitos(req: Request, res: Response) {
  try {
    const items = await getCircuitos();
    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Error obteniendo circuitos." });
  }
}

export async function listInscripciones(req: Request, res: Response) {
  try {
    console.log("📋 [listInscripciones] Iniciando...");
    const items = await getInscripciones();
    console.log(`📋 [listInscripciones] ✅ ${items.length} inscripciones encontradas`);
    return res.status(200).json({ items });
  } catch (error) {
    console.error("📋 [listInscripciones] ❌ Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return res.status(500).json({ 
      message: "Error obteniendo inscripciones.",
      error: message,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export async function listInscripcionOptions(req: Request, res: Response) {
  try {
    const eventoId = String(req.query.evento_id ?? req.query.eventoId ?? "");
    const pilotoId = String(req.query.piloto_id ?? req.query.pilotoId ?? "");
    const items = await getInscripcionOptions({ eventoId, pilotoId });
    return res.status(200).json(items);
  } catch (error) {
    console.error("Error en listInscripcionOptions:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return res.status(500).json({ message: "Error obteniendo opciones de inscripción.", error: message });
  }
}

export async function listMaintenanceModules(req: Request, res: Response) {
  try {
    const items = await getMaintenanceModules();
    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Error obteniendo módulos de mantenimiento." });
  }
}

export async function getPilotoPublicDetail(req: Request, res: Response) {
  try {
    const pilotoId = String(req.params.piloto_id || "");
    if (!pilotoId) return res.status(400).json({ message: "piloto_id es requerido." });

    const item = await getPublicPilotoDetail(pilotoId);
    return res.status(200).json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const status = message.includes("no encontrado") ? 404 : 500;
    return res.status(status).json({ message: "Error obteniendo detalle del piloto.", error: message });
  }
}