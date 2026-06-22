/* ===========================================================
   GiveTime full-stack app logic (Project 4).
   Talks to GiveAPI: load + render, sign up, create/edit (PUT),
   delete, search/filter over the network. Loading, error and
   empty states; toasts; confirm dialog; live connection pill.
   DOM built with createElement + textContent (XSS-safe).
   =========================================================== */
(function () {
  "use strict";
  const API = window.GiveAPI;

  let editId = null;
  let pendingDeleteId = null;
  let searchTimer = null;
  let cause = "all";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const listEl = $("#list");
  const skeleton = $("#skeleton");
  const empty = $("#empty");
  const errorBanner = $("#errorBanner");
  const form = $("#form");
  const submitBtn = $("#submitBtn");

  /* ---------- helpers ---------- */
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;     // trusted icon markup only
      else if (k === "style") n.setAttribute("style", v);
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v != null) n.setAttribute(k, v);
    }
    for (const c of kids) if (c != null) n.append(c);
    return n;
  }
  const fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
  };
  const ICON_EDIT = `<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
  const ICON_DEL = `<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;

  function toast(msg, kind = "ok") {
    const t = el("div", { class: `toast ${kind}`, text: msg });
    $("#toasts").append(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2800);
  }

  async function refreshPill() {
    const pill = $("#pill"), text = $("#pillText");
    try { await API.health(); pill.className = "pill online"; text.textContent = "API online"; }
    catch { pill.className = "pill offline"; text.textContent = "API offline"; }
  }

  /* ---------- card ---------- */
  function card(o) {
    const full = o.filled >= o.slots;
    const pct = Math.min(100, Math.round((o.filled / o.slots) * 100));

    const signBtn = full
      ? el("button", { class: "btn btn--sign is-full", disabled: "true", text: "Filled" })
      : el("button", { class: "btn btn--solid btn--sign", text: "Sign up", onclick: () => signUp(o.id) });

    const actions = el("div", { class: "card__actions" },
      signBtn,
      el("button", { class: "icon-btn", title: "Edit", "aria-label": "Edit", html: ICON_EDIT, onclick: () => startEdit(o) }),
      el("button", { class: "icon-btn icon-btn--danger", title: "Delete", "aria-label": "Delete", html: ICON_DEL, onclick: () => askDelete(o) })
    );

    return el("li", { class: "card" },
      el("span", { class: "card__cause", text: o.cause }),
      el("h3", { class: "card__title", text: o.title }),
      el("p", { class: "card__org", text: "by " + o.organization }),
      el("p", { class: "card__meta", text: o.location + "  ·  " + fmtDate(o.date) }),
      el("div", { class: "bar" }, el("i", { class: "bar__fill", style: `width:${pct}%` })),
      el("div", { class: "card__foot" },
        el("span", { class: "card__spots", text: `${o.filled} of ${o.slots} spots filled` }),
        actions
      )
    );
  }

  function render(items) {
    listEl.replaceChildren(...items.map(card));
    empty.hidden = items.length !== 0;
    const open = items.reduce((s, o) => s + Math.max(0, o.slots - o.filled), 0);
    $("#heroMeta").textContent =
      `${items.length} ${items.length === 1 ? "opportunity" : "opportunities"} · ${open} spots still open`;
  }

  /* ---------- load (defensive) ---------- */
  async function load() {
    errorBanner.hidden = true;
    empty.hidden = true;
    skeleton.hidden = false;
    listEl.replaceChildren();
    try {
      const items = await API.list({ cause, search: $("#search").value.trim() });
      render(items);
    } catch (err) {
      $("#errorText").textContent =
        err.kind === "network"
          ? "Couldn't reach the server. Make sure it's running (npm start), then retry."
          : err.message;
      errorBanner.hidden = false;
      $("#heroMeta").textContent = "—";
    } finally {
      skeleton.hidden = true;
    }
  }

  /* ---------- sign up ---------- */
  async function signUp(id) {
    try { await API.signUp(id); toast("You're signed up. Thank you!"); await load(); }
    catch (err) { toast(err.message, "bad"); await load(); }
  }

  /* ---------- form ---------- */
  function validate(d) {
    const e = {};
    if (d.title.trim().length < 3) e.title = "Give it a short, clear title.";
    if (d.organization.trim().length < 2) e.organization = "Who's running it?";
    if (!d.cause) e.cause = "Pick a cause.";
    if (d.location.trim().length < 2) e.location = "Add a location.";
    if (!d.date) e.date = "Pick a date.";
    const n = Number(d.slots);
    if (!Number.isInteger(n) || n < 1) e.slots = "Enter a number (1 or more).";
    return e;
  }
  function showErrors(e) {
    ["title", "organization", "cause", "location", "date", "slots"].forEach((k) => {
      $(`.err[data-for="${k}"]`).textContent = e[k] || "";
      $(`#${k}`).closest(".f").classList.toggle("invalid", Boolean(e[k]));
    });
  }
  function read() {
    return {
      title: $("#title").value, organization: $("#organization").value, cause: $("#cause").value,
      location: $("#location").value, date: $("#date").value, slots: $("#slots").value,
    };
  }
  function setBusy(on, label) {
    submitBtn.disabled = on;
    submitBtn.querySelector(".btn__label").textContent = label;
    submitBtn.querySelector(".spinner").hidden = !on;
  }

  function startEdit(o) {
    editId = o.id;
    $("#title").value = o.title; $("#organization").value = o.organization;
    $("#cause").value = o.cause; $("#location").value = o.location;
    $("#date").value = o.date; $("#slots").value = o.slots;
    $("#formTitle").textContent = "Edit opportunity";
    $("#formSub").innerHTML = `Saving with <code>PUT /api/opportunities/${o.id}</code>.`;
    submitBtn.querySelector(".btn__label").textContent = "Save changes";
    $("#cancelEdit").hidden = false;
    showErrors({});
    $("#post").scrollIntoView({ behavior: "smooth" });
    $("#title").focus();
  }
  function resetForm() {
    editId = null;
    form.reset();
    showErrors({});
    $("#formTitle").textContent = "Post an opportunity";
    $("#formSub").innerHTML = "Saved to the database via <code>POST /api/opportunities</code>.";
    submitBtn.querySelector(".btn__label").textContent = "Add opportunity";
    $("#cancelEdit").hidden = true;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const d = read();
    const errs = validate(d);
    showErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true, editId ? "Saving…" : "Adding…");
    try {
      if (editId) { await API.update(editId, d); toast("Opportunity updated."); }
      else { await API.create(d); toast("Opportunity posted."); }
      resetForm();
      await load();
    } catch (err) {
      toast(err.details && err.details.length ? err.details[0] : err.message, "bad");
    } finally {
      setBusy(false, editId ? "Save changes" : "Add opportunity");
    }
  }

  /* ---------- delete ---------- */
  function askDelete(o) {
    pendingDeleteId = o.id;
    $("#confirmText").textContent = `This permanently removes "${o.title}".`;
    $("#overlay").hidden = false;
  }
  function closeConfirm() { pendingDeleteId = null; $("#overlay").hidden = true; }
  async function confirmDelete() {
    const id = pendingDeleteId;
    closeConfirm();
    if (!id) return;
    try { await API.remove(id); toast("Opportunity deleted."); if (editId === id) resetForm(); await load(); }
    catch (err) { toast(err.message, "bad"); }
  }

  /* ---------- init ---------- */
  function init() {
    $("#year").textContent = new Date().getFullYear();

    form.addEventListener("submit", onSubmit);
    $("#cancelEdit").addEventListener("click", resetForm);

    $("#search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(load, 300); });
    $("#filters").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      cause = btn.dataset.cause;
      $$(".chip").forEach((c) => c.classList.toggle("is-active", c === btn));
      load();
    });
    $("#retry").addEventListener("click", () => { refreshPill(); load(); });

    $("#confirmCancel").addEventListener("click", closeConfirm);
    $("#confirmDelete").addEventListener("click", confirmDelete);
    $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeConfirm(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#overlay").hidden) closeConfirm(); });

    refreshPill();
    load();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
