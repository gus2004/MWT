// Seed removed: do not create demo/example data. Keep file for future seeding needs.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed script no-op: demo/example data has been removed.");
}

main()
  .catch((e) => {
    console.error("Error running seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });