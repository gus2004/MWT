'use client';
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../mantenimiento.module.css";
import { createPiloto, deletePiloto, updatePiloto } from "@/lib/adminApi";
import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const EMPTY_FORM = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  dpi: "",
  telefono_personal: "",
  direccion: "",
  dorsal_preferido: "",
};

const DORSAL_OPTIONS = Array.from({ length: 99 }, (_, index) => index + 1);

const PAISES = [
  { codigo: "GT", nombre: "Guatemala", dial: "+502", flag: "ðŸ‡¬ðŸ‡¹", min: 8, max: 8 },
  { codigo: "SV", nombre: "El Salvador", dial: "+503", flag: "ðŸ‡¸ðŸ‡»", min: 8, max: 8 },
  { codigo: "HN", nombre: "Honduras", dial: "+504", flag: "ðŸ‡­ðŸ‡³", min: 8, max: 8 },
  { codigo: "NI", nombre: "Nicaragua", dial: "+505", flag: "ðŸ‡³ðŸ‡®", min: 8, max: 8 },
  { codigo: "CR", nombre: "Costa Rica", dial: "+506", flag: "ðŸ‡¨ðŸ‡·", min: 8, max: 8 },
  { codigo: "PA", nombre: "PanamÃ¡", dial: "+507", flag: "ðŸ‡µðŸ‡¦", min: 8, max: 8 },
  { codigo: "BZ", nombre: "Belice", dial: "+501", flag: "ðŸ‡§ðŸ‡¿", min: 7, max: 7 },
  { codigo: "MX", nombre: "MÃ©xico", dial: "+52", flag: "ðŸ‡²ðŸ‡½", min: 10, max: 10 },
  { codigo: "US", nombre: "Estados Unidos", dial: "+1", flag: "ðŸ‡ºðŸ‡¸", min: 10, max: 10 },
  { codigo: "CA", nombre: "CanadÃ¡", dial: "+1", flag: "ðŸ‡¨ðŸ‡¦", min: 10, max: 10 },
  { codigo: "CO", nombre: "Colombia", dial: "+57", flag: "ðŸ‡¨ðŸ‡´", min: 10, max: 10 },
  { codigo: "AR", nombre: "Argentina", dial: "+54", flag: "ðŸ‡¦ðŸ‡·", min: 10, max: 10 },
  { codigo: "CL", nombre: "Chile", dial: "+56", flag: "ðŸ‡¨ðŸ‡±", min: 9, max: 9 },
  { codigo: "PE", nombre: "PerÃº", dial: "+51", flag: "ðŸ‡µðŸ‡ª", min: 9, max: 9 },
  { codigo: "VE", nombre: "Venezuela", dial: "+58", flag: "ðŸ‡»ðŸ‡ª", min: 10, max: 10 },
  { codigo: "EC", nombre: "Ecuador", dial: "+593", flag: "ðŸ‡ªðŸ‡¨", min: 9, max: 9 },
  { codigo: "DO", nombre: "Rep. Dominicana", dial: "+1", flag: "ðŸ‡©ðŸ‡´", min: 10, max: 10 },
  { codigo: "ES", nombre: "EspaÃ±a", dial: "+34", flag: "ðŸ‡ªðŸ‡¸", min: 9, max: 9 },
  { codigo: "IT", nombre: "Italia", dial: "+39", flag: "ðŸ‡®ðŸ‡¹", min: 9, max: 10 },
];

function decodeJwtSubject(token) {
  if (!token) return "";
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "="));
    const payload = JSON.parse(json);
    return String(payload?.sub || payload?.userId || payload?.id || "");
  } catch {
    return "";
  }
}

