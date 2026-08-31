"use client";

import { useState } from "react";
import InlineLinkField from "./InlineLinkField";

export default function InlineLinkExample() {
  const [selectedEvento, setSelectedEvento] = useState(null);

  return (
    <div style={{ maxWidth: 680 }}>
      <h3>Ejemplo: Vincular Campeonato a Evento (inline)</h3>
      <InlineLinkField
        label="Evento"
        placeholder="Busca un evento por nombre..."
        fetchUrl="/api/events/search"
        createUrl="/api/events"
        onSelect={(e) => setSelectedEvento(e)}
      />

      {selectedEvento ? (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid #eee" }}>
          <strong>Seleccionado:</strong>
          <div>{selectedEvento.title}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{selectedEvento.subtitle}</div>
        </div>
      ) : null}
    </div>
  );
}
