"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
import { useConfirm } from "@/components/ConfirmProvider";

function parseTimeToMs(value) {
  if (!value || value === "-" || value === "NSP" || value === "TNC" || value === "DQ") return null;

  const clean = String(value).replace(",", ".").replace(/\s/g, "");

  if (clean.includes(":")) {
    const [minutesPart, restPart] = clean.split(":");
    const [secondsPart, millisPart = "0"] = restPart.split(".");
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);
    const millis = Number(millisPart.padEnd(3, "0").slice(0, 3));
    if (Number.isNaN(minutes) || Number.isNaN(seconds) || Number.isNaN(millis)) return null;
    return minutes * 60000 + seconds * 1000 + millis;
  }

  const parts = clean.split(".");
  if (parts.length < 2) return null;
  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  const millis = parts[2] ? Number(parts[2].padEnd(3, "0").slice(0, 3)) : 0;
  if (Number.isNaN(minutes) || Number.isNaN(seconds) || Number.isNaN(millis)) return null;
  return minutes * 60000 + seconds * 1000 + millis;
}

function formatMs(ms) {
  if (ms == null) return "-";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function diffStr(msA, msB) {
  if (msA == null || msB == null) return "-";
  const diff = msA - msB;
  if (diff === 0) return "POLE";
  return `+${formatMs(Math.abs(diff))}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar el logo (${response.status}).`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo convertir el logo para la exportación."));
    reader.readAsDataURL(blob);
  });
}

function displayValue(value) {
  return value == null || value === "" ? "-" : value;
}

function getEventLogo(campeonato, circuito, categoria) {
  const eventText = `${campeonato} ${circuito} ${categoria}`.toLowerCase();
  return eventText.includes("yamaha") ? "/Yamaha-Logо.png" : "/LOGO-ACMG.png";
}

