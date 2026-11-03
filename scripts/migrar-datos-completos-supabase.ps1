$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root 'backend\.env'
$sourceDump = Join-Path $root 'mwt_data.sql'
$dataDump = Join-Path $root 'mwt_data_solo_datos.sql'
$psql = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'

if (-not (Test-Path $envFile)) {
  throw "No se encontró backend/.env"
}
if (-not (Test-Path $sourceDump)) {
  throw "No se encontró mwt_data.sql"
}
if (-not (Test-Path $psql)) {
  throw "No se encontró psql en $psql"
}

$databaseLine = Get-Content $envFile |
  Where-Object { $_ -match '^\uFEFF?DATABASE_URL=' } |
  Select-Object -First 1

if (-not $databaseLine) {
  throw "No se encontró DATABASE_URL en backend/.env"
}

$env:DATABASE_URL = ($databaseLine -replace '^\uFEFF?DATABASE_URL=', '').Trim().Trim('"')
if ($env:DATABASE_URL -notmatch '^postgres(ql)?://') {
  throw "DATABASE_URL no tiene formato PostgreSQL"
}

$dump = Get-Content $sourceDump -Raw
$dump = [regex]::Replace(
  $dump,
  '(?ms)--\r?\n-- Data for Name: _prisma_migrations.*?^\\\.\r?\n',
  ''
)
$dump = $dump -replace `
  '(?m)^COPY public\.reglamento_documentos \(id, evento_id, nombre, ruta_archivo, paginas, texto, estado, creado_por, created_at\) FROM stdin;',
  'COPY public.reglamento_documentos (id, evento_id, nombre, ruta_archivo, paginas, texto, estado, creado_por, "createdAt") FROM stdin;'
Set-Content $dataDump $dump -Encoding utf8

$truncateSql = @'
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I CASCADE', table_name);
  END LOOP;
END $$;
'@

& $psql $env:DATABASE_URL --no-password --set ON_ERROR_STOP=1 --single-transaction --command $truncateSql
if ($LASTEXITCODE -ne 0) {
  throw "No se pudieron limpiar los datos actuales"
}

& $psql $env:DATABASE_URL --no-password --set ON_ERROR_STOP=1 --single-transaction --file $dataDump
if ($LASTEXITCODE -ne 0) {
  throw "La restauración del respaldo falló"
}

& $psql $env:DATABASE_URL --no-password --pset pager=off --command @'
SELECT 'usuarios' AS tabla, COUNT(*) AS filas FROM usuarios
UNION ALL SELECT 'usuarios_roles', COUNT(*) FROM usuarios_roles
UNION ALL SELECT 'perfiles_pilotos', COUNT(*) FROM perfiles_pilotos
UNION ALL SELECT 'perfiles_personales', COUNT(*) FROM perfiles_personales
UNION ALL SELECT 'campeonatos', COUNT(*) FROM campeonatos
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'eventos', COUNT(*) FROM eventos
UNION ALL SELECT 'inscripciones', COUNT(*) FROM inscripciones
UNION ALL SELECT 'motocicletas', COUNT(*) FROM motocicletas
UNION ALL SELECT 'revisiones_tecnicas', COUNT(*) FROM revisiones_tecnicas
UNION ALL SELECT 'evidencias', COUNT(*) FROM evidencias
UNION ALL SELECT 'reglamento_articulos', COUNT(*) FROM reglamento_articulos
UNION ALL SELECT 'reglamento_documentos', COUNT(*) FROM reglamento_documentos
ORDER BY tabla;
'@
if ($LASTEXITCODE -ne 0) {
  throw "La verificación falló"
}

Write-Host "Migración completa finalizada correctamente."
