import { MongoClient } from "mongodb";
import { config } from "./config.js";

/**
 * Data layer over MongoDB (production) or an in-memory store (dev mode).
 * Routes and the seed script talk to a small uniform async API.
 */

let mongoClient = null;
let mongoDb = null;

/* ---- in-memory fallback ---- */

const mem = { devices: new Map(), releases: new Map() };
let memSeq = 0;

function getPath(doc, dottedPath) {
  return dottedPath
    .split(".")
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), doc);
}

function matches(doc, query) {
  return Object.entries(query).every(
    ([key, value]) => getPath(doc, key) === value,
  );
}

function memCollection(name) {
  const map = mem[name];
  return {
    async findOne(query) {
      for (const doc of map.values()) {
        if (matches(doc, query)) return doc;
      }
      return null;
    },
    async findSorted(query, sortKey) {
      return [...map.values()]
        .filter((doc) => matches(doc, query))
        .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])));
    },
    async count() {
      return map.size;
    },
    async insertOne(doc) {
      doc._id = ++memSeq;
      map.set(doc._id, doc);
      return doc;
    },
    async updateOne(query, { $set }) {
      const doc = [...map.values()].find((d) => matches(d, query));
      if (!doc) return { matchedCount: 0 };
      Object.assign(doc, $set);
      return { matchedCount: 1 };
    },
    async updateMany(query, { $set }) {
      let count = 0;
      for (const doc of map.values()) {
        if (matches(doc, query)) {
          Object.assign(doc, $set);
          count += 1;
        }
      }
      return { modifiedCount: count };
    },
    async deleteOne(query) {
      const entry = [...map.entries()].find(([, doc]) => matches(doc, query));
      if (!entry) return { deletedCount: 0 };
      map.delete(entry[0]);
      return { deletedCount: 1 };
    },
    async clear() {
      map.clear();
    },
  };
}

/* ---- collection adapter ---- */

function getCollection(name) {
  if (isMongo()) {
    const col = mongoDb.collection(name);
    return {
      findOne: (query) => col.findOne(query),
      findSorted: (query, sortKey) =>
        col
          .find(query)
          .sort({ [sortKey]: 1 })
          .toArray(),
      count: () => col.countDocuments(),
      insertOne: async (doc) => {
        await col.insertOne(doc);
        return doc;
      },
      updateOne: (query, update) => col.updateOne(query, update),
      updateMany: (query, update) => col.updateMany(query, update),
      deleteOne: (query) => col.deleteOne(query),
      clear: () => col.deleteMany({}),
    };
  }
  return memCollection(name);
}

/* ---- connection ---- */

export function isMongo() {
  return Boolean(config.mongodbUri);
}

export async function connectDb() {
  if (!config.mongodbUri) return;
  mongoClient = new MongoClient(config.mongodbUri);
  await mongoClient.connect();
  mongoDb = mongoClient.db();
  await mongoDb
    .collection("devices")
    .createIndex({ flavor: 1, codename: 1 }, { unique: true });
  await mongoDb
    .collection("releases")
    .createIndex(
      { flavor: 1, "device.codename": 1, version: 1 },
      { unique: true },
    );
}

export async function closeDb() {
  if (mongoClient) await mongoClient.close();
}

/* ---- devices ---- */

export async function listDevices(flavor) {
  return getCollection("devices").findSorted({ flavor }, "codename");
}

export async function countDevices() {
  return getCollection("devices").count();
}

export async function upsertDevice(device) {
  const col = getCollection("devices");
  const filter = { flavor: device.flavor, codename: device.codename };
  const existing = await col.findOne(filter);
  if (existing) {
    await col.updateOne(filter, {
      $set: { ...device, updatedAt: new Date() },
    });
    return col.findOne(filter);
  }
  return col.insertOne({
    ...device,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function deleteDevice(flavor, codename) {
  return getCollection("devices").deleteOne({ flavor, codename });
}

/* ---- releases ---- */

export async function getLatestRelease(flavor, codename) {
  const query = { flavor, isLatest: true };
  if (flavor === "meowarchmobile") query["device.codename"] = codename;
  return getCollection("releases").findOne(query);
}

export async function countReleases() {
  return getCollection("releases").count();
}

/**
 * Persist a release (upsert by flavor + version [+ codename]).
 * When isLatest is true, first clear the flag on every other release of the
 * same flavor (+ codename), then store the current version.
 */
export async function saveRelease(doc) {
  const col = getCollection("releases");
  const now = new Date();
  const codename = doc.device?.codename || null;

  const record = {
    flavor: doc.flavor,
    version: doc.version,
    channel: doc.channel || "stable",
    releaseDate: doc.releaseDate || null,
    isLatest: Boolean(doc.isLatest),
    device: doc.device || null,
    artifacts: doc.artifacts || {},
    notes: doc.notes || {},
    createdAt: now,
    updatedAt: now,
  };

  if (record.isLatest) {
    const query = { flavor: record.flavor, isLatest: true };
    if (codename) query["device.codename"] = codename;
    await col.updateMany(query, {
      $set: { isLatest: false, updatedAt: now },
    });
  }

  const filter = { flavor: record.flavor, version: record.version };
  if (codename) filter["device.codename"] = codename;

  const existing = await col.findOne(filter);
  if (existing) {
    await col.updateOne(filter, {
      $set: { ...record, createdAt: existing.createdAt, updatedAt: now },
    });
    return col.findOne(filter);
  }
  return col.insertOne(record);
}

/* ---- seeding ---- */

export async function clearAll() {
  await getCollection("devices").clear();
  await getCollection("releases").clear();
}
