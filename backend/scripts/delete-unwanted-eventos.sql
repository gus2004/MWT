BEGIN;

-- IDs solicitados para eliminar
WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
),
revisiones_target AS (
  SELECT r.id
  FROM revisiones_tecnicas r
  JOIN inscripciones_target it ON it.id = r.inscripcion_id
),
sanciones_target AS (
  SELECT s.id
  FROM sanciones s
  JOIN inscripciones_target it ON it.id = s.inscripcion_id
),
documentos_target AS (
  SELECT d.id
  FROM documentos_evento d
  JOIN target_events t ON t.id = d.evento_id
)
DELETE FROM detalles_revision
WHERE revision_tecnica_id IN (SELECT id FROM revisiones_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
),
sanciones_target AS (
  SELECT s.id
  FROM sanciones s
  JOIN inscripciones_target it ON it.id = s.inscripcion_id
)
DELETE FROM apelaciones
WHERE sancion_id IN (SELECT id FROM sanciones_target)
   OR inscripcion_id IN (SELECT id FROM inscripciones_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
)
DELETE FROM resultados_tiempos
WHERE inscripcion_id IN (SELECT id FROM inscripciones_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
)
DELETE FROM sanciones
WHERE inscripcion_id IN (SELECT id FROM inscripciones_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
)
DELETE FROM revisiones_tecnicas
WHERE inscripcion_id IN (SELECT id FROM inscripciones_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
),
documentos_target AS (
  SELECT d.id
  FROM documentos_evento d
  JOIN target_events t ON t.id = d.evento_id
)
DELETE FROM accesos_documento
WHERE inscripcion_id IN (SELECT id FROM inscripciones_target)
   OR documento_id IN (SELECT id FROM documentos_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
),
inscripciones_target AS (
  SELECT i.id
  FROM inscripciones i
  JOIN target_events t ON t.id = i.evento_id
)
DELETE FROM pagos
WHERE inscripcion_id IN (SELECT id FROM inscripciones_target);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM inscripciones
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM actividades_cronograma
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM patrocinadores_eventos
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM configuraciones_pago
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM documentos_evento
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM notificaciones
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM galeria_fotos
WHERE evento_id IN (SELECT id FROM target_events);

WITH target_events AS (
  SELECT UNNEST(ARRAY[
    'c5e5ac37-9a83-45c0-b835-96ebf0f462e8'::uuid,
    '065e848c-1139-4fc6-b6a5-a30ae325903a'::uuid,
    '6cfdaade-78d6-442b-b872-c64574070de4'::uuid,
    'adb00809-58a2-49b6-acdd-55b6a76add5f'::uuid
  ]) AS id
)
DELETE FROM eventos
WHERE id IN (SELECT id FROM target_events);

COMMIT;
