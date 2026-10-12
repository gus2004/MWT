"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./mantenimiento.module.css";
import { formatCui, maskPhone, onlyLetters, onlyDigits, DEFAULT_COUNTRY } from "@/lib/formats";
import { getCurrentUser } from "@/lib/soporteApi";
import { getUserRoles } from "@/lib/modules";
import { useConfirm } from "@/components/ConfirmProvider";

const isAdminUser = () => getUserRoles(getCurrentUser()).includes("ADMIN");

const applyMask = (field, value) => {
  switch (field.type) {
    case "cui":
      return formatCui(value);
    case "phone":
    case "tel":
      return maskPhone(DEFAULT_COUNTRY, value);
    case "nombre":
    case "letters":
      return onlyLetters(value);
    case "int":
    case "dorsal":
      return onlyDigits(value, field.maxLength || 9);
    default:
      return value;
  }
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )mwt_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

const emptyValue = (field) => (field.type === "checkbox" ? Boolean(field.defaultValue ?? false) : field.defaultValue ?? "");

const createDraft = (fields) =>
  fields.reduce((draft, field) => {
    draft[field.key] = emptyValue(field);
    return draft;
  }, {});

const formatValue = (field, value) => {
  if (field.type === "checkbox") return value ? "Sí" : "No";
  if (field.type === "number") return value === "" || value === null || value === undefined ? "" : String(value);
  if (field.type === "date" && value) return String(value).slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value ?? "";
};

