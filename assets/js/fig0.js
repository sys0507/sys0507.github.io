/* Fig. 0 — a career drawn as a single-cell embedding.
   Data: _data/fig0.yml (inlined as JSON in #fig0-data). No dependencies. */
(function () {
  "use strict";
  var svg = document.querySelector("[data-fig0]");
  var dataEl = document.getElementById("fig0-data");
  if (!svg || !dataEl) return;

  var clusters;
  try { clusters = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var NS = "http://www.w3.org/2000/svg";
  var W = svg.viewBox.baseVal.width, H = svg.viewBox.baseVal.height;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var caption = document.querySelector("[data-fig0-caption]");
  var defaultCaption = caption ? caption.innerHTML : "";
  svg.classList.add("f0-plot");

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* deterministic randomness so the figure looks the same on every visit */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20130401);
  function gauss() { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ---- defs ---- */
  var defs = el("defs", {}, svg);
  var marker = el("marker", { id: "f0-arrowhead", viewBox: "0 0 10 10", refX: "7", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, defs);
  el("path", { d: "M0,1 L9,5 L0,9 z", "class": "f0-arrow" }, marker);

  /* ---- axes, scanpy style ---- */
  var axes = el("g", { "class": "f0-overlay", "aria-hidden": "true" }, svg);
  el("path", { d: "M16," + (H - 62) + " L16," + (H - 16) + " L62," + (H - 16), "class": "f0-axis", "marker-start": "url(#f0-arrowhead)", "marker-end": "url(#f0-arrowhead)" }, axes);
  el("text", { x: 70, y: H - 12, "class": "f0-axis-label" }, axes).textContent = "UMAP 1";
  var ax2 = el("text", { x: 20, y: H - 70, "class": "f0-axis-label", transform: "rotate(-90 20 " + (H - 70) + ")" }, axes);
  ax2.textContent = "UMAP 2";

  /* ---- clusters ---- */
  var layer = el("g", {}, svg);
  var dots = [];
  var groups = [];
  clusters.forEach(function (c, ci) {
    var theta = (rnd() - 0.5) * 50;
    var rad = theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    var a = el("a", { href: c.link, "class": "f0-cluster", "aria-label": c.label + ", " + c.years + ", " + c.place + ". " + c.blurb }, layer);
    el("ellipse", { cx: c.x, cy: c.y, rx: c.sx * 1.95, ry: c.sy * 1.95, transform: "rotate(" + theta.toFixed(1) + " " + c.x + " " + c.y + ")", "class": "f0-hit " + c.channel }, a);
    /* two or three sub-populations per cluster make the blobs look like real data */
    var subs = [];
    var k = 2 + Math.floor(rnd() * 2);
    for (var s = 0; s < k; s++) subs.push([(rnd() - 0.5) * c.sx * 1.1, (rnd() - 0.5) * c.sy * 1.1]);
    for (var i = 0; i < c.n; i++) {
      var sub = subs[i % k];
      var lx = sub[0] + gauss() * c.sx * 0.5, ly = sub[1] + gauss() * c.sy * 0.5;
      var tx = c.x + lx * cos - ly * sin, ty = c.y + lx * sin + ly * cos;
      var r = (2 + rnd() * 1.1).toFixed(2);
      var sx0 = 20 + rnd() * (W - 40), sy0 = 20 + rnd() * (H - 40);
      var d = el("circle", { cx: (reduce ? tx : sx0).toFixed(1), cy: (reduce ? ty : sy0).toFixed(1), r: r, "class": "f0-dot " + c.channel }, a);
      dots.push({ el: d, x0: sx0, y0: sy0, x1: tx, y1: ty, delay: rnd() * 320 + ci * 40 });
    }
    groups.push(a);
  });

  /* ---- pseudotime trajectory through the cluster centres ---- */
  var over = el("g", { "class": "f0-overlay f0-traj-group", "aria-hidden": "true" }, svg);
  var P = clusters.map(function (c) { return [c.x, c.y]; });
  var d = "M" + P[0][0] + "," + P[0][1];
  for (var i = 0; i < P.length - 1; i++) {
    var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + "," + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
         " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + "," + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
         " " + p2[0] + "," + p2[1];
  }
  var traj = el("path", { d: d, "class": "f0-traj", "marker-end": "url(#f0-arrowhead)" }, over);
  P.forEach(function (p) { el("circle", { cx: p[0], cy: p[1], r: 4.2, "class": "f0-knot" }, over); });

  /* ---- labels ---- */
  var labels = el("g", { "class": "f0-overlay f0-labels", "aria-hidden": "true" }, svg);
  clusters.forEach(function (c) {
    var at = c.label_at || [0, 40, "middle"];
    var x = c.x + at[0], y = c.y + at[1], anchor = at[2] || "middle";
    var above = at[1] < 0;
    el("text", { x: x, y: y, "text-anchor": anchor, "class": "f0-label" }, labels).textContent = c.label;
    el("text", { x: x, y: above ? y - 16 : y + 15, "text-anchor": anchor, "class": "f0-year" }, labels).textContent = c.years;
  });

  /* ---- interaction ---- */
  function activate(i) {
    svg.classList.add("has-active");
    groups.forEach(function (g, j) { g.classList.toggle("is-active", j === i); });
    var c = clusters[i];
    if (caption) caption.innerHTML = "<b>" + esc(c.label) + "</b>, " + esc(c.years) + ", " + esc(c.place) + ". " + esc(c.blurb);
  }
  function reset() {
    svg.classList.remove("has-active");
    groups.forEach(function (g) { g.classList.remove("is-active"); });
    if (caption) caption.innerHTML = defaultCaption;
  }
  groups.forEach(function (g, i) {
    g.addEventListener("mouseenter", function () { activate(i); });
    g.addEventListener("focus", function () { activate(i); });
    g.addEventListener("mouseleave", reset);
    g.addEventListener("blur", reset);
  });

  /* ---- one orchestrated entrance: points condense into clusters ---- */
  if (reduce) return;
  var len = traj.getTotalLength();
  traj.style.strokeDasharray = len;
  traj.style.strokeDashoffset = len;
  traj.removeAttribute("marker-end");
  traj.addEventListener("transitionend", function () { traj.setAttribute("marker-end", "url(#f0-arrowhead)"); }, { once: true });
  over.style.opacity = "0";
  labels.style.opacity = "0";
  var DUR = 1400, start = null;
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function frame(ts) {
    if (start === null) start = ts;
    var el_ = ts - start, done = true;
    for (var i = 0; i < dots.length; i++) {
      var p = dots[i];
      var t = Math.min(1, Math.max(0, (el_ - p.delay) / DUR));
      if (t < 1) done = false;
      var e = ease(t);
      p.el.setAttribute("cx", (p.x0 + (p.x1 - p.x0) * e).toFixed(1));
      p.el.setAttribute("cy", (p.y0 + (p.y1 - p.y0) * e).toFixed(1));
    }
    if (!done) { requestAnimationFrame(frame); return; }
    over.style.opacity = "1";
    traj.style.transition = "stroke-dashoffset 1.1s ease-out";
    requestAnimationFrame(function () { traj.style.strokeDashoffset = "0"; });
    labels.style.opacity = "1";
  }
  requestAnimationFrame(frame);
})();
