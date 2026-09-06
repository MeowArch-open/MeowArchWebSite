import express, { Router } from "express";
import { config } from "../config.js";
import { authMiddleware } from "../auth.js";
import { ApiError, ok, wrap } from "../envelope.js";
import {
  createSasUrl,
  getPublicUrl,
  isAzure,
  streamUpload,
} from "../storage.js";
import { deleteDevice, saveRelease, upsertDevice } from "../db.js";
import {
  blobPathFor,
  cleanFileName,
  optionalFlavor,
  optionalSha256,
  requireCodename,
  requireCodenameValue,
  requireFileType,
  requireFlavor,
  requireString,
  validateDeviceBody,
} from "../validation.js";

export const adminRouter = Router();
adminRouter.use(authMiddleware);

/**
 * POST /api/v1/admin/upload-ticket
 * Azure mode: returns a short-lived SAS URL for direct PUT to Blob.
 * Local mode: returns an uploadUrl pointing at the streaming endpoint below.
 */
adminRouter.post(
  "/upload-ticket",
  express.json(),
  wrap(async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "request body must be a JSON object");
    }
    const flavor = requireFlavor(body.flavor);
    const codename = requireCodename(body.codename, flavor);
    const fileType = requireFileType(body.fileType);
    const fileName = cleanFileName(body.fileName, fileType);
    const blobPath = blobPathFor(flavor, codename, fileName);

    const uploadUrl = isAzure()
      ? createSasUrl(blobPath)
      : buildLocalUploadUrl(flavor, codename, fileType, fileName);

    ok(res, {
      blobPath,
      publicUrl: getPublicUrl(blobPath),
      uploadUrl,
      expiresInSeconds: config.ticketTtlSeconds,
    });
  }),
);

/**
 * POST/PUT /api/v1/admin/uploads — fallback path (方案 B): stream the raw
 * request body straight into storage without buffering it in memory.
 * Query params carry the destination metadata.
 */
adminRouter.put(
  "/uploads",
  wrap(async (req, res) => {
    const flavor = requireFlavor(req.query.flavor);
    const codename = requireCodename(req.query.codename, flavor);
    const fileType = requireFileType(req.query.fileType);
    const fileName = cleanFileName(req.query.fileName, fileType);
    const blobPath = blobPathFor(flavor, codename, fileName);
    const contentType =
      req.headers["content-type"] || "application/octet-stream";

    const publicUrl = await streamUpload(blobPath, req, contentType);
    ok(res, { blobPath, publicUrl }, 201);
  }),
);

/**
 * POST /api/v1/admin/releases — persist release metadata (MongoDB / memory)
 * and refresh isLatest for the same flavor (+ codename).
 */
adminRouter.post(
  "/releases",
  express.json(),
  wrap(async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "request body must be a JSON object");
    }
    const flavor = requireFlavor(body.flavor);
    const version = requireString(body.version, "version");
    const codename = requireCodename(body.device?.codename, flavor);
    if (flavor === "meowarchmobile" && !codename) {
      throw new ApiError(
        400,
        "device.codename is required for flavor meowarchmobile",
      );
    }

    // Normalize the optional sha256 values (if provided, must be 64 hex).
    const artifacts = body.artifacts || {};
    for (const type of ["iso", "torrent", "bootImg"]) {
      if (artifacts[type]?.sha256 !== undefined) {
        artifacts[type].sha256 = optionalSha256(artifacts[type].sha256);
      }
    }

    const saved = await saveRelease({
      flavor,
      version,
      channel: body.channel || "stable",
      releaseDate: body.releaseDate || null,
      isLatest: body.isLatest === true,
      device: body.device || null,
      artifacts,
      notes: body.notes || {},
    });
    ok(res, saved, 201);
  }),
);

function buildLocalUploadUrl(flavor, codename, fileType, fileName) {
  const params = new URLSearchParams({ flavor, fileType, fileName });
  if (codename) params.set("codename", codename);
  return `${config.publicBaseUrl}/api/v1/admin/uploads?${params.toString()}`;
}

/**
 * POST /api/v1/admin/devices — create or update a device entry
 * (upsert by flavor + codename).
 */
adminRouter.post(
  "/devices",
  express.json(),
  wrap(async (req, res) => {
    const device = validateDeviceBody(req.body);
    const saved = await upsertDevice(device);
    ok(res, saved, 201);
  }),
);

/**
 * DELETE /api/v1/admin/devices?flavor=&codename= — remove a device entry.
 * Its release records are kept (they stay queryable, just not listed).
 */
adminRouter.delete(
  "/devices",
  wrap(async (req, res) => {
    const flavor = optionalFlavor(req.query.flavor);
    const codename = requireCodenameValue(req.query.codename);
    const result = await deleteDevice(flavor, codename);
    if (!result.deletedCount) {
      throw new ApiError(
        404,
        `no device found for flavor "${flavor}" and codename "${codename}"`,
      );
    }
    ok(res, { deleted: result.deletedCount });
  }),
);
