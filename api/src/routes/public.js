import { Router } from "express";
import { ApiError, ok, wrap } from "../envelope.js";
import {
  optionalFlavor,
  requireCodename,
  requireFlavor,
} from "../validation.js";
import { getLatestRelease, listDevices } from "../db.js";

export const publicRouter = Router();

/** GET /api/v1/devices — supported device list (mobile by default). */
publicRouter.get(
  "/devices",
  wrap(async (req, res) => {
    const flavor = optionalFlavor(req.query.flavor);
    const devices = await listDevices(flavor);
    ok(
      res,
      devices.map(({ brand, model, codename, soc, status }) => ({
        brand,
        model,
        codename,
        soc,
        status,
      })),
    );
  }),
);

/** GET /api/v1/releases/latest — latest release + download info. */
publicRouter.get(
  "/releases/latest",
  wrap(async (req, res) => {
    const flavor = requireFlavor(req.query.flavor);
    const codename = requireCodename(req.query.codename, flavor);
    const release = await getLatestRelease(flavor, codename);
    if (!release) {
      const scope =
        flavor === "meowarchmobile" ? ` / codename "${codename}"` : "";
      throw new ApiError(
        404,
        `no latest release found for flavor "${flavor}"${scope}`,
      );
    }
    const { _id, createdAt, updatedAt, ...data } = release;
    ok(res, data);
  }),
);
