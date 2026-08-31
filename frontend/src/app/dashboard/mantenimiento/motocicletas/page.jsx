'use client';
import EntityVisual from "../EntityVisual";
import { MAINTENANCE_ENTITIES } from "../maintenance.config";

export default function Page() {
  return <EntityVisual config={MAINTENANCE_ENTITIES.motocicletas} />;
}
