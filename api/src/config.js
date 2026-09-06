import { fileURLToPath } from "node:url";

const env = process.env.NODE_ENV || "development";

export const config = {
  port: Number(process.env.PORT || 3000),
  env,
  isProd: env === "production",
  adminSecretKey: process.env.ADMIN_SECRET_KEY || null,
  jwtSecret: process.env.JWT_SECRET || null,
  mongodbUri: process.env.MONGODB_URI || null,
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || null,
    containerName: process.env.AZURE_CONTAINER_NAME || "release",
    publicBaseUrl: process.env.AZURE_PUBLIC_BASE_URL || null,
  },
  // Read lazily so tests can point it at an ephemeral port.
  get publicBaseUrl() {
    return (
      process.env.PUBLIC_BASE_URL ||
      `http://127.0.0.1:${Number(process.env.PORT || 3000)}`
    );
  },
  ticketTtlSeconds: Number(process.env.UPLOAD_TICKET_TTL_SECONDS || 3600),
  dataDir: fileURLToPath(new URL("../.data/blob/", import.meta.url)),
};
