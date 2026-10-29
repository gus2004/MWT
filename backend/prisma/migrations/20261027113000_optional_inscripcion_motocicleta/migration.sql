-- Allow registrations without a motorcycle while preserving existing links.
ALTER TABLE "inscripciones" ALTER COLUMN "motocicleta_id" DROP NOT NULL;
