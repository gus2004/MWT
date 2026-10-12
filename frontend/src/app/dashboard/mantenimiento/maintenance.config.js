const field = (key, label, type = "text", extra = {}) => ({ key, label, type, ...extra });
const column = (key, label, formatter) => ({ key, label, ...(formatter ? { formatter } : {}) });

const entity = (key, title, description, fields, columns, extra = {}) => ({
  key,
  title,
  description,
  storageKey: `mwt-mantenimiento-${key}`,
  fields,
  columns,
  ...extra,
});

export const MAINTENANCE_ENTITIES = {
  usuarios: entity(
    "usuarios",
    "Usuarios",
    "Gestión de cuentas, perfiles y accesos.",
    [
      field("nombre", "Nombre", "nombre", { required: true, placeholder: "Nombre" }),
      field("apellido", "Apellido", "nombre", { required: true, placeholder: "Apellido" }),
      field("email", "Correo", "email", { required: true, placeholder: "correo@dominio.com" }),
      field("password", "Contraseña", "password", { required: true, placeholder: "Contraseña" }),
      field("esta_activo", "Activo", "checkbox", { defaultValue: true }),
      field("roles", "Rol del sistema", "select", {
        dynamicOptions: "/api/mantenimiento/crud/roles",
        placeholder: "Seleccione un rol",
      }),
    ],
    [
      column("nombre", "Nombre"),
      column("apellido", "Apellido"),
      column("email", "Correo"),
      column("esta_activo", "Activo"),
      column("roles", "Rol", (_value, item) => {
        const roles = Array.isArray(item?.roles) ? item.roles : [];
        return roles.length ? roles.map((r) => r?.rol?.nombre || r?.nombre || "").join(", ") : "Sin rol";
      }),
    ],
    {
      estadoFilter: {
        all: "Todos los estados",
        options: [
          { value: "activo", label: "Usuarios activos" },
          { value: "inactivo", label: "Usuarios de baja" },
        ],
      },
    }
  ),
  roles: entity(
    "roles",
    "Roles",
    "Roles disponibles para el sistema.",
    [field("nombre", "Nombre", "nombre", { required: true }), field("descripcion", "Descripción", "text", { placeholder: "Descripción" })],
    [column("nombre", "Nombre"), column("descripcion", "Descripción")]
  ),
  pilotos: entity(
    "pilotos",
    "Pilotos",
    "Alta y consulta de pilotos vinculados a usuarios del sistema.",
    [
      field("nombre", "Nombre", "nombre", { required: true, placeholder: "Nombre" }),
      field("apellido", "Apellido", "nombre", { required: true, placeholder: "Apellido" }),
      field("email", "Correo", "email", { required: true, placeholder: "correo@dominio.com" }),
      field("password", "Contraseña", "password", { required: true, placeholder: "Contraseña inicial" }),
      field("cui", "CUI", "cui"),
      field("telefono_personal", "Teléfono", "phone"),
      field("direccion", "Dirección", "text"),
      field("dorsal_preferido", "Dorsal preferido", "dorsal", { maxLength: 2 }),
    ],
    [
      column("nombre", "Nombre", (_value, item) => item?.usuario?.nombre || item?.nombre || ""),
      column("apellido", "Apellido", (_value, item) => item?.usuario?.apellido || item?.apellido || ""),
      column("email", "Correo", (_value, item) => item?.usuario?.email || item?.email || ""),
      column("dorsal_preferido", "Dorsal"),
    ]
  ),
  permisos: entity(
    "permisos",
    "Permisos",
    "Claves de permisos del sistema.",
    [field("clave", "Clave", "text", { required: true }), field("descripcion", "Descripción", "text")],
    [column("clave", "Clave"), column("descripcion", "Descripción")]
  ),
  marcas: entity(
    "marcas",
    "Marcas de moto",
    "Catálogo de marcas de motocicletas.",
    [field("nombre", "Nombre", "nombre", { required: true })],
    [column("nombre", "Nombre")]
  ),
  motocicletas: entity(
    "motocicletas",
    "Motocicletas",
    "Registro de motos y sus características.",
    [
      field("piloto_id", "Piloto", "text", { placeholder: "ID o nombre del piloto" }),
      field("marca_id", "Marca", "text", { placeholder: "ID o nombre de la marca" }),
      field("modelo", "Modelo", "text", { required: true }),
      field("anio", "Año", "int", { required: true, maxLength: 4 }),
      field("cilindrada_real", "Cilindrada real", "int", { required: true, maxLength: 4 }),
      field("vin", "VIN", "text"),
      field("color", "Color", "text"),
      field("apodo_moto", "Apodo", "text"),
    ],
    [column("modelo", "Modelo"), column("anio", "Año"), column("cilindrada_real", "Cilindrada"), column("vin", "VIN")]
  ),
  circuitos: entity(
    "circuitos",
    "Circuitos",
    "Circuitos y configuración de pista.",
    [
      field("nombre", "Nombre", "nombre", { required: true }),
      field("ubicacion_url", "Ubicación URL", "text"),
      field("longitud_km", "Longitud (km)", "int", { maxLength: 6 }),
      field("numero_curvas", "Número de curvas", "int", { maxLength: 2 }),
      field("foto_mapa_url", "Mapa / foto URL", "text"),
      field("esta_activo", "Activo", "checkbox", { defaultValue: true }),
    ],
    [column("nombre", "Nombre"), column("longitud_km", "Longitud"), column("numero_curvas", "Curvas"), column("esta_activo", "Activo")]
  ),
  campeonatos: entity(
    "campeonatos",
    "Campeonatos",
    "Campeonatos y temporadas.",
    [field("nombre", "Nombre", "nombre", { required: true }), field("anio", "Año", "int", { required: true, maxLength: 4 }), field("descripcion", "Descripción", "text"), field("esta_activo", "Activo", "checkbox", { defaultValue: true })],
    [column("nombre", "Nombre"), column("anio", "Año"), column("esta_activo", "Activo")]
  ),
  categorias: entity(
    "categorias",
    "Categorías",
    "Categorías por campeonato.",
    [
      field("campeonato_id", "Campeonato", "text", { placeholder: "ID o nombre del campeonato" }),
      field("nombre", "Nombre", "nombre", { required: true }),
      field("cilindrada_min", "Cilindrada mínima", "int", { required: true, maxLength: 4 }),
      field("cilindrada_max", "Cilindrada máxima", "int", { required: true, maxLength: 4 }),
      field("descripcion", "Descripción", "text"),
      field("precio_inscripcion", "Precio inscripción", "int", { defaultValue: 0, maxLength: 7 }),
    ],
    [column("nombre", "Nombre"), column("cilindrada_min", "Mín"), column("cilindrada_max", "Máx"), column("precio_inscripcion", "Precio")]
  ),
  eventos: entity(
    "eventos",
    "Eventos",
    "Eventos y cronograma principal.",
    [
      field("circuito_id", "Circuito", "text", { required: true, placeholder: "ID o nombre del circuito" }),
      field("campeonato_id", "Campeonato", "text", { required: true, placeholder: "ID o nombre del campeonato" }),
      field("nombre", "Nombre", "text", { required: true }),
      field("fecha_inicio", "Fecha inicio", "date", { required: true }),
      field("fecha_fin", "Fecha fin", "date", { required: true }),
      field("estado", "Estado", "select", { options: ["BORRADOR", "ABIERTO", "EN_CURSO", "FINALIZADO", "CANCELADO"] }),
      field("visible_portada", "Mostrar en página principal", "checkbox", { defaultValue: true }),
      field("costo_base", "Costo base", "number", { defaultValue: 0 }),
    ],
    [column("nombre", "Nombre"), column("fecha_inicio", "Inicio"), column("fecha_fin", "Fin"), column("estado", "Estado"), column("visible_portada", "Portada")]
  ),
  inscripciones: entity(
    "inscripciones",
    "Inscripciones",
    "Inscripciones de pilotos a eventos.",
    [
      field("evento_id", "Evento", "text", { placeholder: "ID o nombre del evento" }),
      field("piloto_id", "Piloto", "text", { placeholder: "ID o nombre del piloto" }),
      field("categoria_id", "Categoría", "text", { placeholder: "ID o nombre de la categoría" }),
      field("motocicleta_id", "Motocicleta", "text", { placeholder: "ID o nombre de la motocicleta" }),
      field("estado", "Estado", "select", { required: true, options: ["PENDIENTE", "PAGADA", "VALIDADA", "RECHAZADA"] }),
      field("dorsal_asignado", "Dorsal", "number", { required: true }),
    ],
    [
      column("dorsal_asignado", "Dorsal"),
      column("estado", "Estado"),
      column("evento_id", "Evento", (_value, item) => item?.evento?.nombre || item?.evento_id || ""),
      column("piloto_id", "Piloto", (_value, item) =>
        item?.piloto?.usuario ? `${item.piloto.usuario.nombre} ${item.piloto.usuario.apellido}` : item?.piloto_id || ""
      ),
    ]
  ),
  pagos: entity(
    "pagos",
    "Pagos",
    "Pagos y transacciones asociadas a inscripciones.",
    [
      field("inscripcion_id", "Inscripción", "text", { placeholder: "ID o referencia" }),
      field("monto", "Monto", "number", { required: true }),
      field("metodo_pago", "Método de pago", "text", { required: true }),
      field("id_transaccion", "ID transacción", "text", { required: true }),
      field("estado_pago", "Estado", "text", { required: true }),
      field("moneda", "Moneda", "text", { defaultValue: "GTQ" }),
      field("nit_factura", "NIT factura", "text"),
      field("nombre_factura", "Nombre factura", "text"),
      field("direccion_factura", "Dirección factura", "text"),
    ],
    [column("monto", "Monto"), column("metodo_pago", "Método"), column("estado_pago", "Estado"), column("moneda", "Moneda")]
  ),
  patrocinadores: entity(
    "patrocinadores",
    "Patrocinadores",
    "Patrocinadores y datos de contacto.",
    [field("nombre", "Nombre", "text", { required: true }), field("logo_url", "Logo URL", "text"), field("sitio_web", "Sitio web", "text"), field("contacto", "Contacto", "text")],
    [column("nombre", "Nombre"), column("sitio_web", "Sitio web"), column("contacto", "Contacto")]
  ),
  notificaciones: entity(
    "notificaciones",
    "Notificaciones",
    "Plantillas y notificaciones del sistema.",
    [
      field("usuario_id", "Usuario", "text", { placeholder: "ID o nombre del usuario" }),
      field("evento_id", "Evento", "text", { placeholder: "ID o nombre del evento" }),
      field("titulo", "Título", "text", { required: true }),
      field("mensaje", "Mensaje", "text", { required: true }),
      field("tipo", "Tipo", "text", { required: true }),
      field("leida", "Leída", "checkbox", { defaultValue: false }),
    ],
    [column("titulo", "Título"), column("tipo", "Tipo"), column("leida", "Leída")]
  ),
  preferencias: entity(
    "preferencias",
    "Preferencias",
    "Parámetros globales del sistema.",
    [field("clave", "Clave", "text", { required: true }), field("valor", "Valor", "text", { required: true }), field("descripcion", "Descripción", "text")],
    [column("clave", "Clave"), column("valor", "Valor"), column("descripcion", "Descripción")]
  ),
  documentos: entity(
    "documentos",
    "Documentos de evento",
    "Documentos relacionados a eventos y accesos.",
    [field("evento_id", "Evento", "text", { placeholder: "ID o nombre del evento" }), field("nombre", "Nombre", "text", { required: true }), field("archivo_url", "Archivo URL", "text", { required: true }), field("es_obligatorio", "Obligatorio", "checkbox", { defaultValue: false })],
    [column("nombre", "Nombre"), column("evento_id", "Evento", (_value, item) => item?.evento?.nombre || item?.evento_id || ""), column("es_obligatorio", "Obligatorio")]
  ),
  galeria: entity(
    "galeria",
    "Galería",
    "Fotos y recursos visuales de eventos.",
    [field("evento_id", "Evento", "text", { placeholder: "ID o nombre del evento" }), field("url", "URL", "text", { required: true }), field("descripcion", "Descripción", "text")],
    [column("evento_id", "Evento", (_value, item) => item?.evento?.nombre || item?.evento_id || ""), column("url", "URL"), column("descripcion", "Descripción")]
  ),
  "revision-tecnica": entity(
    "revision-tecnica",
    "Revisión técnica",
    "Revisiones técnicas y observaciones.",
    [
      field("inscripcion_id", "Inscripción", "text", { placeholder: "ID o referencia" }),
      field("usuario_id", "Comisario", "text", { placeholder: "ID o nombre del comisario" }),
      field("motocicleta_id", "Motocicleta", "text", { placeholder: "ID o referencia" }),
      field("estado", "Estado", "select", { required: true, options: ["PENDIENTE", "APROBADA", "RECHAZADA", "CONDICIONAL"] }),
      field("observaciones", "Observaciones", "text"),
    ],
    [column("inscripcion_id", "Inscripción"), column("estado", "Estado"), column("usuario_id", "Comisario")]
  ),
  sanciones: entity(
    "sanciones",
    "Sanciones",
    "Registro de sanciones y penalizaciones.",
    [
      field("inscripcion_id", "Inscripción", "text", { placeholder: "ID o referencia" }),
      field("comisario_id", "Comisario", "text", { placeholder: "ID o nombre del comisario" }),
      field("tipo_sancion_id", "Tipo de sanción", "text", { placeholder: "ID o nombre del tipo" }),
      field("motivo", "Motivo", "text", { required: true }),
      field("gravedad", "Gravedad", "text", { required: true }),
      field("penalizacion", "Penalización", "text", { required: true }),
    ],
    [column("motivo", "Motivo"), column("gravedad", "Gravedad"), column("penalizacion", "Penalización")]
  ),
  heats: entity(
    "heats",
    "Heats / Resultados",
    "Heats y configuración de vueltas.",
    [field("categoria_id", "Categoría", "text", { placeholder: "ID o nombre de la categoría" }), field("nombre", "Nombre", "text", { required: true }), field("vueltas", "Vueltas", "number", { required: true }), field("esta_activo", "Activo", "checkbox", { defaultValue: false })],
    [column("nombre", "Nombre"), column("vueltas", "Vueltas"), column("esta_activo", "Activo")]
  ),
};

