/* ==========================================================
   API client. Wraps fetch with async/await, checks HTTP status
   codes, parses JSON, and throws useful errors so each page can
   show a clear message instead of failing silently.
   ========================================================== */
(function () {
  "use strict";

  var BASE = window.API_BASE || "";
  var ROOT = BASE + "/api/opportunities";

  async function request(url, options) {
    var res;
    try {
      res = await fetch(url, options || {});
    } catch (e) {
      var net = new Error("Network error, could not reach the server.");
      net.kind = "network";
      throw net;
    }
    var body = null;
    if (res.status !== 204) {
      try { body = await res.json(); } catch (e) { body = null; }
    }
    if (!res.ok) {
      var err = new Error((body && (body.error || body.message)) || ("Request failed (" + res.status + ")."));
      err.status = res.status;
      err.details = body && body.details;
      throw err;
    }
    return body;
  }

  window.GiveAPI = {
    health: function () { return request(BASE + "/api/health"); },

    list: async function (opts) {
      opts = opts || {};
      var p = new URLSearchParams();
      if (opts.cause && opts.cause !== "all") p.set("cause", opts.cause);
      if (opts.search) p.set("search", opts.search);
      var qs = p.toString();
      var body = await request(ROOT + (qs ? "?" + qs : ""));
      return body.data;
    },

    get: async function (id) {
      var body = await request(ROOT + "/" + id);
      return body.data;
    },

    create: async function (o) {
      var body = await request(ROOT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
      return body.data;
    },

    update: async function (id, o) {
      var body = await request(ROOT + "/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
      return body.data;
    },

    signUp: async function (id) {
      var body = await request(ROOT + "/" + id + "/signup", { method: "POST" });
      return body.data;
    },

    remove: function (id) { return request(ROOT + "/" + id, { method: "DELETE" }); }
  };
})();
