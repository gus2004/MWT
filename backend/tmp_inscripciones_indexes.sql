CREATE UNIQUE INDEX IF NOT EXISTS idx_dorsal_unico
ON inscripciones(evento_id, categoria_id, dorsal_asignado);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inscripcion_unica
ON inscripciones(evento_id, piloto_id, categoria_id);
