export const MODULE_ROLE_KEYS = ["ADMIN", "COMISARIO", "JUEZ_MESA", "STAFF_TECNICO", "PILOTO"];

export const MODULE_GROUPS = [
  {
    key: "eventos",
    label: "EVENTOS",
    description:
      "Calendario, ciclo de vida y cronograma de los eventos del campeonato. Permite crear, publicar, abrir inscripciones y eliminar eventos.",
    roles: ["ADMIN", "JUEZ_MESA", "STAFF_TECNICO"],
    children: [
      {
        key: "horarios",
        label: "HORARIOS",
        description:
          "Cronograma oficial de actividades por evento: prácticas, clasificación, mangas y finales.",
      },
    ],
  },
  {
    key: "inscripciones",
    label: "INSCRIPCIONES",
    description:
      "Formulario y administración de inscripciones por evento y categoría con dorsales libres, pagos y validación.",
    roles: ["ADMIN", "STAFF_TECNICO"],
    children: [
      {
        key: "pilotos",
        label: "PILOTOS",
        description:
          "Registro y administración de pilotos: perfil personal, datos deportivos, licencias y motocicletas.",
      },
      {
        key: "motos",
        label: "MOTOS",
        description:
          "Motocicletas registradas por piloto: marca, modelo, cilindrada, motor y chasis.",
      },
    ],
  },
  {
    key: "competencia",
    label: "COMPETENCIA",
    description:
      "Operación de carrera: qualy, parrilla, mangas y resultados con puntos por posición.",
    roles: ["ADMIN", "JUEZ_MESA", "COMISARIO", "PILOTO"],
    children: [
      {
        key: "clasificaciones",
        label: "CLASIFICACIONES",
        description:
          "Ingreso de tiempos de vuelta, parrilla de salida y tabla oficial por categoría y evento.",
      },
      {
        key: "resultados",
        label: "RESULTADOS",
        description:
          "Resultados por evento y categoría: posición, tiempos y acumulado de puntos.",
      },
    ],
  },
  {
    key: "comisario",
    label: "COMISARIATO",
    description:
      "Sanciones, apelaciones, revisión técnica y trazabilidad de las decisiones oficiales.",
    roles: ["ADMIN", "COMISARIO"],
    children: [
      {
        key: "notificaciones",
        label: "NOTIFICACIONES",
        description:
          "Centro de notificaciones, plantillas de comunicación y auditoría de envíos.",
      },
    ],
  },
  {
    key: "reportes",
    label: "REPORTES",
    description:
      "Estadísticas del campeonato, participación, marcas y generador de reportes exportables.",
    roles: ["ADMIN"],
    children: [],
  },
  {
    key: "mantenimiento",
    label: "MANTENIMIENTO",
    pathPrefix: "mantenimiento",
    description:
      "Gestión de parámetros del sistema: usuarios, roles, campeonatos, categorías, circuitos, pagos y más.",
    roles: ["ADMIN"],
    children: [
      { key: "eventos", label: "EVENTOS", description: "CRUD de eventos del campeonato." },
      { key: "inscripciones", label: "INSCRIPCIONES", description: "CRUD de inscripciones." },
      { key: "pilotos", label: "PILOTOS", description: "CRUD de pilotos." },
      { key: "motos", label: "MOTOCICLETAS", description: "CRUD de motocicletas." },
      { key: "usuarios", label: "USUARIOS", description: "Cuentas del sistema." },
      { key: "roles", label: "ROLES", description: "Roles y permisos por rol." },
      { key: "permisos", label: "PERMISOS", description: "Permisos del RBAC." },
      { key: "campeonatos", label: "CAMPEONATOS", description: "Campeonatos activos." },
      { key: "categorias", label: "CATEGORÍAS", description: "Categorías por cilindrada." },
      { key: "circuitos", label: "CIRCUITOS", description: "Circuitos del calendario." },
      { key: "marcas", label: "MARCAS", description: "Marcas de motocicletas." },
      { key: "pagos", label: "PAGOS", description: "Pagos de inscripciones." },
      { key: "sanciones", label: "SANCIONES", description: "Sanciones y tipos de sanción." },
      { key: "revision-tecnica", label: "REVISIÓN TÉCNICA", description: "Checklist de revisión." },
      { key: "notificaciones", label: "NOTIFICACIONES", description: "Plantillas y preferencias." },
      { key: "documentos", label: "DOCUMENTOS", description: "Documentos por piloto." },
      { key: "galeria", label: "GALERÍA", description: "Multimedia del campeonato." },
      { key: "heats", label: "HEATS", description: "Configuración de heats." },
      { key: "patrocinadores", label: "PATROCINADORES", description: "Patrocinadores del circuito." },
      { key: "preferencias", label: "PREFERENCIAS", description: "Preferencias del sistema." },
    ],
  },
];

export const MODULES = MODULE_GROUPS.flatMap((g) => [
  { key: g.key, label: g.label, description: g.description, group: g.label, roles: g.roles },
  ...g.children.map((c) => ({
    key: c.key,
    label: c.label,
    description: c.description,
    group: g.label,
    roles: g.roles,
  })),
]);

export function getUserRoles(user) {
  const raw = user?.roles || user?.rol?.nombre || user?.role || null;
  let roles = [];
  if (Array.isArray(raw)) roles = raw.map((r) => (typeof r === "string" ? r : r?.nombre || r?.codigo || r?.nombre_rol || "")).filter(Boolean);
  else if (typeof raw === "string") roles = [raw];

  // normaliza: la BD usa "STAFF" y el sistema "STAFF_TECNICO" -> mismo rol
  return roles.map((r) => (String(r).toUpperCase() === "STAFF" ? "STAFF_TECNICO" : String(r).toUpperCase())).filter(Boolean);
}

export function getAccessibleModules(user) {
  const roles = getUserRoles(user);

  // Sin roles conocidos: no se conceden módulos (fail-closed).
  if (!roles.length) return [];

  // ADMIN (super usuario) ve todo.
  if (roles.includes("ADMIN") || roles.includes("admin")) {
    return MODULE_GROUPS.map((g) => ({ ...g, children: [...g.children] }));
  }

  const allowed = new Set(roles.map((r) => r.toUpperCase()));
  return MODULE_GROUPS.filter((g) => (g.roles || []).some((r) => allowed.has(r.toUpperCase())))
    .map((g) => ({ ...g, children: [...g.children] }));
}

export function getAccessibleModulesFlat(user) {
  return getAccessibleModules(user).flatMap((g) => [
    { key: g.key, label: g.label, description: g.description, group: g.label },
    ...g.children.map((c) => ({ key: c.key, label: c.label, description: c.description, group: g.label })),
  ]);
}

export function groupHref(group) {
  return `/dashboard/${group.pathPrefix ?? group.key}`;
}

export function childHref(group, child) {
  if (group.pathPrefix) return `/dashboard/${group.pathPrefix}/${child.key}`;
  return `/dashboard/${child.key}`;
}