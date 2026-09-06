import fs from "node:fs";
import express from "express";
import { config } from "./config.js";
import { ApiError, fail } from "./envelope.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";
import { isAzure, serveLocalFile } from "./storage.js";

/** Build the Express app (routes + middleware); does not listen. */
export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  // CORS: the public website lives on a different origin.
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, x-ms-blob-type",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // One-line request log.
  app.use((req, res, next) => {
    res.on("finish", () => {
      console.log(
        `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode}`,
      );
    });
    next();
  });

  app.use("/api/v1", publicRouter);
  app.use("/api/v1/admin", adminRouter);

  // Dev mode: serve locally stored blobs as public downloads.
  if (!isAzure()) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    app.get("/api/v1/files/*", serveLocalFile);
  }

  // Unknown route -> 404 envelope.
  app.use((req, res) => fail(res, 404, "route not found"));

  // Central error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ApiError) return fail(res, err.status, err.message);
    if (err.type === "entity.parse.failed") {
      return fail(res, 400, "invalid JSON body");
    }
    console.error(err);
    const message = config.isProd ? "internal server error" : err.message;
    fail(res, 500, message);
  });

  return app;
}
