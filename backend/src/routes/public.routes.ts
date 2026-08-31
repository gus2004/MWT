import { Router } from "express";
import { listPublicEventos, listMaintenanceModules, listCircuitos, listInscripciones, listInscripcionOptions, getPilotoPublicDetail, getStatsPublicos } from "../controllers/public.controller";

const router = Router();

router.get("/eventos", listPublicEventos);
router.get("/circuitos", listCircuitos);
router.get("/inscripciones", listInscripciones);
router.get("/inscripciones/options", listInscripcionOptions);
router.get("/pilotos/:piloto_id", getPilotoPublicDetail);
router.get("/maintenance/modules", listMaintenanceModules);
router.get("/stats", getStatsPublicos);

export default router;