import { config } from "./src/config.js";
import { createApp } from "./src/app.js";
import { connectDb, closeDb } from "./src/db.js";
import { seedIfEmpty } from "./src/seed.js";
import { ensureStorageReady } from "./src/storage.js";
import { getDevToken, resolveAuthConfig } from "./src/auth.js";

async function main() {
  await connectDb();
  await ensureStorageReady();
  await seedIfEmpty();

  let auth;
  try {
    auth = resolveAuthConfig();
  } catch (err) {
    console.error(`Startup aborted: ${err.message}`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(
      `MeowArch API listening on http://127.0.0.1:${config.port} (${config.env})`,
    );
    console.log(
      `DB: ${config.mongodbUri ? "MongoDB" : "in-memory"} | Storage: ${config.azure.connectionString ? "Azure Blob" : "local disk"}`,
    );
    if (auth.mode === "static" && !config.adminSecretKey) {
      console.log(`Dev admin token (use as Bearer): ${getDevToken()}`);
    }
    if (auth.mode === "jwt") {
      console.log("JWT auth enabled (JWT_SECRET)");
    }
  });

  const shutdown = async () => {
    server.close();
    await closeDb();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
