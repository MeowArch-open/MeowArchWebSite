import { after, before, test } from "node:test";
import assert from "node:assert/strict";

/**
 * Smoke tests for the MeowArch Release API.
 * Runs in dev mode: in-memory DB + local-disk blob storage, no cloud needed.
 */
let app, dbModule, seedModule, authModule, server, base, token;

before(async () => {
  // Force dev mode before any config module is evaluated.
  process.env.MONGODB_URI = "";
  process.env.AZURE_STORAGE_CONNECTION_STRING = "";
  process.env.NODE_ENV = "test";

  const appModule = await import("../src/app.js");
  dbModule = await import("../src/db.js");
  seedModule = await import("../src/seed.js");
  authModule = await import("../src/auth.js");

  app = appModule.createApp();
  await dbModule.connectDb();
  await seedModule.seedIfEmpty();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  process.env.PUBLIC_BASE_URL = base; // local-mode publicUrl must point at this server

  authModule.resolveAuthConfig();
  token = authModule.getDevToken();
});

after(async () => {
  server?.close();
  await dbModule.closeDb();
});

const api = (path, opts = {}) => fetch(`${base}/api/v1${path}`, opts);
const bearer = (extra = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

/* ---- envelope + public endpoints ---- */

test("404 envelope shape for unknown routes", async () => {
  const res = await api("/nope");
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ["code", "data", "message"]);
  assert.equal(body.code, 404);
  assert.equal(body.data, null);
});

test("GET /devices defaults to meowarchmobile and returns seed devices", async () => {
  const res = await api("/devices");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.code, 0);
  assert.equal(body.message, "success");
  const codenames = body.data.map((d) => d.codename);
  assert.ok(codenames.includes("munch"));
  assert.ok(codenames.includes("martini"));
  for (const d of body.data) {
    assert.deepEqual(Object.keys(d).sort(), [
      "brand",
      "codename",
      "model",
      "soc",
      "status",
    ]);
  }
});

test("GET /devices?flavor=meowarch returns an empty list", async () => {
  const res = await api("/devices?flavor=meowarch");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.data, []);
});

test("GET /releases/latest returns the seeded latest release", async () => {
  const res = await api(
    "/releases/latest?flavor=meowarchmobile&codename=munch",
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.flavor, "meowarchmobile");
  assert.equal(body.data.version, "v1.0.0");
  assert.equal(body.data.device.codename, "munch");
  assert.equal(
    body.data.artifacts.iso.fileName,
    "meowarch-mobile-1.0.0-munch.iso",
  );
  assert.equal(body.data.isLatest, true);
});

test("GET /releases/latest rejects missing flavor (400)", async () => {
  const res = await api("/releases/latest");
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, 400);
});

test("GET /releases/latest rejects mobile without codename (400)", async () => {
  const res = await api("/releases/latest?flavor=meowarchmobile");
  assert.equal(res.status, 400);
});

test("GET /releases/latest returns 404 for unknown codename", async () => {
  const res = await api(
    "/releases/latest?flavor=meowarchmobile&codename=ghost",
  );
  assert.equal(res.status, 404);
});

test("GET /releases/latest rejects unknown flavor (400)", async () => {
  const res = await api("/releases/latest?flavor=ubuntu");
  assert.equal(res.status, 400);
});

/* ---- auth ---- */

test("admin endpoint without token -> 401", async () => {
  const res = await api("/admin/upload-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 401);
});

test("admin endpoint with wrong token -> 401", async () => {
  const res = await api("/admin/upload-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer wrong",
    },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 401);
});

/* ---- upload ticket + streaming upload (local mode) ---- */

