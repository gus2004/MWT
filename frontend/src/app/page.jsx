import { getProximosEventos } from "@/lib/publicApi";
import LandingClient from "@/components/LandingClient";

export default async function HomePage() {
  const eventos = await getProximosEventos(6);
  return <LandingClient eventos={eventos} />;
}