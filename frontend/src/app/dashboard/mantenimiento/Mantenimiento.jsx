"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./mantenimiento.module.css";
import { MAINTENANCE_ENTITIES } from "./maintenance.config";

// This page no longer uses local example lists. It requests modules from backend

const MAINTENANCE_SECTIONS = [
  {
    key: "seguridad",
    title: "Seguridad y acceso",
    description: "Usuarios, roles, permisos, sesiones y recuperación de acceso.",
    items: ["usuarios", "roles", "permisos"],
  },
  {
    key: "perfiles",
    title: "Pilotos y motos",
    items: ["pilotos", "motocicletas", "marcas"],
  },
  {
    key: "competencia",
    title: "Carreras y configuración",
    description: "Circuitos, campeonatos, categorías y parámetros de competencia.",
    items: ["circuitos", "campeonatos", "categorias", "preferencias"],
  },
  {
    key: "eventos",
    title: "Eventos e inscripciones",
    description: "Eventos, inscripciones, pagos, documentos y patrocinios.",
    items: ["eventos", "inscripciones", "pagos", "patrocinadores", "documentos", "galeria"],
  },
  {
    key: "control",
    title: "Control de pista",
    description: "Revisión técnica, sanciones y validaciones operativas.",
    items: ["revision-tecnica", "sanciones"],
  },
  {
    key: "resultados",
    title: "Resultados y seguimiento",
    description: "Resultados, clasificación y seguimiento final de carrera.",
    items: ["heats"],
  },
  {
    key: "comunicacion",
    title: "Comunicación y sistema",
    description: "Notificaciones y ajustes de seguimiento del sistema.",
    items: ["notificaciones"],
  },
];

function Card({ section }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>{section.title}</div>
      <div className={styles.cardDesc}>{section.description}</div>
      <div className={styles.cardActions}>
        <Link href={`/dashboard/mantenimiento/${section.key}`} className={styles.btn}>
          Gestionar
        </Link>
      </div>
    </div>
  );
}

export default function Mantenimiento() {
  const [query, setQuery] = useState("");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // loading already true by default; avoid synchronous setState inside effect
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/public/maintenance/modules`)
      .then(async (r) => {
        const contentType = r.headers.get("content-type") || "";
        const body = await r.text();

        if (!r.ok) {
          throw new Error(body.slice(0, 200) || `HTTP ${r.status}`);
        }

        if (!contentType.includes("application/json")) {
          throw new Error("El backend no devolvió JSON válido.");
        }

        return JSON.parse(body);
      })
      .then((data) => {
        if (!mounted) return;
        // expect data.items = [{ key, title, description, count }]
        const apiItems = Array.isArray(data.items) ? data.items : [];
        const defaults = Object.values(MAINTENANCE_ENTITIES).map((e) => ({ key: e.key, title: e.title, description: e.description, count: 0 }));
        const merged = defaults.map((item) => apiItems.find((apiItem) => apiItem.key === item.key) || item);
        const apiOnly = apiItems.filter((apiItem) => !merged.some((item) => item.key === apiItem.key));
        setModules([...merged, ...apiOnly]);
      })
      .catch((err) => {
        if (!mounted) return;
        // on network/error fallback to local entities so UI is not empty
        console.error("Error fetching maintenance modules:", err);
        const defaults = Object.values(MAINTENANCE_ENTITIES).map((e) => ({ key: e.key, title: e.title, description: e.description, count: 0 }));
        setModules(defaults);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return modules;

    return modules.filter((section) => {
      return (
        (section.title || "").toLowerCase().includes(normalizedQuery) ||
        (section.description || "").toLowerCase().includes(normalizedQuery) ||
        (section.key || "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, modules]);

  const visibleGroups = useMemo(() => {
    return MAINTENANCE_SECTIONS.map((section) => {
      const items = visibleSections.filter((item) => section.items.includes(item.key));
      return {
        ...section,
        items,
      };
    }).filter((section) => section.items.length > 0);
  }, [visibleSections]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>MANTENIMIENTO</header>
      <section className={styles.panel}>
        <p className={styles.intro}>Seleccione la entidad que desea gestionar (visual).</p>

        <div className={styles.searchSection}>
          <div className={styles.searchCopy}>
            <p className={styles.searchLabel}>Buscador rápido</p>
            <h3 className={styles.searchTitle}>Filtra las entidades de mantenimiento</h3>
            <p className={styles.searchText}>
              Escribe el nombre de la entidad o una palabra relacionada para ubicarla más rápido.
            </p>
          </div>
          <div className={styles.searchControls}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Buscar módulo de mantenimiento..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className={styles.counter}>{loading ? "Cargando..." : `${visibleSections.length} módulos visibles`}</div>
          </div>
        </div>

        <div className={styles.sectionStack}>
          {visibleGroups.map((group) => (
            <section key={group.key} className={styles.groupBlock}>
              <div className={styles.groupHeader}>
                <div>
                  <p className={styles.groupEyebrow}>Sección</p>
                  <h3 className={styles.groupTitle}>{group.title}</h3>
                  <p className={styles.groupDescription}>{group.description}</p>
                </div>
                <div className={styles.groupCount}>{group.items.length} módulos</div>
              </div>

              <div className={styles.grid}>
                {group.items.map((s) => (
                  <Card key={s.key} section={s} />
                ))}
              </div>
            </section>
          ))}

          {visibleGroups.length === 0 ? (
            <div className={styles.emptyState}>
              No se encontraron módulos de mantenimiento con ese criterio.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}