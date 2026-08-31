import PublicoClient from "@/components/PublicoClient";

export const metadata = {
  title: "Estadísticas Públicas · MWT Motorsport",
  description:
    "Consulta pública del campeonato: clasificación general, resultados por evento y pilotos registrados. Sin necesidad de cuenta.",
};

export default function PublicoPage() {
  return <PublicoClient />;
}
