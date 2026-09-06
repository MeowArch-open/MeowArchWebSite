import {
  clearAll,
  connectDb,
  closeDb,
  countDevices,
  countReleases,
  saveRelease,
  upsertDevice,
} from "./db.js";

/** Devices mirror the API spec examples. */
const DEVICES = [
  {
    flavor: "meowarchmobile",
    brand: "Xiaomi",
    model: "Redmi K80",
    codename: "munch",
    soc: "Snapdragon 8 Gen 3",
    status: "official",
  },
  {
    flavor: "meowarchmobile",
    brand: "OnePlus",
    model: "OnePlus 9RT",
    codename: "martini",
    soc: "Snapdragon 888",
    status: "community",
  },
];

/** One sample release per the API spec response example (placeholder data). */
const SAMPLE_RELEASES = [
  {
    flavor: "meowarchmobile",
    version: "v1.0.0",
    channel: "stable",
    releaseDate: "August 2026",
    isLatest: true,
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
        fileName: "meowarch-mobile-1.0.0-munch.iso",
        url: "https://studentstbqv7bjmrygxia.blob.core.windows.net/release/mobile/munch/meowarch-mobile-1.0.0-munch.iso",
        fileSize: "~850 MB",
        sha256:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      torrent: {
        fileName: "meowarch-mobile-1.0.0-munch.iso.torrent",
        url: "https://studentstbqv7bjmrygxia.blob.core.windows.net/release/mobile/munch/meowarch-mobile-1.0.0-munch.iso.torrent",
      },
      bootImg: {
        fileName: "boot-munch.img",
        url: "https://studentstbqv7bjmrygxia.blob.core.windows.net/release/mobile/munch/boot-munch.img",
        sha256:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
    },
    notes: {
      androidBase: "HyperOS 2",
      kernelVersion: "Linux 6.6.x",
    },
  },
];

/** Seed only when collections are empty (idempotent on boot). */
export async function seedIfEmpty() {
  if ((await countDevices()) === 0) {
    for (const device of DEVICES) await upsertDevice(device);
  }
  if ((await countReleases()) === 0) {
    for (const release of SAMPLE_RELEASES) await saveRelease(release);
  }
}

/* Standalone: node src/seed.js [--force] */
const isMain =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());

if (isMain) {
  const force = process.argv.includes("--force");
  await connectDb();
  try {
    if (force) await clearAll();
    await seedIfEmpty();
    console.log(
      `Seeded devices=${await countDevices()} releases=${await countReleases()}`,
    );
  } finally {
    await closeDb();
  }
}
