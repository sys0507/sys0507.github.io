/* Site behaviour: list filters, BibTeX copy, print. No dependencies. */
(function () {
  "use strict";

  /* ---------- filters (publications, notebook) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (bar) {
    var name = bar.getAttribute("data-filter-group");
    var target = document.querySelector('[data-filter-target="' + name + '"]');
    var status = document.querySelector('[data-filter-status="' + name + '"]');
    var empty = document.querySelector('[data-filter-empty="' + name + '"]');
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-filter]"));
    var items = target ? Array.prototype.slice.call(target.querySelectorAll("[data-tags]")) : [];
    var groups = target ? Array.prototype.slice.call(target.querySelectorAll("[data-group]")) : [];

    function apply(filter, fromUser) {
      var valid = buttons.some(function (b) { return b.getAttribute("data-filter") === filter; });
      if (!valid) filter = "all";
      var shown = 0;
      items.forEach(function (el) {
        var tags = (el.getAttribute("data-tags") || "").split(/\s+/);
        var ok = filter === "all" || tags.indexOf(filter) !== -1;
        el.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector("[data-tags]:not([hidden])"); });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === filter)); });
      if (empty) empty.hidden = shown !== 0;
      if (status) status.textContent = shown + (shown === 1 ? " item" : " items") + " shown";
      if (fromUser && window.history && history.replaceState) {
        var url = new URL(window.location.href);
        if (filter === "all") url.searchParams.delete("filter"); else url.searchParams.set("filter", filter);
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-filter"), true); });
    });
    var initial = new URLSearchParams(window.location.search).get("filter");
    if (initial) apply(initial, false);
  });

  /* ---------- copy BibTeX ---------- */
  var copyStatus = document.querySelector("[data-copy-status]");
  function announce(msg) { if (copyStatus) { copyStatus.textContent = ""; setTimeout(function () { copyStatus.textContent = msg; }, 30); } }
  function fallbackBib(btn) {
    var doi = btn.getAttribute("data-cite");
    var key = "li" + btn.getAttribute("data-cite-year") + doi.replace(/[^a-z0-9]/gi, "").slice(-6);
    return "@article{" + key + ",\n  title   = {" + btn.getAttribute("data-cite-title") + "},\n  journal = {" +
      btn.getAttribute("data-cite-venue") + "},\n  year    = {" + btn.getAttribute("data-cite-year") + "},\n  doi     = {" + doi + "}\n}";
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); } finally { document.body.removeChild(ta); }
    });
  }
  document.querySelectorAll("[data-cite]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.textContent;
      var doi = btn.getAttribute("data-cite");
      btn.disabled = true; btn.textContent = "Copying…";
      var url = "https://api.crossref.org/works/" + encodeURIComponent(doi) + "/transform/application/x-bibtex";
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : null;
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r.text(); })
        .catch(function () { return fallbackBib(btn); })
        .then(function (bib) { if (timer) clearTimeout(timer); return copyText(bib.trim()); })
        .then(function () { btn.textContent = "BibTeX copied"; announce("BibTeX copied to clipboard"); })
        .catch(function () { btn.textContent = "Copy failed, open the DOI instead"; announce("Couldn't copy. Open the paper's DOI page to export a citation."); })
        .then(function () { setTimeout(function () { btn.textContent = label; btn.disabled = false; }, 2200); });
    });
  });

  /* ---------- print ---------- */
  document.querySelectorAll("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });
})();