export default function PilotosMaintenancePage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [operatorId, setOperatorId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ nombre: "", apellido: "", dorsal_preferido: "" });
  const [savingRowIds, setSavingRowIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [returnToInscripciones, setReturnToInscripciones] = useState(false);
  const [telefonoPais, setTelefonoPais] = useState("GT");

  // ===== PAGINACIÃ“N =====
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const getFieldLabel = (field) => {
    const labels = {
      nombre: "Nombre",
      apellido: "Apellido",
      email: "Correo",
      password: "ContraseÃ±a",
      dpi: "DPI",
      telefono_personal: "TelÃ©fono",
      direccion: "DirecciÃ³n",
      dorsal_preferido: "Dorsal preferido",
    };

    return labels[field] || field;
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setReturnToInscripciones(params.get("desde") === "inscripciones");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    const subject = decodeJwtSubject(token);
    if (subject) {
      setOperatorId(subject);
      return;
    }

    try {
      const rawUser = window.localStorage.getItem("mwt_user");
      if (!rawUser) return;
      const parsed = JSON.parse(rawUser);
      const resolvedId = parsed?.id || parsed?.usuario?.id || parsed?.usuario_id || parsed?.data?.id || parsed?.data?.usuario?.id;
      if (resolvedId) setOperatorId(String(resolvedId));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/pilotos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        if (!mounted) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (mounted) setError(err?.message || "No se pudieron cargar los pilotos.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // 1) Filtrar por bÃºsqueda
  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const usuario = item.usuario || {};
      return [
        usuario.nombre,
        usuario.apellido,
        usuario.email,
        item.dorsal_preferido,
        item.tipo_sangre,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(term));
    });
  }, [items, query]);

  // 2) Resetear a pÃ¡gina 1 cuando cambia la bÃºsqueda
  useEffect(() => {
    setPage(1);
  }, [query]);

  // 3) Cortar para la pÃ¡gina actual
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  const telefonoPaisInfo = useMemo(
    () => PAISES.find((p) => p.codigo === telefonoPais) || PAISES[0],
    [telefonoPais]
  );

  const handleChange = (field, value) => {
    let processedValue = value;

    if (field === "nombre" || field === "apellido") {
      processedValue = value.replace(/[^a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘Ã¼Ãœ\s'-]/g, "");
    }

    if (field === "dpi") {
      processedValue = value.replace(/\D/g, "");
    }

    if (field === "telefono_personal") {
      processedValue = value.replace(/\D/g, "").slice(0, telefonoPaisInfo.max);
    }

    setForm((current) => ({ ...current, [field]: processedValue }));
  };

  const handlePaisChange = (codigo) => {
    const nuevoPais = PAISES.find((p) => p.codigo === codigo) || PAISES[0];
    setTelefonoPais(codigo);
    setForm((current) => ({
      ...current,
      telefono_personal: (current.telefono_personal || "").slice(0, nuevoPais.max),
    }));
  };

  const resolveOperatorId = () => {
    return operatorId || decodeJwtSubject(getToken());
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      nombre: item.usuario?.nombre || "",
      apellido: item.usuario?.apellido || "",
      dorsal_preferido: item.dorsal_preferido != null ? String(item.dorsal_preferido) : "",
    });
    setMessage("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm({ nombre: "", apellido: "", dorsal_preferido: "" });
  };

  const saveEdit = async (itemId) => {
    setMessage("");
    setError("");
    const resolvedOperatorId = resolveOperatorId();
    if (!resolvedOperatorId) {
      setError("No hay operador cargado para auditorÃ­a. Inicia sesiÃ³n otra vez.");
      return;
    }

    setSavingRowIds((s) => new Set(s).add(itemId));
    try {
      const payload = {
        nombre: editForm.nombre.trim().toUpperCase(),
        apellido: editForm.apellido.trim().toUpperCase(),
        dorsal_preferido: editForm.dorsal_preferido ? Number(editForm.dorsal_preferido) : undefined,
        usuario_id: resolvedOperatorId,
      };

      const updated = await updatePiloto(itemId, payload);

      setItems((current) => current.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          dorsal_preferido: updated?.dorsal_preferido ?? payload.dorsal_preferido ?? null,
          usuario: {
            ...(it.usuario || {}),
            nombre: updated?.usuario?.nombre ?? payload.nombre,
            apellido: updated?.usuario?.apellido ?? payload.apellido,
            email: it.usuario?.email,
          },
        };
      }));

      setMessage("Piloto actualizado correctamente.");
      cancelEdit();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el piloto.");
    } finally {
      setSavingRowIds((s) => {
        const next = new Set(s);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Â¿Eliminar piloto ${item.usuario?.nombre || ""} ${item.usuario?.apellido || ""}? Esta acciÃ³n lo desactiva.`)) return;

    setMessage("");
    setError("");
    const resolvedOperatorId = resolveOperatorId();
    if (!resolvedOperatorId) {
      setError("No hay operador cargado para auditorÃ­a. Inicia sesiÃ³n otra vez.");
      return;
    }

    setDeletingIds((s) => new Set(s).add(item.id));
    try {
      await deletePiloto(item.id, resolvedOperatorId);
      setItems((current) => current.filter((it) => it.id !== item.id));
      if (editingId === item.id) cancelEdit();
      setMessage("Piloto eliminado correctamente.");
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el piloto.");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    setFieldErrors([]);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFieldErrors(["email"]);
      setError("El correo electrÃ³nico no tiene un formato vÃ¡lido.");
      setSaving(false);
      return;
    }

    if (form.telefono_personal) {
      const telLength = form.telefono_personal.length;
      if (telLength < telefonoPaisInfo.min || telLength > telefonoPaisInfo.max) {
        setFieldErrors(["telefono_personal"]);
        setError(`El telÃ©fono de ${telefonoPaisInfo.nombre} debe tener ${telefonoPaisInfo.min === telefonoPaisInfo.max ? `${telefonoPaisInfo.min} dÃ­gitos` : `${telefonoPaisInfo.min} a ${telefonoPaisInfo.max} dÃ­gitos`}.`);
        setSaving(false);
        return;
      }
    }

    try {
      const resolvedOperatorId = operatorId || decodeJwtSubject(getToken());
      if (!resolvedOperatorId) {
        throw new Error("No hay operador cargado para auditorÃ­a. Inicia sesiÃ³n otra vez.");
      }

      const nombreUpper = form.nombre.trim().toUpperCase();
      const apellidoUpper = form.apellido.trim().toUpperCase();
      const telefonoCompleto = form.telefono_personal
        ? `${telefonoPaisInfo.dial.replace("+", "")}${form.telefono_personal}`
        : undefined;

      const payload = {
        nombre: nombreUpper,
        apellido: apellidoUpper,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dpi: form.dpi || undefined,
        telefono_personal: telefonoCompleto,
        direccion: form.direccion || undefined,
        dorsal_preferido: form.dorsal_preferido ? Number(form.dorsal_preferido) : undefined,
        usuario_id: resolvedOperatorId,
      };

      const created = await createPiloto(payload);
      const pilotoId = created?.perfil_piloto?.id || created?.id || created?.piloto?.id;

      setItems((current) => [
        {
          id: pilotoId || `${Date.now()}`,
          usuario: {
            nombre: nombreUpper,
            apellido: apellidoUpper,
            email: form.email.trim().toLowerCase(),
          },
          dorsal_preferido: form.dorsal_preferido ? Number(form.dorsal_preferido) : null,
        },
        ...current,
      ]);

      setForm(EMPTY_FORM);
      setTelefonoPais("GT");
      setMessage("Piloto guardado correctamente.");

      if (returnToInscripciones && pilotoId) {
        window.location.href = `/dashboard/inscripciones?piloto_id=${encodeURIComponent(pilotoId)}`;
      }
    } catch (err) {
      const details = err?.details || {};
      const uniqueFields = Array.isArray(details.fields)
        ? details.fields.filter(Boolean)
        : details.field
          ? [details.field]
          : [];

      // If backend reports unique constraint but the record was actually created (race), try to recover
      const status = err?.status || err?.statusCode || null;
      const errMsg = String(err?.message || "").toLowerCase();
      const isConflict = status === 409 || errMsg.includes('ya existe') || errMsg.includes('unique');

      if (isConflict) {
        try {
          // attempt to find pilot by email in the latest list
          const token = getToken();
          const q = new URLSearchParams();
          if (form.email) q.set('q', form.email);
          const res = await fetch(`${API_URL}/api/pilotos${q.toString() ? `?${q.toString()}` : ''}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            const found = Array.isArray(data.items)
              ? data.items.find((p) => (p.usuario?.email || '').toLowerCase() === (form.email || '').toLowerCase())
              : null;

            if (found) {
              setItems((current) => [found, ...current.filter((it) => it.id !== found.id)]);
              setForm(EMPTY_FORM);
              setTelefonoPais("GT");
              setFieldErrors([]);
              setMessage('Piloto guardado correctamente.');
              if (returnToInscripciones && found.id) {
                window.location.href = `/dashboard/inscripciones?piloto_id=${encodeURIComponent(found.id)}`;
              }
              return;
            }
          }
        } catch {
          // fallthrough to show error below
        }
      }

      if (uniqueFields.length > 0) {
        setFieldErrors(uniqueFields);
        const fieldText = uniqueFields.map(getFieldLabel).join(', ');
        setError(`Cambia este dato: ${fieldText}. ${err?.message || 'No se pudo guardar el piloto.'}`);
      } else {
        setError(err?.message || 'No se pudo guardar el piloto.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>PILOTOS</header>
        <section className={styles.panel}><p className={styles.intro}>Cargando pilotos...</p></section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>PILOTOS</header>
      <section className={styles.panel}>
        <div className={styles.entityHeader}>
          <div>
            <h2 className={styles.entityTitle}>Pilotos</h2>
            <p className={styles.entityDescription}>Alta y consulta de pilotos desde mantenimiento.</p>
          </div>
          <div className={styles.entityActions}>
            {returnToInscripciones ? <Link href="/dashboard/inscripciones" className={styles.btn}>Volver a inscripciones</Link> : null}
            <Link href="/dashboard/mantenimiento" className={styles.secondaryBtn}>Volver</Link>
          </div>
        </div>

        <div className={styles.searchSection} style={{ marginTop: 0 }}>
          <div className={styles.searchCopy}>
            <p className={styles.searchLabel}>Nuevo piloto</p>
            <h3 className={styles.searchTitle}>Inscribir nuevo piloto</h3>
            <p className={styles.searchText}>Completa el formulario para crear el piloto en la base de datos.</p>
          </div>
          <div className={styles.searchControls}>
            {message ? <p className={styles.searchText} style={{ color: "#86efac" }}>{message}</p> : null}
            {error ? <p className={styles.searchText} style={{ color: "#fca5a5" }}>{error}</p> : null}
          </div>
        </div>

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre *</span>
            <input className={`${styles.input} ${fieldErrors.includes("nombre") ? styles.inputError : ""}`} value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Apellido *</span>
            <input className={`${styles.input} ${fieldErrors.includes("apellido") ? styles.inputError : ""}`} value={form.apellido} onChange={(e) => handleChange("apellido", e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Correo *</span>
            <input className={`${styles.input} ${fieldErrors.includes("email") ? styles.inputError : ""}`} type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>ContraseÃ±a *</span>
            <input className={`${styles.input} ${fieldErrors.includes("password") ? styles.inputError : ""}`} type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>DPI</span>
            <input className={`${styles.input} ${fieldErrors.includes("dpi") ? styles.inputError : ""}`} value={form.dpi} onChange={(e) => handleChange("dpi", e.target.value)} maxLength={13} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>TelÃ©fono</span>
            <div style={{ display: "flex", gap: 8 }}>
              <select className={styles.input} value={telefonoPais} onChange={(e) => handlePaisChange(e.target.value)} style={{ width: 150, flexShrink: 0 }} title={telefonoPaisInfo.nombre}>
                {PAISES.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo} title={pais.nombre}>{pais.flag} {pais.dial}</option>
                ))}
              </select>
              <input
                className={`${styles.input} ${fieldErrors.includes("telefono_personal") ? styles.inputError : ""}`}
                value={form.telefono_personal}
                onChange={(e) => handleChange("telefono_personal", e.target.value)}
                placeholder={`${telefonoPaisInfo.max} dÃ­gitos, sin cÃ³digo`}
                maxLength={telefonoPaisInfo.max}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>PaÃ­s: {telefonoPaisInfo.flag} {telefonoPaisInfo.nombre} ({telefonoPaisInfo.dial}) Â· se guarda con cÃ³digo de paÃ­s.</span>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>DirecciÃ³n</span>
            <input className={`${styles.input} ${fieldErrors.includes("direccion") ? styles.inputError : ""}`} value={form.direccion} onChange={(e) => handleChange("direccion", e.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Dorsal preferido</span>
            <select className={`${styles.input} ${fieldErrors.includes("dorsal_preferido") ? styles.inputError : ""}`} value={form.dorsal_preferido} onChange={(e) => handleChange("dorsal_preferido", e.target.value)}>
              <option value="">Seleccione un dorsal</option>
              {DORSAL_OPTIONS.map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.formActions} style={{ gridColumn: "1 / -1" }}>
            <button className={styles.btn} type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar piloto"}</button>
          </div>
        </form>

        <div className={styles.searchSection}>
          <div className={styles.searchCopy}>
            <p className={styles.searchLabel}>Pilotos registrados</p>
            <h3 className={styles.searchTitle}>Lista de pilotos ya guardados</h3>
            <p className={styles.searchText}>Busca por nombre, correo o dorsal preferido.</p>
          </div>
          <div className={styles.searchControls}>
            <input className={styles.searchInput} type="search" placeholder="Buscar piloto..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className={styles.counter}>{filteredItems.length} registros visibles</div>
          </div>
        </div>

        <div className={styles.fakeTable}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <div className={styles.th}>Nombre</div>
            <div className={styles.th}>Correo</div>
            <div className={styles.th}>Dorsal preferido</div>
            <div className={styles.th}>Acciones</div>
          </div>
          <div className={styles.tableBody}>
            {paginatedItems.length === 0 ? (
              <div className={styles.emptyState}>No hay pilotos registrados.</div>
            ) : paginatedItems.map((item) => (
              <div key={item.id} className={styles.tr} style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                <div className={styles.td}>
                  {editingId === item.id ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input className={styles.input} style={{ minWidth: 120 }} value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value.replace(/[^a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘Ã¼Ãœ\s'-]/g, "") }))} />
                      <input className={styles.input} style={{ minWidth: 120 }} value={editForm.apellido} onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value.replace(/[^a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘Ã¼Ãœ\s'-]/g, "") }))} />
                    </div>
                  ) : (
                    <>{item.usuario?.nombre} {item.usuario?.apellido}</>
                  )}
                </div>
                <div className={styles.td}>{item.usuario?.email || "â€”"}</div>
                <div className={styles.td}>
                  {editingId === item.id ? (
                    <select className={styles.input} value={editForm.dorsal_preferido} onChange={(e) => setEditForm((f) => ({ ...f, dorsal_preferido: e.target.value }))}>
                      <option value="">Sin dorsal</option>
                      {DORSAL_OPTIONS.map((number) => (
                        <option key={number} value={number}>{number}</option>
                      ))}
                    </select>
                  ) : (
                    <>{item.dorsal_preferido ?? "â€”"}</>
                  )}
                </div>
                <div className={styles.td}>
                  {editingId === item.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className={styles.btn} type="button" onClick={() => saveEdit(item.id)} disabled={savingRowIds.has(item.id)}>
                        {savingRowIds.has(item.id) ? "Guardando..." : "Guardar"}
                      </button>
                      <button className={styles.secondaryBtn} type="button" onClick={cancelEdit} disabled={savingRowIds.has(item.id)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className={styles.secondaryBtn} type="button" onClick={() => startEdit(item)} disabled={deletingIds.has(item.id)}>
                        Editar
                      </button>
                      <button className={styles.btn} type="button" onClick={() => handleDelete(item)} disabled={deletingIds.has(item.id)} style={{ background: "#dc2626" }}>
                        {deletingIds.has(item.id) ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CONTROLES DE PAGINACIÃ“N ===== */}
        {filteredItems.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#475569" }}>Mostrar</span>
              <select
                className={styles.input}
                style={{ width: 70, padding: "4px 8px", fontSize: 13 }}
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span style={{ fontSize: 13, color: "#475569" }}>por pÃ¡gina</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.3)", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: p === page ? "1px solid #0ea5a4" : "1px solid rgba(148,163,184,0.3)",
                    background: p === page ? "#0ea5a4" : "#fff",
                    color: p === page ? "#fff" : "#0f172a",
                    cursor: "pointer",
                    fontSize: 13,
                    minWidth: 34,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.3)", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}
              >
                Siguiente
              </button>
            </div>

            <span style={{ fontSize: 13, color: "#475569" }}>
              PÃ¡gina {page} de {totalPages} ({filteredItems.length} resultados)
            </span>
          </div>
        )}
      </section>
    </main>
  );
}