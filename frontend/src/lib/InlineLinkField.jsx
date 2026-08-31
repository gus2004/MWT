"use client";

import { useEffect, useRef, useState } from "react";

export default function InlineLinkField({
  label,
  placeholder = "Buscar...",
  fetchUrl,
  createUrl,
  onSelect,
  value,
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!q) {
      setItems([]);
      return;
    }
    setLoading(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${fetchUrl}?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
        setOpen(true);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [q, fetchUrl]);

  async function handleCreateInline() {
    if (!createUrl || !q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: q.trim() }),
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      setItems((s) => [created, ...s]);
      setQ("");
      setOpen(false);
      onSelect && onSelect(created);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(item) {
    setOpen(false);
    setQ(item.title || item.name || "");
    onSelect && onSelect(item);
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {label ? <label style={{ display: "block", marginBottom: 6 }}>{label}</label> : null}
      <input
        placeholder={placeholder}
        value={q || value || ""}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        style={{ padding: "8px 10px", width: "100%", boxSizing: "border-box" }}
      />

      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ddd",
            marginTop: 4,
            zIndex: 40,
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: 10 }}>Cargando...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 10, display: "flex", justifyContent: "space-between" }}>
              <span>No se encontraron resultados</span>
              {createUrl ? (
                <button onClick={handleCreateInline} style={{ marginLeft: 8 }}>
                  Crear "{q}"
                </button>
              ) : null}
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                onClick={() => handleSelect(it)}
                style={{ padding: 10, borderBottom: "1px solid #f2f2f2", cursor: "pointer" }}
              >
                <div style={{ fontWeight: 600 }}>{it.title || it.name}</div>
                {it.subtitle ? <div style={{ fontSize: 12 }}>{it.subtitle}</div> : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
