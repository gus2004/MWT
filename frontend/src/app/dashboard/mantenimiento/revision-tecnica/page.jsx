'use client';
import styles from "./revision-tecnica.module.css";

const inspections = [
  { numero: "#21", piloto: "Alex LÃ³pez MartÃ­nez", dpi: "3012 44567 0101", inspeccion: "Correcta" },
  { numero: "#07", piloto: "MarÃ­a Fernanda PÃ©rez GÃ³mez", dpi: "2948 11223 0901", inspeccion: "Correcta" },
  { numero: "#14", piloto: "Carlos Alberto Ruiz DÃ­az", dpi: "3156 77881 1202", inspeccion: "Pendiente" },
  { numero: "#33", piloto: "JosÃ© Miguel RamÃ­rez Soto", dpi: "2877 99001 0701", inspeccion: "Correcta" },
];

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Mantenimiento</p>
        <h1 className={styles.title}>InspecciÃ³n tÃ©cnica</h1>
        <p className={styles.subtitle}>
          Vista rÃ¡pida para validar si cada inspecciÃ³n estÃ¡ correcta o pendiente, sin entrar en detalle.
        </p>
      </header>

      <section className={styles.panel}>
        <div className={styles.summaryBar}>
          <div>
            <span className={styles.summaryLabel}>Registros visibles</span>
            <strong className={styles.summaryValue}>{inspections.length}</strong>
          </div>
          <div>
            <span className={styles.summaryLabel}>Inspecciones correctas</span>
            <strong className={styles.summaryValue}>3</strong>
          </div>
          <div>
            <span className={styles.summaryLabel}>Pendientes</span>
            <strong className={styles.summaryValue}>1</strong>
          </div>
        </div>

        <div className={styles.searchBox}>
          <div>
            <p className={styles.searchLabel}>Buscador rÃ¡pido</p>
            <h2 className={styles.searchTitle}>Filtra pilotos o DPI</h2>
          </div>
          <input className={styles.searchInput} type="search" placeholder="Buscar nÃºmero, piloto o DPI..." />
        </div>

        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <span>NÃºmero piloto</span>
            <span>Nombre completo</span>
            <span>DPI</span>
            <span>ValidaciÃ³n</span>
          </div>

          <div className={styles.tableBody}>
            {inspections.map((inspection) => (
              <article key={inspection.numero} className={styles.row}>
                <span className={styles.cellNumber}>{inspection.numero}</span>
                <span className={styles.cellName}>{inspection.piloto}</span>
                <span className={styles.cellDpi}>{inspection.dpi}</span>
                <span className={styles.cellStatus} data-state={inspection.inspeccion.toLowerCase()}>
                  <span className={styles.checkBox} aria-hidden="true">
                    {inspection.inspeccion === "Correcta" ? "âœ“" : ""}
                  </span>
                  {inspection.inspeccion}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}