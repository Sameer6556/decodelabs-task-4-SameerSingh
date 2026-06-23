/* Home page: pull the summary numbers from the API. */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", async function () {
    try {
      var items = await window.GiveAPI.list({});
      var spots = items.reduce(function (s, o) { return s + Math.max(0, o.slots - o.filled); }, 0);
      var causes = {};
      items.forEach(function (o) { causes[o.cause] = true; });
      document.getElementById("statOpps").textContent = items.length;
      document.getElementById("statSpots").textContent = spots;
      document.getElementById("statCauses").textContent = Object.keys(causes).length;
    } catch (e) {
      document.getElementById("statOpps").textContent = "-";
      document.getElementById("statSpots").textContent = "-";
      document.getElementById("statCauses").textContent = "-";
    }
  });
})();