const resolveValue = (item, key) => {
  if (!item || typeof item !== "object") return undefined;
  if (item[key] !== undefined && item[key] !== null) return item[key];
  const visited = new Set();
  const walk = (obj) => {
    if (!obj || typeof obj !== "object" || visited.has(obj)) return undefined;
    visited.add(obj);
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    for (const value of Object.values(obj)) {
      const found = walk(value);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return walk(item);
};

export default function EntityVisual({ config, name, description, sampleColumns = [] }) {
  const { confirm } = useConfirm();
  const entityConfig = config ?? {
    key: name?.toLowerCase?.().replace(/\s+/g, "-") ?? "mantenimiento",
    title: name ?? "Mantenimiento",
    description: description ?? "Registro visual conectado al backend.",
    fields: [],
    columns: sampleColumns.map((label) => ({ key: label.toLowerCase(), label })),
  };

  const fields = entityConfig.fields ?? [];
  const columns = entityConfig.columns?.length
    ? entityConfig.columns
    : sampleColumns.map((label) => ({ key: label.toLowerCase(), label }));

  const formFields = useMemo(
    () => (isAdminUser() ? fields : fields.filter((f) => f.key !== "roles")),
    [fields]
  );

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(() => createDraft(fields));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [estado, setEstado] = useState("");
  const [viewItem, setViewItem] = useState(null);
  const [dynamicOptions, setDynamicOptions] = useState({});

  useEffect(() => {
    const dynamicFields = fields.filter((f) => f.type === "select" && f.dynamicOptions);
    if (!dynamicFields.length) return;
    let mounted = true;
    Promise.all(
      dynamicFields.map(async (f) => {
        try {
          const data = await api(f.dynamicOptions);
          const items = Array.isArray(data.items) ? data.items : [];
          return { key: f.key, items };
        } catch (err) {
          return { key: f.key, items: [] };
        }
      })
    ).then((results) => {
      if (!mounted) return;
      const map = {};
      results.forEach((r) => (map[r.key] = r.items));
      setDynamicOptions(map);
    });
    return () => {
      mounted = false;
    };
  }, [fields]);

  const estadoFilter = entityConfig.estadoFilter;
  const hasEstadoFilter = Boolean(estadoFilter && estadoFilter.options?.length);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const estadoQ = estado ? `?estado=${encodeURIComponent(estado)}` : "";
      const data = await api(`/api/mantenimiento/crud/${entityConfig.key}${estadoQ}`);
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(1);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los datos.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [entityConfig.key]);

  const loadDetail = async (id) => {
    try {
      setBusy(true);
      const data = await api(`/api/mantenimiento/crud/${entityConfig.key}/${id}`);
      setViewItem(data);
    } catch (err) {
      setError(err?.message || "No se pudo cargar la ficha.");
    } finally {
      setBusy(false);
    }
  };

  const openView = (item) => {
    if (entityConfig.key === "usuarios" || entityConfig.key === "inscripciones") {
      loadDetail(item.id);
    } else {
      setViewItem(item);
    }
  };

  const doSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;
    const direction = sortDir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = resolveValue(a, sortKey) ?? "";
      const bv = resolveValue(b, sortKey) ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;
      return String(av).localeCompare(String(bv), "es", { numeric: true }) * direction;
    });
  }, [items, sortKey, sortDir]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedItems;
    return sortedItems.filter((item) =>
      fields.some((field) => String(resolveValue(item, field.key) ?? "").toLowerCase().includes(normalizedQuery)) ||
      columns.some((column) => String(resolveValue(item, column.key) ?? "").toLowerCase().includes(normalizedQuery))
    );
  }, [sortedItems, query, fields, columns]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / perPage));
  const pageItems = visibleItems.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setEditingId(null);
    setDraft(createDraft(formFields));
    setError("");
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    const nextDraft = createDraft(formFields);
    formFields.forEach((field) => {
      const raw = resolveValue(item, field.key);
      if (field.type === "checkbox") nextDraft[field.key] = Boolean(raw);
      else if (field.type === "date" && raw) nextDraft[field.key] = String(raw).slice(0, 10);
      else if (field.key === "roles" && Array.isArray(raw)) nextDraft[field.key] = raw.map((r) => r?.rol?.nombre || r?.nombre || "").find(Boolean) || "";
      else nextDraft[field.key] = raw ?? "";
    });
    setEditingId(item.id);
    setDraft(nextDraft);
    setError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDraft(createDraft(formFields));
  };

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field.key]: applyMask(field, value) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = formFields.reduce((record, field) => {
        const rawValue = draft[field.key];
        if (field.type === "number" || field.type === "int" || field.type === "dorsal") record[field.key] = rawValue === "" || rawValue === null ? undefined : Number(rawValue);
        else if (field.type === "checkbox") record[field.key] = Boolean(rawValue);
        else record[field.key] = rawValue === "" ? undefined : rawValue;
        return record;
      }, {});

      if (editingId) {
        await api(`/api/mantenimiento/crud/${entityConfig.key}/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setNotice("Registro actualizado correctamente.");
      } else {
        await api(`/api/mantenimiento/crud/${entityConfig.key}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Registro guardado correctamente.");
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el registro.");
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (id) => {
    if (!(await confirm({ title: "Eliminar registro", message: "¿Eliminar este registro? Esta acción no se puede deshacer.", confirmText: "Eliminar" }))) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/mantenimiento/crud/${entityConfig.key}/${id}`, { method: "DELETE" });
      setNotice("Registro eliminado.");
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el registro.");
    } finally {
      setBusy(false);
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
            <button className={styles.btn} type="button" onClick={openCreate} disabled={busy}>
              Nuevo registro
            </button>
          </div>
        </div>

        {error ? <div className={styles.noticeDanger}>{error}</div> : null}
        {notice ? <div className={styles.noticeSuccess}>{notice}</div> : null}

        <div className={styles.searchSection}>
          <div className={styles.searchCopy}>
            <p className={styles.searchLabel}>Buscador rápido</p>
            <h3 className={styles.searchTitle}>Filtra esta tabla sin ocultarla</h3>
            <p className={styles.searchText}>
              Escribe un término y la tabla se actualizará de forma inmediata para que encuentres registros más rápido.
            </p>
          </div>
          <div className={styles.searchControls}>
            {hasEstadoFilter ? (
              <select
                className={styles.searchInput}
                style={{ flex: "0 0 auto", minWidth: 160 }}
                value={estado}
                onChange={(event) => { setEstado(event.target.value); setPage(1); }}
              >
                <option value="">{estadoFilter.all ?? "Todos"}</option>
                {estadoFilter.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : null}
            <input
              className={styles.searchInput}
              type="search"
              placeholder={`Buscar en ${entityConfig.title.toLowerCase()}...`}
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            />
            <div className={styles.counter}>{loading ? "Cargando..." : `${visibleItems.length} registros visibles`}</div>
          </div>
        </div>

          <div className={styles.fakeTable}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1) + 1}, minmax(140px, 1fr))` }}>
            {columns.map((column) => (
              <button
                key={column.key}
                type="button"
                className={`${styles.th} ${styles.thSortable}`}
                onClick={() => doSort(column.key)}
              >
                {column.label}
                {sortKey === column.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </button>
            ))}
            <div className={styles.th}>Acciones</div>
          </div>

          <div className={styles.tableBody}>
            {loading ? (
              <div className={styles.emptyState}>Cargando registros desde el sistema...</div>
            ) : visibleItems.length === 0 ? (
              <div className={styles.emptyState}>No hay registros. Use &quot;Nuevo registro&quot; para capturar el primero.</div>
            ) : (
              pageItems.map((item) => (
                <div key={item.id} className={styles.tr} style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1) + 1}, minmax(140px, 1fr))` }}>
                  {columns.map((column) => {
                    const field = fields.find((entry) => entry.key === column.key) ?? { type: "text" };
                    const rawValue = resolveValue(item, column.key);
                    const content = column.formatter ? column.formatter(rawValue, item) : formatValue(field, rawValue);

                    return (
                      <div key={column.key} className={styles.td}>
                        {content || "—"}
                      </div>
                    );
                  })}
                  <div className={styles.rowActions}>
                    <button className={styles.textButton} type="button" onClick={() => openView(item)} disabled={busy}>
                      Ver
                    </button>
                    <button className={styles.textButton} type="button" onClick={() => openEdit(item)} disabled={busy}>
                      Editar
                    </button>
                    <button className={styles.textButtonDanger} type="button" onClick={() => removeItem(item.id)} disabled={busy}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.pagination}>
          <button
            className={styles.secondaryBtn}
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <div className={styles.pageCounter}>
            Página {page} de {totalPages} · {visibleItems.length} registro(s)
          </div>
          <button
            className={styles.secondaryBtn}
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente →
          </button>
        </div>
      </section>

      {isFormOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeForm}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{editingId ? `Editar ${entityConfig.title}` : `Nuevo ${entityConfig.title}`}</h3>
                <p className={styles.modalDescription}>Complete la información necesaria para guardar el registro.</p>
              </div>
              <button className={styles.secondaryBtn} type="button" onClick={closeForm}>
                Cerrar
              </button>
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              {formFields.map((field) => (
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
                      {(dynamicOptions[field.key] || field.options || []).map((option) => {
                        const label = typeof option === "object" ? option.nombre || option.label : option;
                        const value = typeof option === "object" ? option.nombre || option.value : option;
                        return (
                          <option key={String(value)} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      checked={Boolean(draft[field.key])}
                      onChange={(event) => handleChange(field, event.target.checked)}
                    />
) : field.type === "password" ? (
                    <PwdFieldInput
                      className={styles.input}
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      className={styles.input}
                      type={["cui", "phone", "tel", "nombre", "letters", "int", "dorsal"].includes(field.type) ? "text" : field.type}
                      inputMode={["phone", "tel", "int"].includes(field.type) ? "numeric" : undefined}
                      placeholder={field.placeholder}
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      required={field.required}
                    />
                  )}
                </label>
              ))}

              {error ? <div className={styles.noticeDanger}>{error}</div> : null}

              <div className={styles.formActions}>
                <button className={styles.secondaryBtn} type="button" onClick={closeForm}>
                  Cancelar
                </button>
                <button className={styles.btn} type="submit" disabled={busy}>
                  {busy ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewItem ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setViewItem(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Ficha · {entityConfig.title}</h3>
                <p className={styles.modalDescription}>Información completa del registro.</p>
              </div>
              <button className={styles.secondaryBtn} type="button" onClick={() => setViewItem(null)}>
                Cerrar
              </button>
            </div>

            {entityConfig.key === "usuarios" ? (
              <UsuarioFicha item={viewItem} />
            ) : entityConfig.key === "inscripciones" ? (
              <InscripcionFicha item={viewItem} />
            ) : (
              <div className={styles.formGrid}>
                {fields.map((field) => {
                  const raw = resolveValue(viewItem, field.key);
                  const contenido = formatValue(field, raw);
                  return (
                    <div key={field.key} className={styles.field}>
                      <span className={styles.fieldLabel}>{field.label}</span>
                      <div className={styles.detailValue}>{contenido === "" || contenido == null ? "—" : String(contenido)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PwdFieldInput({ className, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        className={className}
        type={show ? "text" : "password"}
        {...props}
        style={{ ...(props.style || {}), paddingRight: 36 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        style={{ position: "absolute", right: 10, border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#64748b", padding: 0 }}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function UsuarioFicha({ item }) {
  const pp = item.perfil_personal || {};
  const pl = item.perfil_piloto || {};
  const roles = Array.isArray(item.roles)
    ? item.roles.map((r) => r?.rol?.nombre || r?.nombre || "").filter(Boolean).join(", ") || "Sin rol"
    : "—";
  const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

  return (
    <div className={styles.stack}>
      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Datos de cuenta</h4>
        <div className={styles.formGrid}>
          <Detail label="Nombre" value={fmt(item.nombre)} />
          <Detail label="Apellido" value={fmt(item.apellido)} />
          <Detail label="Correo" value={fmt(item.email)} />
          <Detail label="Estado" value={item.esta_activo ? "Activo" : "De baja"} />
          <Detail label="Roles" value={fmt(roles)} />
          <Detail label="Creado" value={item.fecha_creacion ? fmt(String(item.fecha_creacion).slice(0, 10)) : "—"} />
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Perfil personal</h4>
        <div className={styles.formGrid}>
          <Detail label="CUI / DPI" value={fmt(pp.cui)} />
          <Detail label="Fecha de nacimiento" value={pp.fecha_nacimiento ? fmt(String(pp.fecha_nacimiento).slice(0, 10)) : "—"} />
          <Detail label="Género" value={fmt(pp.genero)} />
          <Detail label="Teléfono" value={fmt(pp.telefono_personal)} />
          <Detail label="Dirección" value={fmt(pp.direccion)} />
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Perfil piloto</h4>
        <div className={styles.formGrid}>
          <Detail label="Dorsal preferido" value={fmt(pl.dorsal_preferido)} />
          <Detail label="Tipo de sangre" value={fmt(pl.tipo_sangre)} />
          <Detail label="Alergias" value={fmt(pl.alergias)} />
          <Detail label="Condiciones médicas" value={fmt(pl.condiciones_medicas)} />
          <Detail label="Contacto de emergencia" value={fmt(pl.nombre_contacto_emergencia)} />
          <Detail label="Tel. emergencia" value={fmt(pl.telefono_emergencia)} />
          <Detail label="Seguro médico" value={fmt(pl.seguro_medico_empresa)} />
          <Detail label="Póliza" value={fmt(pl.poliza_seguro)} />
          <Detail label="Licencia federación" value={fmt(pl.licencia_federacion)} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.detailValue}>{value}</div>
    </div>
  );
}

const dFecha = (v) => (v ? String(v).slice(0, 10) : "—");
const drc = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

function InscripcionFicha({ item }) {
  if (!item) return null;
  const ev = item.evento || {};
  const cat = item.categoria || {};
  const piloto = item.piloto || {};
  const usuario = piloto.usuario || {};
  const moto = item.motocicleta || {};
  const pago = item.pago;
  const rev = item.revision_tecnica;
  const resultados = Array.isArray(item.resultados) ? item.resultados : [];

  return (
    <div className={styles.stack}>
      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Inscripción</h4>
        <div className={styles.formGrid}>
          <Detail label="Evento" value={drc(ev.nombre)} />
          <Detail label="Campeonato" value={drc(ev.campeonato?.nombre)} />
          <Detail label="Circuito" value={drc(ev.circuito?.nombre)} />
          <Detail label="Categoría" value={drc(cat.nombre)} />
          <Detail label="Dorsal asignado" value={drc(item.dorsal_asignado)} />
          <Detail label="Estado" value={drc(item.estado)} />
          <Detail label="Fecha de registro" value={dFecha(item.fecha_registro)} />
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Piloto</h4>
        <div className={styles.formGrid}>
          <Detail label="Nombre" value={drc(`${usuario.nombre} ${usuario.apellido}`.trim())} />
          <Detail label="Correo" value={drc(usuario.email)} />
          <Detail label="Dorsal preferido" value={drc(piloto.dorsal_preferido)} />
          <Detail label="Tipo de sangre" value={drc(piloto.tipo_sangre)} />
          <Detail label="Licencia" value={drc(piloto.licencia_federacion)} />
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Motocicleta</h4>
        <div className={styles.formGrid}>
          <Detail label="Marca" value={drc(moto.marca?.nombre)} />
          <Detail label="Modelo" value={drc(moto.modelo)} />
          <Detail label="Año" value={drc(moto.anio)} />
          <Detail label="Cilindrada" value={drc(moto.cilindrada_real)} />
          <Detail label="VIN" value={drc(moto.vin)} />
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Pago</h4>
        {pago ? (
          <div className={styles.formGrid}>
            <Detail label="Monto" value={drc(`${pago.monto} ${pago.moneda || "GTQ"}`)} />
            <Detail label="Método" value={drc(pago.metodo_pago)} />
            <Detail label="Estado" value={drc(pago.estado_pago)} />
            <Detail label="Transacción" value={drc(pago.id_transaccion)} />
            <Detail label="Fecha de pago" value={dFecha(pago.fecha_pago)} />
          </div>
        ) : (
          <div className={styles.detailValue}>Sin pago registrado.</div>
        )}
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Revisión técnica</h4>
        {rev ? (
          <>
            <div className={styles.formGrid}>
              <Detail label="Estado" value={drc(rev.estado)} />
              <Detail label="Comisario" value={drc(rev.comisario ? `${rev.comisario.nombre} ${rev.comisario.apellido}` : "")} />
              <Detail label="Fecha" value={dFecha(rev.fecha_revision)} />
              <Detail label="Observaciones" value={drc(rev.observaciones)} />
            </div>
            {Array.isArray(rev.detalles) && rev.detalles.length ? (
              <ul className={styles.checklist}>
                {rev.detalles.map((d) => (
                  <li key={d.id} className={styles.checklistItem}>
                    <span className={d.esta_bien ? styles.badgeOk : styles.badgeBad}>
                      {d.esta_bien ? "OK" : "NO"}
                    </span>
                    <span>{d.item?.nombre || "Ítem"}</span>
                    {d.comentario ? <span className={styles.checklistNote}>— {d.comentario}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.detailValue}>Sin detalles de revisión.</div>
            )}
          </>
        ) : (
          <div className={styles.detailValue}>Sin revisión técnica registrada.</div>
        )}
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Resultados</h4>
        {resultados.length ? (
          <div className={styles.formGrid}>
            {resultados.map((r) => (
              <Detail key={r.id} label={`Heat: ${r.heat?.nombre || "—"} · Pos. ${r.posicion}`} value={drc(r.mejor_vuelta || `${r.tiempo_total || r.vuelta_1 || "—"}`)} />
            ))}
          </div>
        ) : (
          <div className={styles.detailValue}>Sin resultados registrados.</div>
        )}
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Sanciones</h4>
        {Array.isArray(item.sanciones) && item.sanciones.length ? (
          <div className={styles.formGrid}>
            {item.sanciones.map((s) => (
              <Detail key={s.id} label={`${s.tipo_sancion?.nombre || "Sanción"} — ${s.gravedad}`} value={drc(s.motivo || s.penalizacion)} />
            ))}
          </div>
        ) : (
          <div className={styles.detailValue}>Sin sanciones.</div>
        )}
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>Historial de estados</h4>
        {Array.isArray(item.historial) && item.historial.length ? (
          <div className={styles.timeline}>
            {item.historial.map((h, idx) => (
              <div key={h.id || idx} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div>
                  <div className={styles.timelineTitle}>
                    {h.estado_nuevo ? `Estado: ${h.estado_nuevo}` : h.accion}
                    {h.estado_anterior ? <span className={styles.timelineSub}> ← {h.estado_anterior}</span> : null}
                  </div>
                  <div className={styles.timelineMeta}>
                    {new Date(h.fecha).toLocaleString()} · {h.usuario}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.detailValue}>Sin historial de cambios.</div>
        )}
      </div>
    </div>
  );
}