export const MAINTENANCE_LIST = [
  MAINTENANCE_ENTITIES.usuarios,
  MAINTENANCE_ENTITIES.pilotos,
  MAINTENANCE_ENTITIES.roles,
  MAINTENANCE_ENTITIES.permisos,
  MAINTENANCE_ENTITIES.marcas,
  MAINTENANCE_ENTITIES.motocicletas,
  MAINTENANCE_ENTITIES.circuitos,
  MAINTENANCE_ENTITIES.campeonatos,
  MAINTENANCE_ENTITIES.categorias,
  MAINTENANCE_ENTITIES.eventos,
  MAINTENANCE_ENTITIES.inscripciones,
  MAINTENANCE_ENTITIES.pagos,
  MAINTENANCE_ENTITIES.patrocinadores,
  MAINTENANCE_ENTITIES.notificaciones,
  MAINTENANCE_ENTITIES.preferencias,
  MAINTENANCE_ENTITIES.documentos,
  MAINTENANCE_ENTITIES.galeria,
  MAINTENANCE_ENTITIES["revision-tecnica"],
  MAINTENANCE_ENTITIES.sanciones,
  MAINTENANCE_ENTITIES.heats,
];

// NOTE: MAINTENANCE_LIST removed. UI now fetches active modules from the backend