export default function TablaClasificacionOficial({
  filas = [],
  campeonato = "Clasificación oficial",
  circuito = "",
  valida = 1,
  fecha = new Date().toLocaleDateString("es-GT"),
  categoria = "",
  hora = "",
  logoIzquierdaUrl = null,
  logoDerechaUrl = null,
  mostrarPuntos = false,
  tipoTabla = "clasificacion",
  maxRows = 20,
}) {
  const { notify } = useConfirm();
  const tablaRef = useRef(null);
  const esTablaResultados = tipoTabla === "resultado" || tipoTabla === "final";

  const normalizadas = useMemo(() => {
    return filas
      .map((fila, index) => {
        const vuelta1 = displayValue(fila.vuelta1 ?? fila.vuelta_1 ?? fila.vueltaUno);
        const vuelta2 = displayValue(fila.vuelta2 ?? fila.vuelta_2 ?? fila.vueltaDos);
        const mejorTiempo = displayValue(fila.mejor_tiempo ?? fila.mejorTiempo ?? fila.mejor_vuelta);
        const ms1 = parseTimeToMs(vuelta1 || mejorTiempo);
        const ms2 = parseTimeToMs(vuelta2);
        const candidatos = [ms1, ms2].filter((value) => value != null);
        const mejorMs = mejorTiempo !== "-"
          ? parseTimeToMs(mejorTiempo)
          : candidatos.length
            ? Math.min(...candidatos)
            : null;
        const pilotoNombre = fila.nombre || fila.pilotoNombre || (fila.piloto?.usuario
          ? `${fila.piloto.usuario.nombre} ${fila.piloto.usuario.apellido}`.trim()
          : fila.piloto_id || "-");

        return {
          ...fila,
          pos: fila.pos ?? fila.posicion ?? index + 1,
          dorsal: displayValue(fila.dorsal ?? fila.dorsal_asignado),
          nombre: pilotoNombre,
          clase: displayValue(fila.clase || fila.categoria?.nombre || fila.categoria?.codigo),
          vuelta1,
          vuelta2,
          mejorMs,
          mejorStr: mejorMs == null ? "NSP" : formatMs(mejorMs),
          sinTiempo: mejorMs == null,
          puntos: fila.puntos ?? 0,
          esMejorV1: ms1 != null && ms1 === mejorMs,
          esMejorV2: ms2 != null && ms2 === mejorMs && ms1 !== mejorMs,
        };
      })
      .sort((a, b) => {
        if (tipoTabla === "resultado" || tipoTabla === "final") return Number(a.pos) - Number(b.pos);
        if (a.mejorMs == null && b.mejorMs == null) return 0;
        if (a.mejorMs == null) return 1;
        if (b.mejorMs == null) return -1;
        return a.mejorMs - b.mejorMs;
      });
  }, [filas, tipoTabla]);

  const liderMs = normalizadas[0]?.mejorMs ?? null;
  const filasRender = useMemo(() => {
    return normalizadas.slice(0, maxRows);
  }, [normalizadas, maxRows]);

  const exportarCSV = () => {
    const cabeceras = tipoTabla === "final"
      ? ["POS", "#", "PILOTO", "CAT.", "H1", "H2", "TOTAL"]
      : tipoTabla === "resultado"
      ? ["POSICIÓN", "#", "PILOTO", "CAT.", "PUNTOS", "SANCIÓN"]
      : ["Pos", "#", "Piloto", "Clase", "Vuelta 1", "Vuelta 2", "Mejor Tiempo", "Dif. Líder", ...(mostrarPuntos ? ["Puntos"] : [])];
    const filasCsv = normalizadas.map((fila) => [
      ...(tipoTabla === "final"
        ? [fila.pos, fila.dorsal, fila.nombre, fila.clase, fila.puntosHeat1, fila.puntosHeat2, fila.puntosTotal]
        : tipoTabla === "resultado"
        ? [fila.pos, fila.dorsal, fila.nombre, fila.clase, fila.puntos, displayValue(fila.sancion)]
        : [fila.pos, fila.dorsal, fila.nombre, fila.clase, displayValue(fila.vuelta1), displayValue(fila.vuelta2), fila.mejorStr, diffStr(fila.mejorMs, liderMs), ...(mostrarPuntos ? [fila.puntos] : [])]),
    ]);

    const meta = [
      [`Campeonato: ${campeonato}`],
      [`Circuito: ${circuito}`],
      [`Válida: ${valida}`, `Fecha: ${fecha}`],
      [`Categoría: ${categoria}`, `Hora: ${hora}`],
      [],
    ];

    const contenido = [
      ...meta.map((row) => row.join(",")),
      cabeceras.join(","),
      ...filasCsv.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")),
      "",
      '"♦ NSP = No Se Presentó","♦ TI = Tiempo Inválido","♦ DQ = Descalificado","♦ TNC = Tiempo No Completo"',
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `clasificacion_${String(categoria || "oficial").replace(/\s+/g, "_")}_f${valida}.csv`);
  };

  const exportarExcel = async () => {
    let XLSX;
    try {
      XLSX = await import("xlsx");
    } catch {
      await notify({ title: "Exportación no disponible", message: "La librería xlsx no está disponible. Usa la exportación CSV." });
      return;
    }

    const workbook = XLSX.utils.book_new();
    const aoa = [
      [campeonato, "", "", circuito],
      [tipoTabla === "final" ? "RESULTADO FINAL" : tipoTabla === "resultado" ? "Resultados" : "Clasificación", "", "Válida:", valida, "Fecha:", fecha],
      [`Categoría: ${categoria}`, "", "", "", "Hora:", hora],
      [],
      tipoTabla === "final"
        ? ["POS", "#", "PILOTO", "CAT.", "H1", "H2", "TOTAL"]
        : tipoTabla === "resultado"
        ? ["POSICIÓN", "#", "PILOTO", "CAT.", "PUNTOS", "SANCIÓN"]
        : ["Pos", "#", "Piloto", "Clase", "Vuelta 1", "Vuelta 2", "Mejor Tiempo", "Dif. Líder", ...(mostrarPuntos ? ["Puntos"] : [])],
      ...normalizadas.map((fila) => tipoTabla === "final"
        ? [fila.pos, fila.dorsal, fila.nombre, fila.clase, fila.puntosHeat1, fila.puntosHeat2, fila.puntosTotal]
        : tipoTabla === "resultado"
        ? [fila.pos, fila.dorsal, fila.nombre, fila.clase, fila.puntos, displayValue(fila.sancion)]
        : [fila.pos, fila.dorsal, fila.nombre, fila.clase, displayValue(fila.vuelta1), displayValue(fila.vuelta2), fila.mejorStr, diffStr(fila.mejorMs, liderMs), ...(mostrarPuntos ? [fila.puntos] : [])]),
      [],
      ["♦ NSP = No Se Presentó", "♦ TI = Tiempo Inválido", "♦ DQ = Descalificado", "♦ TNC = Tiempo No Completo"],
    ];

    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    sheet["!cols"] = [{ wch: 5 }, { wch: 6 }, { wch: 36 }, { wch: 13 }, { wch: 11 }, { wch: 11 }, { wch: 13 }, { wch: 11 }];
    sheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, "Clasificación");
    XLSX.writeFile(workbook, `clasificacion_${String(categoria || "oficial").replace(/\s+/g, "_")}_f${valida}.xlsx`);
  };

  const exportarPDF = async () => {
    if (!tablaRef.current) return;

    const tabla = tablaRef.current.cloneNode(true);
    tabla.querySelectorAll("tr.vacia").forEach((fila) => fila.remove());
    const ventana = window.open("", "printWindow");
    if (!ventana) return;

    try {
      const imagenes = Array.from(tabla.querySelectorAll("img"));
      await Promise.all(imagenes.map(async (imagen) => {
        const source = imagen.getAttribute("src");
        if (!source) return;
        const absoluteUrl = new URL(source, window.location.origin).href;
        imagen.setAttribute("src", await imageUrlToDataUrl(absoluteUrl));
      }));
    } catch (error) {
      ventana.close();
      await notify({
        title: "Exportación no disponible",
        message: error.message || "No se pudieron cargar los logos para el PDF.",
      });
      return;
    }

    const html = tabla.innerHTML;
    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Clasificación - ${categoria}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: ${esTablaResultados ? "13px" : "11px"}; color: #000; background: #fff; }
          .tabla-wrap { width: 100%; max-width: 900px; margin: 0 auto; }
          .enc-principal { background: #fff; color: #1f2937; padding: 8px 12px; display: grid; grid-template-columns: 72px 1fr 140px; align-items: center; border-bottom: 2px solid #2f4f4f; }
          .enc-principal .titulo { font-size: 18px; font-weight: 800; text-align: center; color: #254b4a; }
          .enc-principal .subtitulo { font-size: 11px; opacity: .9; text-align: right; color: #254b4a; }
          .image-slot { width: 56px; height: 44px; border: 1px dashed #94a3b8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #64748b; background: #f8fafc; overflow: hidden; }
          .image-slot img { width: 100%; height: 100%; object-fit: contain; }
          .enc-meta { background: #fff; padding: 8px 14px; display: flex; justify-content: center; gap: 36px; align-items: center; font-size: 13px; border-bottom: 2px solid #2f4f4f; color: #254b4a; font-weight: 700; }
          .enc-meta strong { margin-right: 4px; }
          .enc-cat { background: #fff; padding: 8px 14px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; border-bottom: 2px solid #2f4f4f; color: #254b4a; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          thead tr { background: #fff; color: #254b4a; }
          thead th { padding: 4px 6px; text-align: center; font-size: 12px; border: 1px solid #2f4f4f; font-weight: 800; }
          tbody tr:nth-child(even) { background: #fff; }
          tbody tr:nth-child(odd) { background: #fff; }
          tbody tr.lider { background: #fff; }
          tbody td { padding: 6px 7px; text-align: center; border: 1px dotted #7f8c8d; font-size: ${esTablaResultados ? "14px" : "12px"}; color: #254b4a; }
          tbody td.piloto { text-align: center; font-weight: 600; text-transform: uppercase; font-size: ${esTablaResultados ? "14px" : "12px"}; }
          tbody td.vacia { color: transparent; }
          .mejor { font-weight: bold; color: #007a30; }
          .vuelta-ganadora { font-weight: bold; }
          .diff-lider { color: #595959; font-size: 10px; }
          .leyenda { background: #fff; padding: 10px 14px; font-size: 14px; color: #254b4a; border-top: 2px solid #2f4f4f; display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; font-weight: 700; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 800);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 13, color: "#0f172a", width: "100%" }}>
      <div style={{ display: "flex", gap: 10, margin: "16px 0 8px", flexWrap: "wrap" }}>
        <button type="button" onClick={exportarPDF} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
          Exportar PDF
        </button>
        <button type="button" onClick={exportarExcel} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
          Exportar Excel
        </button>
        <button type="button" onClick={exportarCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
          Exportar CSV
        </button>
        <span style={{ fontSize: 11, color: "#94a3b8", alignSelf: "center", marginLeft: 4 }}>
          {normalizadas.length} piloto{normalizadas.length !== 1 ? "s" : ""} en clasificación
        </span>
      </div>

      <div ref={tablaRef} style={{ border: "1px solid #bfbfbf", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#fff", color: "#1f2937", padding: "8px 12px", display: "grid", gridTemplateColumns: "72px 1fr 140px", alignItems: "center", borderBottom: "2px solid #2f4f4f" }}>
          <div className="image-slot">
            <Image src={logoIzquierdaUrl || "/MWT - COLORS.png"} alt="Logo izquierdo" width={56} height={44} style={{ width: "auto", height: "auto" }} unoptimized />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#254b4a" }}>{campeonato}</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: "#254b4a", opacity: 0.95 }}>
              {`${tipoTabla === "final" ? "GRAN FINAL" : tipoTabla === "resultado" ? "Resultados" : "Clasificación"}${categoria ? ` - ${categoria}` : ""}`}
            </div>
          </div>
          <div className="image-slot" style={{ justifySelf: "end" }}>
            <Image src={logoDerechaUrl || getEventLogo(campeonato, circuito, categoria)} alt="Logo del evento" width={56} height={44} style={{ width: "auto", height: "auto" }} unoptimized />
          </div>
        </div>

        <div style={{ background: "#fff", padding: "8px 18px", display: "flex", justifyContent: "center", gap: 36, alignItems: "center", fontSize: 13, borderBottom: "2px solid #2f4f4f", color: "#254b4a", fontWeight: 700 }}>
          <span>Clasificación</span>
          <span>Válida: {valida}</span>
          <span>Fecha: {fecha}</span>
        </div>

        <div style={{ background: "#fff", padding: "8px 18px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, borderBottom: "2px solid #2f4f4f", color: "#254b4a" }}>
          <span>Categoría: {categoria}</span>
          {hora ? <span>Hora: {hora}</span> : <span />}
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 660 }}>
          <thead>
            <tr>
              <th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 68 }}>{tipoTabla === "final" ? "POS" : tipoTabla === "resultado" ? "POSICIÓN" : "Pos"}</th>
              <th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 46 }}>#</th>
              <th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f" }}>Piloto</th>
              <th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 110 }}>Clase</th>
              {tipoTabla === "final" ? <><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 70 }}>H1</th><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 70 }}>H2</th><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 80 }}>TOTAL</th></> : tipoTabla === "resultado" ? <><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 70 }}>PUNTOS</th><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 90 }}>SANCIÓN</th></> : <><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 106 }}>Vuelta 1</th><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 106 }}>Vuelta 2</th><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 120 }}>Mejor Tiempo</th><th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 120 }}>Diferencia</th>{mostrarPuntos ? <th style={{ background: "#fff", color: "#254b4a", padding: "4px 6px", textAlign: "center", fontSize: 12, border: "1px solid #2f4f4f", width: 70 }}>Puntos</th> : null}</>}
            </tr>
          </thead>
          <tbody>
            {filasRender.length === 0 ? (
              <tr>
                <td colSpan={tipoTabla === "final" ? 7 : tipoTabla === "resultado" ? 6 : mostrarPuntos ? 9 : 8} style={{ padding: 20, textAlign: "center", color: "#94a3b8", border: "1px solid #e2e8f0" }}>
                  No hay resultados registrados.
                </td>
              </tr>
            ) : (
              filasRender.map((fila, index) => {
                const esLider = index === 0;
                return (
                  <tr className={fila.vacia ? "vacia" : ""} key={`${fila.pos}-${fila.dorsal}-${index}`} style={{ background: esLider ? "#fffde7" : index % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{fila.pos ?? index + 1}</td>
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{displayValue(fila.dorsal)}</td>
                    <td className={fila.vacia ? "vacia" : "piloto"} style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: 600, color: fila.vacia ? "transparent" : "#254b4a" }}>{fila.nombre || ""}</td>
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, color: "#254b4a" }}>{displayValue(fila.clase)}</td>
                    {tipoTabla === "final" ? <><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{fila.puntosHeat1}</td><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{fila.puntosHeat2}</td><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{fila.puntosTotal}</td></> : tipoTabla === "resultado" ? <><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{fila.puntos}</td><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, color: "#254b4a" }}>{displayValue(fila.sancion)}</td></> : <><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: fila.esMejorV1 ? "bold" : "normal", color: "#254b4a" }}>{fila.sinTiempo ? "NSP" : displayValue(fila.vuelta1)}</td><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: fila.esMejorV2 ? "bold" : "normal", color: "#254b4a" }}>{fila.sinTiempo ? "NSP" : displayValue(fila.vuelta2)}</td><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{displayValue(fila.mejorStr)}</td><td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, color: "#595959" }}>{fila.sinTiempo ? "NSP" : diffStr(fila.mejorMs, liderMs)}</td>{mostrarPuntos ? <td style={{ padding: "3px 4px", textAlign: "center", border: "1px dotted #7f8c8d", fontSize: 12, fontWeight: "bold", color: "#254b4a" }}>{fila.puntos}</td> : null}</>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        <div style={{ background: "#fff", padding: "10px 18px", fontSize: 12, color: "#254b4a", borderTop: "2px solid #2f4f4f", borderRadius: "0 0 10px 10px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontWeight: 800 }}>
          <span>♦ NSP = No Se Presentó</span>
          <span>♦ TI = Tiempo Inválido</span>
          <span>♦ DQ = Descalificado</span>
          <span>♦ TNC = Tiempo No Completo</span>
        </div>
      </div>
    </div>
  );
}
