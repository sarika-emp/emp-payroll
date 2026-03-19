import { initDB, closeDB } from "./adapters";
import { initEmpCloudDB, migrateEmpCloudDB, closeEmpCloudDB } from "./empcloud";
import { logger } from "../utils/logger";

async function run() {
  await initEmpCloudDB();
  const db = await initDB();
  logger.info("Rolling back migrations...");
  await db.rollback();
  logger.info("Running EmpCloud migrations...");
  await migrateEmpCloudDB();
  logger.info("Running payroll migrations...");
  await db.migrate();
  logger.info("Running seeds...");
  await db.seed();
  logger.info("Database reset complete");
  await closeDB();
  await closeEmpCloudDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error("Reset failed:", err);
  process.exit(1);
});
