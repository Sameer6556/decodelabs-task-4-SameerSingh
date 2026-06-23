/* Opportunities page (full-stack): load from the API, sign up,
   and (only for opportunities you posted) edit or delete.
   - Sign up is limited to once per browser.
   - Edit/Delete only appear on opportunities created in this browser.
   Cards built with createElement + textContent (safe). */
(function () {
  "use strict";

  var API = window.GiveAPI;
  var grid, empty, skeleton, errorBanner, errorText, search, causeFilter;
  var cause = "all", searchTimer = null, pendingDeleteId = null;

  var ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var ICON_DEL = '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';

  /* localStorage helpers: what this browser signed up for / created */
  function getList(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
  function addTo(key, id) { var a = getList(key); if (a.indexOf(Number(id)) === -1) { a.push(Number(id)); localStorage.setItem(key, JSON.stringify(a)); } }
  function isSigned(id) { return getList("givetime.signedup").indexOf(Number(id)) > -1; }
  function isMine(id) { return getList("givetime.mine").indexOf(Number(id)) > -1; }

  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  function toast(msg, kind) {
    var t = document.createElement("div");
    t.className = "toast " + (kind || "ok");
    t.textContent = msg;
    document.getElementById("toasts").appendChild(t);
    setTimeout(function () { t.style.transition = "opacity .3s"; t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 300); }, 2800);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function card(o) {
    var full = o.filled >= o.slots;
    var signed = isSigned(o.id);
    var mine = isMine(o.id);
    var pct = Math.min(100, Math.round((o.filled / o.slots) * 100));

    var li = el("li", "card");
    li.appendChild(el("span", "badge", o.cause));
    li.appendChild(el("h3", null, o.title));
    li.appendChild(el("p", "card__org", "by " + o.organization));

    var meta = el("div", "card__meta");
    meta.appendChild(el("span", null, o.location));
    meta.appendChild(el("span", null, fmtDate(o.date)));
    li.appendChild(meta);

    var prog = el("div", "progress");
    var bar = el("div", "progress__bar");
    bar.style.width = pct + "%";
    prog.appendChild(bar);
    li.appendChild(prog);

    var foot = el("div", "card__foot");
    foot.appendChild(el("span", "card__spots", o.filled + " of " + o.slots + " spots filled"));

    var actions = el("div", "card__actions");
    if (signed) {
      actions.appendChild(el("span", "is-signed", "Signed up"));
    } else if (full) {
      actions.appendChild(el("span", "is-full", "Filled"));
    } else {
      var signBtn = el("button", "btn btn-primary btn-sm", "Sign up");
      signBtn.addEventListener("click", function () { signUp(o.id); });
      actions.appendChild(signBtn);
    }

    // Edit and delete only for opportunities posted from this browser.
    if (mine) {
      var editLink = document.createElement("a");
      editLink.className = "icon-btn";
      editLink.href = "post.html?id=" + o.id;
      editLink.title = "Edit";
      editLink.setAttribute("aria-label", "Edit");
      editLink.innerHTML = ICON_EDIT;
      actions.appendChild(editLink);

      var delBtn = document.createElement("button");
      delBtn.className = "icon-btn danger";
      delBtn.title = "Delete";
      delBtn.setAttribute("aria-label", "Delete");
      delBtn.innerHTML = ICON_DEL;
      delBtn.addEventListener("click", function () { askDelete(o); });
      actions.appendChild(delBtn);
    }

    foot.appendChild(actions);
    li.appendChild(foot);
    return li;
  }

  async function load() {
    errorBanner.hidden = true;
    empty.hidden = true;
    skeleton.hidden = false;
    grid.innerHTML = "";
    try {
      var items = await API.list({ cause: cause, search: search.value.trim() });
      grid.innerHTML = "";
      items.forEach(function (o) { grid.appendChild(card(o)); });
      empty.hidden = items.length !== 0;
    } catch (err) {
      errorText.textContent = err.kind === "network"
        ? "Could not reach the server. Make sure it is running (npm start), then retry."
        : err.message;
      errorBanner.hidden = false;
    } finally {
      skeleton.hidden = true;
    }
  }

  async function signUp(id) {
    if (isSigned(id)) return;
    try {
      await API.signUp(id);
      addTo("givetime.signedup", id);
      toast("You are signed up. Thank you!");
      load();
    } catch (err) {
      toast(err.message, "bad");
      load();
    }
  }

  function askDelete(o) {
    pendingDeleteId = o.id;
    document.getElementById("confirmText").textContent = 'This permanently removes "' + o.title + '".';
    document.getElementById("overlay").hidden = false;
  }
  function closeConfirm() { pendingDeleteId = null; document.getElementById("overlay").hidden = true; }
  async function confirmDelete() {
    var id = pendingDeleteId;
    closeConfirm();
    if (!id) return;
    try { await API.remove(id); toast("Opportunity deleted."); load(); }
    catch (err) { toast(err.message, "bad"); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    grid = document.getElementById("grid");
    empty = document.getElementById("empty");
    skeleton = document.getElementById("skeleton");
    errorBanner = document.getElementById("errorBanner");
    errorText = document.getElementById("errorText");
    search = document.getElementById("search");
    causeFilter = document.getElementById("causeFilter");

    search.addEventListener("input", function () { clearTimeout(searchTimer); searchTimer = setTimeout(load, 300); });
    causeFilter.addEventListener("change", function () { cause = causeFilter.value; load(); });
    document.getElementById("retry").addEventListener("click", load);

    document.getElementById("confirmCancel").addEventListener("click", closeConfirm);
    document.getElementById("confirmDelete").addEventListener("click", confirmDelete);
    document.getElementById("overlay").addEventListener("click", function (e) { if (e.target.id === "overlay") closeConfirm(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !document.getElementById("overlay").hidden) closeConfirm(); });

    load();
  });
})();
