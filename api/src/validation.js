import { ApiError } from "./envelope.js";

export const FLAVORS = new Set(["meowarch", "meowarchmobile"]);
export const FILE_TYPES = new Set(["iso", "torrent", "bootImg"]);
export const DEVICE_STATUSES = new Set(["official", "community"]);

const EXT_BY_TYPE = {
  iso: ".iso",
  torrent: ".torrent",
  bootImg: ".img",
};

const CODENAME_RE = /^[a-zA-Z0-9_-]+$/;
const FILENAME_RE = /^[a-zA-Z0-9._-]+$/;
const SHA256_RE = /^[0-9a-fA-F]{64}$/;

export function requireString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `missing or invalid required parameter: ${name}`);
  }
  return value.trim();
}

export function requireFlavor(value) {
  const flavor = requireString(value, "flavor");
  if (!FLAVORS.has(flavor)) {
    throw new ApiError(
      400,
      `flavor must be one of: ${[...FLAVORS].join(", ")}`,
    );
  }
  return flavor;
}

/** flavor is optional on GET /devices and defaults to meowarchmobile. */
export function optionalFlavor(value) {
  if (value === undefined || value === null || value === "") {
    return "meowarchmobile";
  }
  return requireFlavor(value);
}

/**
 * codename is conditionally required: only for flavor === "meowarchmobile".
 * Returns null for the desktop flavor.
 */
export function requireCodename(value, flavor) {
  if (flavor !== "meowarchmobile") return null;
  return requireCodenameValue(value);
}

/** codename required regardless of flavor (device records, deletes). */
export function requireCodenameValue(value) {
  const codename = requireString(value, "codename");
  if (!CODENAME_RE.test(codename)) {
    throw new ApiError(
      400,
      "codename may only contain letters, digits, _ and -",
    );
  }
  return codename;
}

export function requireFileType(value) {
  const fileType = requireString(value, "fileType");
  if (!FILE_TYPES.has(fileType)) {
    throw new ApiError(
      400,
      `fileType must be one of: ${[...FILE_TYPES].join(", ")}`,
    );
  }
  return fileType;
}

/** Strip any directory components and enforce the extension matching fileType. */
export function cleanFileName(fileName, fileType) {
  const raw = requireString(fileName, "fileName");
  const base = raw.split(/[\\/]/).pop();
  const expectedExt = EXT_BY_TYPE[fileType];
  if (expectedExt && !base.toLowerCase().endsWith(expectedExt)) {
    throw new ApiError(
      400,
      `fileName must end with "${expectedExt}" for fileType "${fileType}"`,
    );
  }
  if (!FILENAME_RE.test(base)) {
    throw new ApiError(
      400,
      "fileName may only contain letters, digits, dot, underscore and dash",
    );
  }
  return base;
}

/** Optional; when present must be a 64-char hex string. */
export function optionalSha256(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !SHA256_RE.test(value)) {
    throw new ApiError(400, "sha256 must be a 64-character hex string");
  }
  return value.toLowerCase();
}

/** Blob path convention: mobile/{codename}/{fileName} or desktop/{fileName}. */
export function blobPathFor(flavor, codename, fileName) {
  return flavor === "meowarchmobile"
    ? `mobile/${codename}/${fileName}`
    : `desktop/${fileName}`;
}

/**
 * Validate + normalize a device record body (POST /api/v1/admin/devices).
 * Returns { flavor, brand, model, codename, soc, status }.
 */
export function validateDeviceBody(body) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "request body must be a JSON object");
  }
  const flavor =
    body.flavor === undefined || body.flavor === null || body.flavor === ""
      ? "meowarchmobile"
      : requireFlavor(body.flavor);
  const brand = requireString(body.brand, "brand");
  const model = requireString(body.model, "model");
  const codename = requireCodenameValue(body.codename);
  const soc =
    body.soc !== undefined && body.soc !== null && String(body.soc).trim() !== ""
      ? requireString(body.soc, "soc")
      : "";
  const status =
    body.status === undefined || body.status === null || body.status === ""
      ? "community"
      : requireString(body.status, "status");
  if (!DEVICE_STATUSES.has(status)) {
    throw new ApiError(400, "status must be one of: official, community");
  }
  return { flavor, brand, model, codename, soc, status };
}
