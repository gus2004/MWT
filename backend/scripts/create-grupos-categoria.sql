CREATE TABLE IF NOT EXISTS grupos_categoria_evento (
    id TEXT NOT NULL,
    evento_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tiene_clasificacion BOOLEAN NOT NULL DEFAULT false,
    clasificacion_completada BOOLEAN NOT NULL DEFAULT false,
    heat1_completado BOOLEAN NOT NULL DEFAULT false,
    heat2_completado BOOLEAN NOT NULL DEFAULT false,
    orden INTEGER NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT grupos_categoria_evento_pkey PRIMARY KEY (id),
    CONSTRAINT grupos_categoria_evento_evento_id_fkey
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categorias_en_grupo (
    id TEXT NOT NULL,
    grupo_id TEXT NOT NULL,
    categoria_id TEXT NOT NULL,
    CONSTRAINT categorias_en_grupo_pkey PRIMARY KEY (id),
    CONSTRAINT categorias_en_grupo_grupo_id_fkey
        FOREIGN KEY (grupo_id) REFERENCES grupos_categoria_evento(id) ON DELETE CASCADE,
    CONSTRAINT categorias_en_grupo_categoria_id_fkey
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT categorias_en_grupo_unique UNIQUE (grupo_id, categoria_id)
);
