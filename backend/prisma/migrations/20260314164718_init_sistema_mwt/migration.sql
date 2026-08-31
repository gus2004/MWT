-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('BORRADOR', 'ABIERTO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('PENDIENTE', 'PAGADA', 'VALIDADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CONDICIONAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cambio_pw" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_roles" (
    "usuario_id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,

    CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "rol_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "logs_acceso" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles_personales" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cui" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "genero" TEXT,
    "telefono_personal" TEXT,
    "direccion" TEXT,
    "departamento_id" TEXT,
    "municipio_id" TEXT,
    "pais_id" TEXT,

    CONSTRAINT "perfiles_personales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles_pilotos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "dorsal_preferido" INTEGER,
    "tipo_sangre" TEXT,
    "alergias" TEXT,
    "condiciones_medicas" TEXT,
    "nombre_contacto_emergencia" TEXT,
    "parentesco_emergencia" TEXT,
    "telefono_emergencia" TEXT,
    "seguro_medico_empresa" TEXT,
    "poliza_seguro" TEXT,
    "licencia_federacion" TEXT,

    CONSTRAINT "perfiles_pilotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motocicletas" (
    "id" TEXT NOT NULL,
    "piloto_id" TEXT NOT NULL,
    "marca_id" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "cilindrada_real" INTEGER NOT NULL,
    "vin" TEXT,
    "color" TEXT,
    "apodo_moto" TEXT,

    CONSTRAINT "motocicletas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas_motos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "marcas_motos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paises" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_iso" TEXT NOT NULL,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "pais_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circuitos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion_url" TEXT,
    "longitud_km" DOUBLE PRECISION,
    "numero_curvas" INTEGER,
    "foto_mapa_url" TEXT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "circuitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campeonatos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "descripcion" TEXT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "campeonatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "campeonato_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cilindrada_min" INTEGER NOT NULL,
    "cilindrada_max" INTEGER NOT NULL,
    "descripcion" TEXT,
    "precio_inscripcion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglamentos" (
    "id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "archivo_url" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ultima_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esquemas_puntos" (
    "id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "puntos" INTEGER NOT NULL,

    CONSTRAINT "esquemas_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "campeonato_id" TEXT NOT NULL,
    "circuito_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoEvento" NOT NULL DEFAULT E'BORRADOR',
    "visible_portada" BOOLEAN,
    "existe" BOOLEAN,
    "costo_base" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_cronograma" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "es_pista" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "actividades_cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "piloto_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "motocicleta_id" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT E'PENDIENTE',
    "dorsal_asignado" INTEGER NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "id_transaccion" TEXT NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_pago" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT E'GTQ',
    "nit_factura" TEXT,
    "nombre_factura" TEXT,
    "direccion_factura" TEXT,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones_pago" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "clave_publica" TEXT,
    "clave_privada" TEXT,
    "webhook_secret" TEXT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "configuraciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisiones_tecnicas" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "motocicleta_id" TEXT,
    "fecha_revision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoRevision" NOT NULL DEFAULT E'PENDIENTE',
    "observaciones" TEXT,

    CONSTRAINT "revisiones_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_checklist" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "items_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_revision" (
    "id" TEXT NOT NULL,
    "revision_tecnica_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "esta_bien" BOOLEAN NOT NULL DEFAULT false,
    "comentario" TEXT,

    CONSTRAINT "detalles_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_sancion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipos_sancion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanciones" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "comisario_id" TEXT NOT NULL,
    "tipo_sancion_id" TEXT,
    "motivo" TEXT NOT NULL,
    "gravedad" TEXT NOT NULL,
    "penalizacion" TEXT NOT NULL,
    "fecha_sancion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apelaciones" (
    "id" TEXT NOT NULL,
    "sancion_id" TEXT NOT NULL,
    "piloto_id" TEXT NOT NULL,
    "comisario_id" TEXT,
    "motivo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT E'PENDIENTE',
    "resolucion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inscripcion_id" TEXT NOT NULL,

    CONSTRAINT "apelaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heats" (
    "id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vueltas" INTEGER NOT NULL,
    "esta_activo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "heats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_tiempos" (
    "id" TEXT NOT NULL,
    "heat_id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "mejor_vuelta" TEXT,
    "tiempo_total" TEXT,
    "puntos_ganados" INTEGER NOT NULL DEFAULT 0,
    "estatus_carrera" TEXT NOT NULL DEFAULT E'FIN',

    CONSTRAINT "resultados_tiempos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_resultado" (
    "id" TEXT NOT NULL,
    "heat_id" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_resultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clasificaciones_generales" (
    "id" TEXT NOT NULL,
    "piloto_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "campeonato_id" TEXT NOT NULL,
    "puntos_total" INTEGER NOT NULL DEFAULT 0,
    "posicion" INTEGER,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clasificaciones_generales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrocinadores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo_url" TEXT,
    "sitio_web" TEXT,
    "contacto" TEXT,

    CONSTRAINT "patrocinadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrocinadores_campeonatos" (
    "patrocinador_id" TEXT NOT NULL,
    "campeonato_id" TEXT NOT NULL,
    "nivel" TEXT,

    CONSTRAINT "patrocinadores_campeonatos_pkey" PRIMARY KEY ("patrocinador_id","campeonato_id")
);

-- CreateTable
CREATE TABLE "patrocinadores_eventos" (
    "patrocinador_id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "nivel" TEXT,

    CONSTRAINT "patrocinadores_eventos_pkey" PRIMARY KEY ("patrocinador_id","evento_id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "tabla_afectada" TEXT NOT NULL,
    "registro_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_direccion" TEXT,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_notificacion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "plantillas_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "evento_id" TEXT,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencias_sistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "preferencias_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_evento" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivo_url" TEXT NOT NULL,
    "es_obligatorio" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "documentos_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accesos_documento" (
    "id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "fecha_acceso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accesos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galeria_fotos" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "subida_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "galeria_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_generados" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "archivo_url" TEXT NOT NULL,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_generados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_clave_key" ON "permisos"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_key" ON "sesiones"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_token_key" ON "tokens_recuperacion"("token");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_personales_usuario_id_key" ON "perfiles_personales"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_personales_cui_key" ON "perfiles_personales"("cui");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_pilotos_usuario_id_key" ON "perfiles_pilotos"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "motocicletas_vin_key" ON "motocicletas"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_motos_nombre_key" ON "marcas_motos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "paises_nombre_key" ON "paises"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "paises_codigo_iso_key" ON "paises"("codigo_iso");

-- CreateIndex
CREATE UNIQUE INDEX "circuitos_nombre_key" ON "circuitos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "reglamentos_categoria_id_key" ON "reglamentos"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_inscripcion_id_key" ON "pagos"("inscripcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_id_transaccion_key" ON "pagos"("id_transaccion");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_pago_evento_id_key" ON "configuraciones_pago"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "revisiones_tecnicas_inscripcion_id_key" ON "revisiones_tecnicas"("inscripcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_sancion_nombre_key" ON "tipos_sancion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "apelaciones_sancion_id_key" ON "apelaciones"("sancion_id");

-- CreateIndex
CREATE UNIQUE INDEX "clasificaciones_generales_piloto_id_categoria_id_campeonato_key" ON "clasificaciones_generales"("piloto_id", "categoria_id", "campeonato_id");

-- CreateIndex
CREATE UNIQUE INDEX "patrocinadores_nombre_key" ON "patrocinadores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_notificacion_clave_key" ON "plantillas_notificacion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_sistema_clave_key" ON "preferencias_sistema"("clave");

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_acceso" ADD CONSTRAINT "logs_acceso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_personales" ADD CONSTRAINT "perfiles_personales_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_personales" ADD CONSTRAINT "perfiles_personales_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_personales" ADD CONSTRAINT "perfiles_personales_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_personales" ADD CONSTRAINT "perfiles_personales_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_pilotos" ADD CONSTRAINT "perfiles_pilotos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motocicletas" ADD CONSTRAINT "motocicletas_piloto_id_fkey" FOREIGN KEY ("piloto_id") REFERENCES "perfiles_pilotos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motocicletas" ADD CONSTRAINT "motocicletas_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas_motos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglamentos" ADD CONSTRAINT "reglamentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esquemas_puntos" ADD CONSTRAINT "esquemas_puntos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_circuito_id_fkey" FOREIGN KEY ("circuito_id") REFERENCES "circuitos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_cronograma" ADD CONSTRAINT "actividades_cronograma_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_piloto_id_fkey" FOREIGN KEY ("piloto_id") REFERENCES "perfiles_pilotos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_motocicleta_id_fkey" FOREIGN KEY ("motocicleta_id") REFERENCES "motocicletas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuraciones_pago" ADD CONSTRAINT "configuraciones_pago_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_tecnicas" ADD CONSTRAINT "revisiones_tecnicas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_tecnicas" ADD CONSTRAINT "revisiones_tecnicas_motocicleta_id_fkey" FOREIGN KEY ("motocicleta_id") REFERENCES "motocicletas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_tecnicas" ADD CONSTRAINT "revisiones_tecnicas_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_revision" ADD CONSTRAINT "detalles_revision_revision_tecnica_id_fkey" FOREIGN KEY ("revision_tecnica_id") REFERENCES "revisiones_tecnicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_revision" ADD CONSTRAINT "detalles_revision_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items_checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_comisario_id_fkey" FOREIGN KEY ("comisario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_tipo_sancion_id_fkey" FOREIGN KEY ("tipo_sancion_id") REFERENCES "tipos_sancion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apelaciones" ADD CONSTRAINT "apelaciones_piloto_id_fkey" FOREIGN KEY ("piloto_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apelaciones" ADD CONSTRAINT "apelaciones_comisario_id_fkey" FOREIGN KEY ("comisario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apelaciones" ADD CONSTRAINT "apelaciones_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apelaciones" ADD CONSTRAINT "apelaciones_sancion_id_fkey" FOREIGN KEY ("sancion_id") REFERENCES "sanciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heats" ADD CONSTRAINT "heats_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_tiempos" ADD CONSTRAINT "resultados_tiempos_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_tiempos" ADD CONSTRAINT "resultados_tiempos_heat_id_fkey" FOREIGN KEY ("heat_id") REFERENCES "heats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_resultado" ADD CONSTRAINT "comentarios_resultado_heat_id_fkey" FOREIGN KEY ("heat_id") REFERENCES "heats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clasificaciones_generales" ADD CONSTRAINT "clasificaciones_generales_piloto_id_fkey" FOREIGN KEY ("piloto_id") REFERENCES "perfiles_pilotos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clasificaciones_generales" ADD CONSTRAINT "clasificaciones_generales_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrocinadores_campeonatos" ADD CONSTRAINT "patrocinadores_campeonatos_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrocinadores_campeonatos" ADD CONSTRAINT "patrocinadores_campeonatos_patrocinador_id_fkey" FOREIGN KEY ("patrocinador_id") REFERENCES "patrocinadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrocinadores_eventos" ADD CONSTRAINT "patrocinadores_eventos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrocinadores_eventos" ADD CONSTRAINT "patrocinadores_eventos_patrocinador_id_fkey" FOREIGN KEY ("patrocinador_id") REFERENCES "patrocinadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_evento" ADD CONSTRAINT "documentos_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_documento" ADD CONSTRAINT "accesos_documento_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_documento" ADD CONSTRAINT "accesos_documento_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos_evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galeria_fotos" ADD CONSTRAINT "galeria_fotos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_generados" ADD CONSTRAINT "reportes_generados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
