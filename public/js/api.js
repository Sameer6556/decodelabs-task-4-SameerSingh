/* ===========================================================
   API client — the bridge between the page and the server.
   Wraps fetch() with async/await, checks HTTP status codes,
   parses JSON, and throws useful errors so the UI can degrade
   gracefully instead of failing silently.
   =========================================================== */
(function () {
  "use strict";

  const BASE = window.API_BASE || ""; // same-origin by default
  const ROOT = `${BASE}/api/opportunities`;

  async function request(url, options = {}) {
    let res;
    try {
      res = await fetch(url, options);
    } catch {
      const e = new Error("Network error — couldn't reach the server.");
      e.kind = "network";
      throw e;
    }

    let body = null;
    if (res.status !== 204) {
      try { body = await res.json(); } catch { body = null; }
    }

    if (!res.ok) {
      const e = new Error((body && (body.error || body.message)) || `Request failed (${res.status}).`);
      e.status = res.status;
      e.details = body && body.details;
      throw e;
    }
    return body;
  }

  window.GiveAPI = {
    health() { return request(`${BASE}/api/health`); },

    async list({ cause, search } = {}) {
      const p = new URLSearchParams();
      if (cause && cause !== "all") p.set("cause", cause);
      if (search) p.set("search", search);
      const qs = p.toString();
      const body = await request(`${ROOT}${qs ? "?" + qs : ""}`);
      return body.data;
    },

    async create(o) {
      const body = await request(ROOT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(o),
      });
      return body.data;
    },

    async update(id, o) {
      const body = await request(`${ROOT}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(o),
      });
      return body.data;
    },

    async signUp(id) {
      const body = await request(`${ROOT}/${id}/signup`, { method: "POST" });
      return body.data;
    },

    remove(id) { return request(`${ROOT}/${id}`, { method: "DELETE" }); },
  };
})();
