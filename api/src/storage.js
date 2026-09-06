import fs from "node:fs";
import path from "node:path";
import {
  BlobServiceClient,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { config } from "./config.js";

/**
 * Storage abstraction over Azure Blob (production) or the local disk
 * (dev mode, api/.data/blob/). The API only ever streams bytes to the
 * storage backend — large ISO payloads never buffer in process memory.
 */

export function isAzure() {
  return Boolean(config.azure.connectionString);
}

function parseConnectionString(cs) {
  const kv = {};
  for (const part of cs.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    kv[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return kv;
}

function containerClient() {
  return BlobServiceClient.fromConnectionString(
    config.azure.connectionString,
  ).getContainerClient(config.azure.containerName);
}

/** Ensure the target container / local directory exists. */
export async function ensureStorageReady() {
  if (isAzure()) {
    await containerClient().createIfNotExists({ access: "blob" });
  } else {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

/** Public, unauthenticated download URL for a blob. */
export function getPublicUrl(blobPath) {
  if (isAzure()) {
    const accountName = parseConnectionString(
      config.azure.connectionString,
    ).AccountName;
    const base =
      config.azure.publicBaseUrl ||
      `https://${accountName}.blob.core.windows.net`;
    return `${base}/${config.azure.containerName}/${blobPath}`;
  }
  return `${config.publicBaseUrl}/api/v1/files/${blobPath}`;
}

/**
 * Short-lived Azure SAS URL granting the caller direct PUT access
 * (create + write) to the blob, so big files never traverse this server.
 */
export function createSasUrl(blobPath) {
  if (!isAzure()) {
    throw new Error("createSasUrl requires Azure storage configuration");
  }
  const kv = parseConnectionString(config.azure.connectionString);
  if (!kv.AccountName || !kv.AccountKey) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING must contain AccountName and AccountKey",
    );
  }
  const credential = new StorageSharedKeyCredential(
    kv.AccountName,
    kv.AccountKey,
  );
  const blob = containerClient().getBlockBlobClient(blobPath);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: config.azure.containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse("cw"),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + config.ticketTtlSeconds * 1000),
    },
    credential,
  ).toString();
  return `${blob.url}?${sas}`;
}

/**
 * Fallback path (方案 B): stream a request body straight into storage.
 * @param {string} blobPath
 * @param {NodeJS.ReadableStream} readStream
 * @param {string} contentType
 * @returns {Promise<string>} public URL of the uploaded blob
 */
export async function streamUpload(blobPath, readStream, contentType) {
  if (isAzure()) {
    const blockBlob = containerClient().getBlockBlobClient(blobPath);
    await blockBlob.uploadStream(readStream, 4 * 1024 * 1024, 8, {
      blobHTTPHeaders: {
        blobContentType: contentType || "application/octet-stream",
      },
    });
  } else {
    const dest = path.join(config.dataDir, blobPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(dest);
      readStream.on("error", reject);
      out.on("error", reject);
      out.on("finish", resolve);
      readStream.pipe(out);
    });
  }
  return getPublicUrl(blobPath);
}

/** Serve locally stored blobs (dev mode) at GET /api/v1/files/*. */
export function serveLocalFile(req, res, next) {
  if (isAzure()) return next();
  const blobPath = decodeURIComponent(req.params[0] || "");
  const root = path.resolve(config.dataDir);
  const filePath = path.resolve(path.join(root, blobPath));
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return next(); // path traversal guard
  }
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
}
