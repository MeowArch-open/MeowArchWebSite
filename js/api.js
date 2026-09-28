/* Shared MeowArch Release API client.
   Envelope contract: { code, message, data } — code 0 means success,
   anything else mirrors the HTTP status. */
window.MEOWARCH_API = (() => {
  "use strict";

  const base = (window.MEOWARCH_API_BASE || "http://127.0.0.1:3000/api/v1").replace(/\/+$/, "");
  const DEFAULT_TIMEOUT_MS = 8000;

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = "ApiError";
      this.status = status ?? 0;
    }
  }

  async function request(path, { method = "GET", body, token, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiError(
          payload.message || window.MEOWARCH_I18N.t("ad.request_failed", { status: res.status }),
          res.status,
        );
      }
      return payload.data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err?.name === "AbortError") {
        throw new ApiError("timeout", 0);
      }
      throw new ApiError(err?.message || "network error", 0);
    } finally {
      clearTimeout(timer);
    }
  }

  const devices = (flavor = "meowarchmobile") =>
    request(`/devices?flavor=${encodeURIComponent(flavor)}`);

  const latestRelease = (flavor, codename) =>
    request(`/releases/latest?flavor=${encodeURIComponent(flavor)}${codename ? `&codename=${encodeURIComponent(codename)}` : ""}`);

  /* --- admin (Bearer) --- */
  const admin = {
    createDevice: (device, token) => request("/admin/devices", { method: "POST", body: device, token }),
    deleteDevice: (flavor, codename, token) =>
      request(`/admin/devices?flavor=${encodeURIComponent(flavor)}&codename=${encodeURIComponent(codename)}`, {
        method: "DELETE",
        token,
      }),
    publishRelease: (release, token) => request("/admin/releases", { method: "POST", body: release, token }),
  };

  return { base, ApiError, request, devices, latestRelease, admin };
})();
