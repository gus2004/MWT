"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../mantenimiento.module.css";
import { MAINTENANCE_ENTITIES } from "../maintenance.config";
import { deleteEvento, listEventos, publishEvento, saveDraftEvento } from "@/lib/adminApi";
import { useConfirm } from "@/components/ConfirmProvider";

const entityConfig = MAINTENANCE_ENTITIES.eventos;
const fields = entityConfig.fields ?? [];
const columns = entityConfig.columns ?? [];

const emptyValue = (field) => (field.type === "checkbox" ? Boolean(field.defaultValue ?? false) : field.defaultValue ?? "");

const createDraft = () =>
  fields.reduce((draft, field) => {
    draft[field.key] = emptyValue(field);
    return draft;
  }, {});

const formatValue = (field, value) => {
  if (field.type === "checkbox") return value ? "Sí" : "No";
  if (field.type === "number") return value === "" || value === null || value === undefined ? "" : String(value);
  return value ?? "";
};

const toRow = (item) => ({
  ...item,
  campeonato_id: item.campeonato_id ?? item.campeonato?.id ?? "",
  campeonato_nombre: item.campeonato?.nombre ?? item.campeonato_nombre ?? "",
  visible_portada: Boolean(item.visible_portada),
});

export default function EventosMantenimiento() {
  const { confirm } = useConfirm();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(() => createDraft());

  useEffect(() => {
    let mounted = true;

    listEventos()
      .then((data) => {
        if (!mounted) return;
        const rows = Array.isArray(data?.items) ? data.items.map(toRow) : [];
        setItems(rows);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "No fue posible cargar los eventos desde la BD.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) =>
      fields.some((field) => String(item[field.key] ?? "").toLowerCase().includes(normalizedQuery)) ||
      columns.some((column) => String(item[column.key] ?? "").toLowerCase().includes(normalizedQuery)) ||
      String(item.campeonato_nombre ?? "").toLowerCase().includes(normalizedQuery)
    );
  }, [items, query]);

  const activeItems = useMemo(
    () => visibleItems.filter((item) => String(item.estado || "").toUpperCase() !== "BORRADOR"),
    [visibleItems]
  );

  const archivedItems = useMemo(
    () => visibleItems.filter((item) => String(item.estado || "").toUpperCase() === "BORRADOR"),
    [visibleItems]
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft(createDraft());
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    const nextDraft = createDraft();
    fields.forEach((field) => {
      nextDraft[field.key] = field.type === "checkbox" ? Boolean(item[field.key]) : item[field.key] ?? "";
    });
    setEditingId(item.id);
    setDraft(nextDraft);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDraft(createDraft());
  };

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field.key]: value }));
  };

  const buildPayload = () => ({
    id: editingId || undefined,
    campeonato_id: draft.campeonato_id || null,
    nombre: draft.nombre,
    fecha_inicio: draft.fecha_inicio,
    fecha_fin: draft.fecha_fin,
    estado: "BORRADOR",
    visible_portada: false,
    costo_base: draft.costo_base,
  });

  const upsertLocalRow = (row) => {
    setItems((current) => {
      const normalized = toRow(row);
      const next = current.filter((item) => item.id !== normalized.id);
      return [normalized, ...next];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await saveDraftEvento(buildPayload());
      upsertLocalRow(result);
      closeForm();
    } catch (err) {
      setError(err?.message || "No fue posible guardar el borrador.");
    }
  };

  const handlePublish = async (item) => {
    try {
      const result = await publishEvento({
        id: item.id,
        campeonato_id: item.campeonato_id || item.campeonato?.id || item.campeonato_nombre || null,
        nombre: item.nombre,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        estado: "ABIERTO",
        visible_portada: true,
        costo_base: item.costo_base,
      });
      upsertLocalRow(result);
      setError("");
    } catch (err) {
      setError(err?.message || "No fue posible publicar el evento.");
    }
  };

  const handleArchive = async (item) => {
    try {
      const result = await saveDraftEvento({
        id: item.id,
        campeonato_id: item.campeonato_id || item.campeonato?.id || item.campeonato_nombre || null,
        nombre: item.nombre,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        estado: "BORRADOR",
        visible_portada: false,
        costo_base: item.costo_base,
      });
      upsertLocalRow(result);
      setError("");
    } catch (err) {
      setError(err?.message || "No fue posible archivar el evento.");
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm({ title: "Eliminar evento", message: `¿Eliminar el evento "${item.nombre}"? Esta acción borrará también sus inscripciones y datos asociados.`, confirmText: "Eliminar" });
    if (!confirmed) return;

    try {
      await deleteEvento(item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setError("");
    } catch (err) {
      setError(err?.message || "No fue posible eliminar el evento.");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>{entityConfig.title.toUpperCase()}</header>
      <section className={styles.panel}>
        <div className={styles.entityHeader}>
          <div>
            <h2 className={styles.entityTitle}>{entityConfig.title}</h2>
            <p className={styles.entityDescription}>{entityConfig.description}</p>
          </div>
          <div className={styles.entityActions}>
            <Link href="/dashboard/mantenimiento" className={styles.secondaryBtn}>
              Volver
            </Link>
            <button className={styles.btn} type="button" onClick={openCreate}>
              Nuevo borrador
            </button>
          </div>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchCopy}>
            <p className={styles.searchLabel}>Eventos de BD</p>
            <h3 className={styles.searchTitle}>Lista sincronizada con la base de datos</h3>
            <p className={styles.searchText}>Aquí ves los eventos existentes y puedes republicarlos para que aparezcan en la portada pública.</p>
          </div>
          <div className={styles.searchControls}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Buscar evento..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className={styles.counter}>{loading ? "Cargando..." : `${visibleItems.length} eventos visibles`}</div>
          </div>
        </div>

        {error ? <div className={styles.emptyState}>{error}</div> : null}

        <div className={styles.fakeTable}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1) + 1}, minmax(140px, 1fr))` }}>
            {columns.map((column) => (
              <div key={column.key} className={styles.th}>
                {column.label}
              </div>
            ))}
            <div className={styles.th}>Acciones</div>
          </div>

          <div className={styles.tableBody}>
            {activeItems.length === 0 ? (
              <div className={styles.emptyState}>{loading ? "Cargando eventos..." : "No hay eventos publicados en la base de datos."}</div>
            ) : (
              activeItems.map((item) => (
                <div key={item.id} className={styles.tr} style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1) + 1}, minmax(140px, 1fr))` }}>
                  {columns.map((column) => {
                    const field = fields.find((entry) => entry.key === column.key) ?? { type: "text" };
                    const rawValue = column.key === "campeonato_id" ? item.campeonato_nombre || item.campeonato_id : item[column.key];
                    const content = column.formatter ? column.formatter(rawValue, item) : formatValue(field, rawValue);

                    return (
                      <div key={column.key} className={styles.td}>
                        {content || "—"}
                      </div>
                    );
                  })}
                  <div className={styles.rowActions}>
                    <button className={styles.textButton} type="button" onClick={() => openEdit(item)}>
                      Editar
                    </button>
                    <button className={styles.textButton} type="button" onClick={() => handleArchive(item)}>
                      Archivar
                    </button>
                    <button className={styles.textButtonDanger} type="button" onClick={() => handleDelete(item)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <section className={styles.archivedSection}>
          <button type="button" className={styles.archivedHeader} onClick={() => setShowArchived((current) => !current)}>
            <span className={styles.archivedTitle}>Archivados</span>
            <span className={styles.archivedCount}>{archivedItems.length}</span>
            <span className={styles.archivedChevron}>{showArchived ? "▾" : "▸"}</span>
          </button>

          {showArchived ? (
            <div className={styles.archivedList}>
              {archivedItems.length === 0 ? (
                <div className={styles.emptyState}>No hay borradores archivados.</div>
              ) : (
                archivedItems.map((item) => (
                  <article key={item.id} className={styles.archivedCard}>
                    <div>
                      <p className={styles.archivedKicker}>Borrador</p>
                      <h3 className={styles.archivedName}>{item.nombre}</h3>
                      <p className={styles.archivedMeta}>{formatValue({ type: "text" }, item.campeonato_nombre || item.campeonato_id) || "Sin campeonato"}</p>
                    </div>
                    <div className={styles.rowActions}>
                      <button className={styles.textButton} type="button" onClick={() => openEdit(item)}>
                        Editar
                      </button>
                      <button className={styles.textButton} type="button" onClick={() => handlePublish(item)}>
                        Publicar
                      </button>
                      <button className={styles.textButtonDanger} type="button" onClick={() => handleDelete(item)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </section>
      </section>

      {isFormOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeForm}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{editingId ? `Editar ${entityConfig.title}` : `Nuevo ${entityConfig.title}`}</h3>
                <p className={styles.modalDescription}>Publica o actualiza el evento en la base de datos y en la portada pública.</p>
              </div>
              <button className={styles.secondaryBtn} type="button" onClick={closeForm}>
                Cerrar
              </button>
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              {fields.map((field) => (
                <label key={field.key} className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.type === "select" ? (
                    <select
                      className={styles.input}
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      required={field.required}
                    >
                      <option value="">Seleccione</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      checked={Boolean(draft[field.key])}
                      onChange={(event) => handleChange(field, event.target.checked)}
                    />
                  ) : (
                    <input
                      className={styles.input}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      required={field.required}
                    />
                  )}
                </label>
              ))}

              <div className={styles.formActions}>
                <button className={styles.secondaryBtn} type="button" onClick={closeForm}>
                  Cancelar
                </button>
                <button className={styles.btn} type="submit">
                  Guardar borrador
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}