test("upload-ticket returns blobPath / publicUrl / uploadUrl", async () => {
  const res = await api("/admin/upload-ticket", {
    method: "POST",
    headers: bearer({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      flavor: "meowarchmobile",
      codename: "munch",
      fileName: "meowarch-mobile-1.0.0-munch.iso",
      fileType: "iso",
    }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(
    body.data.blobPath,
    "mobile/munch/meowarch-mobile-1.0.0-munch.iso",
  );
  assert.ok(body.data.uploadUrl.includes("/api/v1/admin/uploads"));
  assert.equal(body.data.expiresInSeconds, 3600);
});

test("upload-ticket rejects extension/type mismatch (400)", async () => {
  const res = await api("/admin/upload-ticket", {
    method: "POST",
    headers: bearer({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      flavor: "meowarchmobile",
      codename: "munch",
      fileName: "evil.txt",
      fileType: "iso",
    }),
  });
  assert.equal(res.status, 400);
});

test("uploads streams bytes to storage and is publicly readable", async () => {
  const content = "fake-iso-content-12345";
  const fileName = "meowarch-mobile-1.0.0-munch-upload-test.iso";
  const res = await api(
    `/admin/uploads?flavor=meowarchmobile&codename=munch&fileType=iso&fileName=${encodeURIComponent(fileName)}`,
    {
      method: "PUT",
      headers: bearer({ "Content-Type": "application/octet-stream" }),
      body: content,
    },
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.data.blobPath, `mobile/munch/${fileName}`);

  const dl = await fetch(body.data.publicUrl);
  assert.equal(dl.status, 200);
  assert.equal(await dl.text(), content);
});

/* ---- release metadata + isLatest refresh ---- */

test("submit release, then latest flips correctly", async () => {
  const post = async (version, isLatest) =>
    api("/admin/releases", {
      method: "POST",
      headers: bearer({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        flavor: "meowarchmobile",
        version,
        channel: "stable",
        releaseDate: "September 2026",
        isLatest,
        device: {
          brand: "Xiaomi",
          model: "Redmi K80",
          codename: "munch",
          soc: "Snapdragon 8 Gen 3",
          arch: "aarch64",
          status: "official",
        },
        artifacts: {
          iso: {
            fileName: `meowarch-mobile-${version}-munch.iso`,
            url: `https://blob.local/release/mobile/munch/meowarch-mobile-${version}-munch.iso`,
            fileSize: "854 MB",
            sha256:
              "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          },
        },
        notes: { androidBase: "HyperOS 2", kernelVersion: "Linux 6.6.x" },
      }),
    });

  const v2 = await post("v2.0.0", true);
  assert.equal(v2.status, 201);
  const v2body = await v2.json();
  assert.equal(v2body.data.isLatest, true);

  // v2 is now latest; the seeded v1.0.0 must have been un-flagged.
  const latest = await api(
    "/releases/latest?flavor=meowarchmobile&codename=munch",
  );
  const latestBody = await latest.json();
  assert.equal(latestBody.data.version, "v2.0.0");

  // A non-latest v3 must not steal the flag.
  await post("v3.0.0", false);
  const latest2 = await api(
    "/releases/latest?flavor=meowarchmobile&codename=munch",
  );
  const latest2Body = await latest2.json();
  assert.equal(latest2Body.data.version, "v2.0.0");
});

test("submit release rejects invalid sha256 (400)", async () => {
  const res = await api("/admin/releases", {
    method: "POST",
    headers: bearer({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      flavor: "meowarchmobile",
      version: "v9.9.9",
      device: { codename: "munch" },
      artifacts: {
        iso: {
          fileName: "x.iso",
          url: "https://blob.local/x.iso",
          sha256: "not-a-hash",
        },
      },
    }),
  });
  assert.equal(res.status, 400);
});

/* ---- device CRUD ---- */

test("POST /admin/devices creates a device (201) and lists it publicly", async () => {
  const res = await api("/admin/devices", {
    method: "POST",
    headers: bearer({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      brand: "Google",
      model: "Pixel 9",
      codename: "tokay",
      soc: "Tensor G4",
      status: "official",
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.code, 0);
  assert.equal(body.data.flavor, "meowarchmobile");
  assert.equal(body.data.codename, "tokay");
  assert.equal(body.data.status, "official");

  const list = await api("/devices?flavor=meowarchmobile");
  const listBody = await list.json();
  assert.ok(listBody.data.some((d) => d.codename === "tokay"));
});

test("POST /admin/devices upserts an existing codename without duplicating", async () => {
  const res = await api("/admin/devices", {
    method: "POST",
    headers: bearer({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      brand: "Google",
      model: "Pixel 9 Pro",
      codename: "tokay",
      status: "community",
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.data.model, "Pixel 9 Pro");
  assert.equal(body.data.status, "community");

  const list = await api("/devices?flavor=meowarchmobile");
  const listBody = await list.json();
  const found = listBody.data.filter((d) => d.codename === "tokay");
  assert.equal(found.length, 1);
  assert.equal(found[0].model, "Pixel 9 Pro");
});

test("POST /admin/devices rejects invalid payloads (400)", async () => {
  const cases = [
    {},
    { brand: "X", model: "Y" },
    { brand: "X", model: "Y", codename: "bad name!" },
    { brand: "X", model: "Y", codename: "ok", status: "premium" },
  ];
  for (const body of cases) {
    const res = await api("/admin/devices", {
      method: "POST",
      headers: bearer({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400, JSON.stringify(body));
  }
});

test("DELETE /admin/devices removes a device; missing device -> 404", async () => {
  const del = await api(
    "/admin/devices?flavor=meowarchmobile&codename=tokay",
    { method: "DELETE", headers: bearer() },
  );
  assert.equal(del.status, 200);
  const body = await del.json();
  assert.equal(body.data.deleted, 1);

  const list = await api("/devices?flavor=meowarchmobile");
  const listBody = await list.json();
  assert.ok(!listBody.data.some((d) => d.codename === "tokay"));

  const again = await api(
    "/admin/devices?flavor=meowarchmobile&codename=tokay",
    { method: "DELETE", headers: bearer() },
  );
  assert.equal(again.status, 404);
});

test("DELETE /admin/devices without codename -> 400", async () => {
  const res = await api("/admin/devices?flavor=meowarchmobile", {
    method: "DELETE",
    headers: bearer(),
  });
  assert.equal(res.status, 400);
});

test("CORS preflight allows DELETE and Authorization header", async () => {
  const res = await fetch(`${base}/api/v1/admin/devices`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://127.0.0.1:4173",
      "Access-Control-Request-Method": "DELETE",
      "Access-Control-Request-Headers": "authorization, content-type",
    },
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const methods = res.headers.get("access-control-allow-methods") || "";
  assert.ok(methods.includes("DELETE"), `methods: ${methods}`);
  const allowedHeaders = res.headers.get("access-control-allow-headers") || "";
  assert.ok(
    allowedHeaders.toLowerCase().includes("authorization"),
    `headers: ${allowedHeaders}`,
  );
});
