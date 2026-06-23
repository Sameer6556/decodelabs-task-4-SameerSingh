/* Post page (full-stack): create a new opportunity, or edit one you
   posted from this browser (URL has ?id=NN). New posts are recorded
   in localStorage as "yours", which is what unlocks edit/delete for
   them on the opportunities page. */
(function () {
  "use strict";

  var API = window.GiveAPI;
  var FIELDS = ["title", "organization", "cause", "location", "date", "slots"];
  var editId = null;
  var form, submitBtn;

  function getMine() { try { return JSON.parse(localStorage.getItem("givetime.mine")) || []; } catch (e) { return []; } }
  function addMine(id) { var a = getMine(); if (a.indexOf(Number(id)) === -1) { a.push(Number(id)); localStorage.setItem("givetime.mine", JSON.stringify(a)); } }
  function isMine(id) { return getMine().indexOf(Number(id)) > -1; }

  function val(id) { return document.getElementById(id).value; }
  function read() {
    return { title: val("title"), organization: val("organization"), cause: val("cause"), location: val("location"), date: val("date"), slots: val("slots") };
  }

  function validate(d) {
    var e = {};
    if (d.title.trim().length < 3) e.title = "Give it a short, clear title.";
    if (d.organization.trim().length < 2) e.organization = "Who is running it?";
    if (!d.cause) e.cause = "Pick a cause.";
    if (d.location.trim().length < 2) e.location = "Add a location.";
    if (!d.date) e.date = "Pick a date.";
    var n = Number(d.slots);
    if (!(n >= 1) || Math.floor(n) !== n) e.slots = "Enter a number, 1 or more.";
    return e;
  }
  function showErrors(e) {
    FIELDS.forEach(function (k) {
      document.querySelector('.error[data-for="' + k + '"]').textContent = e[k] || "";
      var f = document.getElementById(k).closest(".field");
      if (f) f.classList.toggle("invalid", Boolean(e[k]));
    });
  }
  function toast(msg, kind) {
    var t = document.createElement("div");
    t.className = "toast " + (kind || "ok");
    t.textContent = msg;
    document.getElementById("toasts").appendChild(t);
    setTimeout(function () { t.style.transition = "opacity .3s"; t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 300); }, 2500);
  }
  function setBusy(on, label) {
    submitBtn.disabled = on;
    submitBtn.querySelector(".btn__label").textContent = label;
    submitBtn.querySelector(".spinner").hidden = !on;
  }

  async function enterEditMode(id) {
    // Only the browser that created an opportunity may edit it.
    if (!isMine(id)) {
      toast("You can only edit opportunities you posted.", "bad");
      setTimeout(function () { window.location.href = "opportunities.html"; }, 1200);
      return;
    }
    try {
      var o = await API.get(id);
      editId = id;
      document.getElementById("title").value = o.title;
      document.getElementById("organization").value = o.organization;
      document.getElementById("cause").value = o.cause;
      document.getElementById("location").value = o.location;
      document.getElementById("date").value = o.date;
      document.getElementById("slots").value = o.slots;
      document.getElementById("pageTitle").textContent = "Edit opportunity";
      document.getElementById("pageSub").textContent = "Update the details and save.";
      submitBtn.querySelector(".btn__label").textContent = "Save changes";
      document.getElementById("cancelLink").hidden = false;
    } catch (err) {
      toast("Could not load that opportunity.", "bad");
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    var d = read();
    var errs = validate(d);
    showErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true, editId ? "Saving" : "Posting");
    try {
      if (editId) {
        await API.update(editId, d);
      } else {
        var created = await API.create(d);
        if (created && created.id) addMine(created.id); // mark as yours
      }
      window.location.href = "opportunities.html";
    } catch (err) {
      toast(err.details && err.details.length ? err.details[0] : err.message, "bad");
      setBusy(false, editId ? "Save changes" : "Post opportunity");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    form = document.getElementById("form");
    submitBtn = document.getElementById("submitBtn");
    form.addEventListener("submit", onSubmit);

    var id = new URLSearchParams(window.location.search).get("id");
    if (id) enterEditMode(id);
  });
})();
