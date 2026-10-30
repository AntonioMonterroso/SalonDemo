"use strict";
/* ============================================================
   Estudio de diseño de uñas: geometría, render en SVG, lookbook,
   precio, materiales y la pantalla #/disenar.
   Un diseño = { modo: "manos"|"pies", piel, forma, largo, unas: [5 × {color, esmalte_id, acabado, tecnica, punta, deco:[{t,x,y}]}] }
   ============================================================ */

const FORMAS = [["cuadrada", "Cuadrada"], ["squoval", "Squoval"], ["ovalada", "Ovalada"], ["almendra", "Almendra"], ["coffin", "Bailarina"], ["stiletto", "Stiletto"]];
const LARGOS = [["corto", "Corto"], ["medio", "Medio"], ["largo", "Largo"], ["xl", "XL"]];
const ACABADOS = [["brillo", "Brillo", 0], ["mate", "Mate", 0], ["cromado", "Cromado", 6], ["glitter", "Glitter", 4], ["ojo", "Ojo de gato", 6], ["perlado", "Perlado", 5]];
const TECNICAS = [["ninguna", "Liso", 0], ["frances", "Francés", 6], ["baby", "Baby boomer", 8], ["ombre", "Ombré", 8], ["aura", "Aura", 8], ["marmol", "Mármol", 10], ["linea", "Línea fina", 4], ["puntos", "Puntos", 4], ["carey", "Carey", 10]];
const DECOS = [["piedra", "Cristal", 3], ["perla", "Perla", 3], ["estrella", "Estrella", 4], ["corazon", "Corazón", 4], ["flor", "Flor", 6], ["lamina", "Lámina de oro", 5]];
const PIELES = [["#F7E0D2", "#E6BFA9", "#C29179"], ["#EDC6AA", "#D6A383", "#AE7B5E"], ["#CB9472", "#AA7352", "#7F5038"], ["#93604A", "#714734", "#4C2D1F"]];
const PUNTAS = ["#FBFBF9", "#141414", "#C9A24A", "#F2C6CF", "#E8C3B9", "#C0C3C8", "#B3132C", "#A08CC8", "#9CAF95", "#1F2A4D"];
const NOMBRES_DEDO = { manos: ["Meñique", "Anular", "Medio", "Índice", "Pulgar"], pies: ["Dedo gordo", "Segundo", "Tercero", "Cuarto", "Pequeño"] };

/* Set de uñas sin mano (como un juego de press-on): posición, giro y ancho de cada uña (viewBox 0 0 430 320) */
const DEDOS = {
  manos: [
    { x: 64, y: 270, rot: -15, w: 40 }, { x: 138, y: 252, rot: -7.5, w: 48 }, { x: 215, y: 245, rot: 0, w: 52 },
    { x: 292, y: 252, rot: 7.5, w: 48 }, { x: 368, y: 270, rot: 15, w: 56 }
  ],
  pies: [
    { x: 78, y: 236, rot: -9, w: 64 }, { x: 160, y: 226, rot: -3, w: 44 }, { x: 226, y: 228, rot: 3, w: 40 },
    { x: 286, y: 236, rot: 8, w: 36 }, { x: 340, y: 248, rot: 13, w: 32 }
  ]
};
Object.entries(DEDOS).forEach(([modo, l]) => l.forEach(d => { d.hb = d.w * (modo === "pies" ? .74 : 1.05); }));

/* ---------- geometría de una uña (cutícula en 0,0; crece hacia arriba) ---------- */
function largoDe(w, forma, largo, modo) {
  const f = modo === "pies" ? { corto: .08, medio: .24, largo: .24, xl: .24 }[largo] : { corto: .18, medio: .5, largo: .92, xl: 1.35 }[largo];
  const minimo = modo === "pies" ? 0 : ["almendra", "stiletto", "coffin"].includes(forma) ? .38 : 0;
  return w * Math.max(f || .5, minimo);
}
function unaPath(w, forma, L, hb) {
  const h = w / 2, T = -(hb + L), f = n => +n.toFixed(2);
  let tip;
  if (forma === "cuadrada") { const r = Math.min(2.4, w * .08); tip = `L${f(-h)} ${f(T + r)} Q${f(-h)} ${f(T)} ${f(-h + r)} ${f(T)} L${f(h - r)} ${f(T)} Q${f(h)} ${f(T)} ${f(h)} ${f(T + r)}`; }
  else if (forma === "squoval") { const r = Math.min(w * .3, L + hb * .2); tip = `L${f(-h)} ${f(T + r)} Q${f(-h)} ${f(T)} ${f(-h + r)} ${f(T)} L${f(h - r)} ${f(T)} Q${f(h)} ${f(T)} ${f(h)} ${f(T + r)}`; }
  else if (forma === "ovalada") { const ys = Math.min(-hb * .8, T + w * .5), cy = (T - .25 * ys) / .75; tip = `L${f(-h)} ${f(ys)} C${f(-h)} ${f(cy)} ${f(h)} ${f(cy)} ${f(h)} ${f(ys)}`; }
  else if (forma === "almendra") { const ys = -hb * .8, c = ys + (T - ys) * .55; tip = `L${f(-h)} ${f(ys)} C${f(-h)} ${f(c)} ${f(-w * .17)} ${f(T)} 0 ${f(T)} C${f(w * .17)} ${f(T)} ${f(h)} ${f(c)} ${f(h)} ${f(ys)}`; }
  else if (forma === "stiletto") { const ys = -hb * .75, c = ys + (T - ys) * .45; tip = `L${f(-h)} ${f(ys)} C${f(-h)} ${f(c)} ${f(-w * .05)} ${f(T + (ys - T) * .08)} 0 ${f(T)} C${f(w * .05)} ${f(T + (ys - T) * .08)} ${f(h)} ${f(c)} ${f(h)} ${f(ys)}`; }
  else { const ys = -hb * .85, k = w * .27; tip = `L${f(-h)} ${f(ys)} L${f(-k)} ${f(T + 1.2)} Q${f(-k + .3)} ${f(T)} ${f(-k + 1.6)} ${f(T)} L${f(k - 1.6)} ${f(T)} Q${f(k - .3)} ${f(T)} ${f(k)} ${f(T + 1.2)} L${f(h)} ${f(ys)}`; }
  return `M${f(-h)} 0 ${tip} L${f(h)} 0 C${f(h)} ${f(w * .38)} ${f(-h)} ${f(w * .38)} ${f(-h)} 0Z`;
}

/* ---------- diseño ---------- */
const unaBase = (color = "#E8C3B9") => ({ color, esmalte_id: null, acabado: "brillo", tecnica: "ninguna", punta: "#FBFBF9", deco: [] });
const disenoVacio = (modo = "manos") => ({ modo, piel: 0, forma: modo === "pies" ? "cuadrada" : "almendra", largo: modo === "pies" ? "corto" : "medio", unas: [0, 1, 2, 3, 4].map(() => unaBase()) });
function hacer(o) {
  const d = disenoVacio(o.modo || "manos");
  Object.assign(d, { forma: o.forma || d.forma, largo: o.largo || d.largo, piel: o.piel || 0 });
  d.unas = d.unas.map((u, i) => Object.assign(u, o.todas || {}, (o.una || {})[i] || {}));
  return d;
}
const LOOKBOOK = [
  { id: "frances", nombre: "Francés clásico", desc: "Nunca falla. Punta blanca sobre nude.", gen: () => hacer({ forma: "squoval", largo: "medio", todas: { color: "#F1DCD4", tecnica: "frances", punta: "#FBFBF9" } }) },
  { id: "nude-glitter", nombre: "Nude con destello", desc: "Champán y una uña de acento con brillo.", gen: () => hacer({ forma: "almendra", largo: "medio", todas: { color: "#D8C3A5" }, una: { 1: { color: "#C9A24A", acabado: "glitter" } } }) },
  { id: "aura-rosa", nombre: "Aura rosa", desc: "Un halo suave que sale del centro.", gen: () => hacer({ forma: "almendra", largo: "largo", piel: 1, todas: { color: "#F6E3E8", tecnica: "aura", punta: "#EE8FB1" } }) },
  { id: "cromado-perla", nombre: "Cromo perla", desc: "El efecto glazed que se ve en todas partes.", gen: () => hacer({ forma: "almendra", largo: "medio", todas: { color: "#F3E9E2", acabado: "cromado" } }) },
  { id: "rojo-clasico", nombre: "Rojo de siempre", desc: "Rojo intenso con brillo de espejo.", gen: () => hacer({ forma: "ovalada", largo: "medio", piel: 2, todas: { color: "#B3132C", esmalte_id: "c9" } }) },
  { id: "noir-piedras", nombre: "Noir con cristales", desc: "Negro profundo y cristales en el centro.", gen: () => hacer({ forma: "stiletto", largo: "largo", todas: { color: "#141414", esmalte_id: "c21" }, una: { 1: { deco: [{ t: "piedra", x: 0, y: -.5 }, { t: "piedra", x: 0, y: -.82 }, { t: "piedra", x: 0, y: -1.12 }] }, 2: { deco: [{ t: "piedra", x: 0, y: -.6 }] } } }) },
  { id: "baby-boomer", nombre: "Baby boomer", desc: "Del rosa al blanco, sin líneas.", gen: () => hacer({ forma: "coffin", largo: "largo", piel: 1, todas: { color: "#F2C6CF", tecnica: "baby", punta: "#FBFBF9" } }) },
  { id: "marmol", nombre: "Mármol y oro", desc: "Vetas suaves con un hilo dorado.", gen: () => hacer({ forma: "squoval", largo: "medio", todas: { color: "#FBFBF9", tecnica: "marmol", punta: "#9A9A9A" }, una: { 1: { tecnica: "linea", punta: "#C9A24A", color: "#F3E9E2" }, 3: { tecnica: "linea", punta: "#C9A24A", color: "#F3E9E2" } } }) },
  { id: "flores", nombre: "Jardín", desc: "Florecitas pintadas a mano.", gen: () => hacer({ forma: "ovalada", largo: "corto", piel: 2, todas: { color: "#F2C6CF" }, una: { 1: { color: "#FBFBF9", deco: [{ t: "flor", x: -.05, y: -.7 }] }, 3: { color: "#FBFBF9", deco: [{ t: "flor", x: .05, y: -.65 }] } } }) },
  { id: "carey", nombre: "Carey", desc: "Ámbar y caramelo, muy de otoño.", gen: () => hacer({ forma: "almendra", largo: "medio", piel: 1, todas: { color: "#C58A4A", tecnica: "carey", punta: "#4E3027" } }) },
  { id: "ojo-gato", nombre: "Noche · ojo de gato", desc: "Un reflejo que se mueve con la luz.", gen: () => hacer({ forma: "almendra", largo: "largo", piel: 3, todas: { color: "#1F2A4D", acabado: "ojo" } }) },
  { id: "novia", nombre: "Novia perlada", desc: "Porcelana, perlas y efecto nacarado.", gen: () => hacer({ forma: "almendra", largo: "medio", todas: { color: "#F3E9E2", acabado: "perlado" }, una: { 1: { deco: [{ t: "perla", x: 0, y: -.45 }, { t: "perla", x: -.18, y: -.7 }, { t: "perla", x: .18, y: -.7 }] } } }) }
];
function disenoCompleto(d) {
  if (!d) return disenoVacio();
  let out;
  if (d.preset) {
    const p = LOOKBOOK.find(x => x.id === d.preset) || LOOKBOOK[0];
    out = p.gen();
    if (d.pies) { out.modo = "pies"; out.forma = "cuadrada"; out.largo = "corto"; out.unas.forEach(u => u.deco = u.deco.filter(x => x.t !== "flor").slice(0, 1)); }
  } else out = JSON.parse(JSON.stringify(d));
  if (!out.unas || out.unas.length !== 5) out.unas = disenoVacio(out.modo).unas;
  return out;
}

/* precio del arte (además del servicio) y tiempo extra */
function precioDiseno(d0) {
  const d = disenoCompleto(d0); let q = 0;
  if (d.modo === "manos") q += { largo: 25, xl: 50 }[d.largo] || 0;
  d.unas.forEach(u => {
    q += (TECNICAS.find(t => t[0] === u.tecnica) || [0, 0, 0])[2];
    q += (ACABADOS.find(t => t[0] === u.acabado) || [0, 0, 0])[2];
    u.deco.forEach(x => q += (DECOS.find(t => t[0] === x.t) || [0, 0, 0])[2]);
  });
  if (new Set(d.unas.map(u => u.color)).size > 2) q += 10;
  return q;
}
function minutosDiseno(d0) {
  const d = disenoCompleto(d0);
  return (d.largo === "xl" ? 20 : d.largo === "largo" ? 10 : 0) + sum(d.unas, u => (u.tecnica !== "ninguna" ? 3 : 0) + (u.acabado !== "brillo" && u.acabado !== "mate" ? 2 : 0) + u.deco.length);
}
function nombreColor(hex, id) {
  const e = id ? (db.d ? esmalte(id) : null) : (db.d ? db.listar("esmaltes").find(x => x.hex.toLowerCase() === String(hex).toLowerCase()) : null);
  return e ? e.nombre + " · " + e.codigo : "Tono " + String(hex).toUpperCase();
}
function materiales(d0) {
  const d = disenoCompleto(d0), out = [];
  const nf = (FORMAS.find(x => x[0] === d.forma) || ["", d.forma])[1], nl = (LARGOS.find(x => x[0] === d.largo) || ["", d.largo])[1];
  out.push({ t: (d.modo === "pies" ? "Pies" : "Manos") + " · " + nf + " · " + nl, n: "" });
  const colores = {}; d.unas.forEach(u => { const k = nombreColor(u.color, u.esmalte_id); colores[k] = (colores[k] || 0) + 1; });
  Object.entries(colores).forEach(([k, n]) => out.push({ t: k, n: n + (n === 1 ? " uña" : " uñas") }));
  const cuenta = (lista, campo, omitir) => { const c = {}; d.unas.forEach(u => { if (u[campo] !== omitir) c[u[campo]] = (c[u[campo]] || 0) + 1; }); Object.entries(c).forEach(([k, n]) => out.push({ t: (lista.find(x => x[0] === k) || ["", k])[1], n: n + (n === 1 ? " uña" : " uñas") })); };
  cuenta(TECNICAS, "tecnica", "ninguna"); cuenta(ACABADOS, "acabado", "brillo");
  const dc = {}; d.unas.forEach(u => u.deco.forEach(x => dc[x.t] = (dc[x.t] || 0) + 1));
  Object.entries(dc).forEach(([k, n]) => out.push({ t: (DECOS.find(x => x[0] === k) || ["", k])[1], n: n + " pza" }));
  const puntas = [...new Set(d.unas.filter(u => u.tecnica !== "ninguna").map(u => u.punta))];
  puntas.forEach(p => out.push({ t: "Detalle: " + nombreColor(p), n: "" }));
  return out;
}

/* ---------- render SVG ---------- */
let svgN = 0;
function claro(hex) { const n = parseInt(String(hex).slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150; }
function capasUna(u, w, L, hb, pre, i, forma) {
  const T = -(hb + L), h = w / 2, path = unaPath(w, forma, L, hb), cp = `${pre}c${i}`, out = [];
  let defs = `<clipPath id="${cp}"><path d="${path}"/></clipPath>`;
  out.push(`<path d="${path}" fill="${u.color}"/>`);
  const g = [];
  const p = u.punta || "#FBFBF9";
  switch (u.tecnica) {
    case "frances": { const tl = Math.max(L * .85, w * .34), ys = T + tl, dp = w * .3; g.push(`<path d="M${-w} ${ys + dp} Q0 ${ys - dp * .5} ${w} ${ys + dp} L${w} ${T - 10} L${-w} ${T - 10}Z" fill="${p}"/>`); break; }
    case "baby": defs += `<linearGradient id="${pre}g${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${T}" x2="0" y2="${w * .2}"><stop offset="0" stop-color="${p}"/><stop offset=".35" stop-color="${p}" stop-opacity=".85"/><stop offset=".75" stop-color="${p}" stop-opacity="0"/></linearGradient>`; g.push(`<rect x="${-w}" y="${T - 5}" width="${w * 2}" height="${-T + w}" fill="url(#${pre}g${i})"/>`); break;
    case "ombre": defs += `<linearGradient id="${pre}g${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${T}" x2="0" y2="${w * .2}"><stop offset="0" stop-color="${p}"/><stop offset="1" stop-color="${p}" stop-opacity="0"/></linearGradient>`; g.push(`<rect x="${-w}" y="${T - 5}" width="${w * 2}" height="${-T + w}" fill="url(#${pre}g${i})"/>`); break;
    case "aura": defs += `<radialGradient id="${pre}g${i}" gradientUnits="userSpaceOnUse" cx="0" cy="${(T + 0) * .5}" r="${w * .62}"><stop offset="0" stop-color="${p}"/><stop offset=".55" stop-color="${p}" stop-opacity=".55"/><stop offset="1" stop-color="${p}" stop-opacity="0"/></radialGradient>`; g.push(`<rect x="${-w}" y="${T - 5}" width="${w * 2}" height="${-T + w}" fill="url(#${pre}g${i})"/>`); break;
    case "marmol": { const k = (i % 3) * .15; g.push(`<path d="M${-h} ${T * (.2 + k)} C${-w * .1} ${T * (.35 + k)} ${w * .1} ${T * .25} ${h} ${T * (.6 + k * .5)}" stroke="${p}" stroke-width="1.1" fill="none" opacity=".55"/><path d="M${-h} ${T * (.62 - k)} C${-w * .2} ${T * .55} ${w * .05} ${T * (.85 - k)} ${h} ${T * .8}" stroke="${p}" stroke-width=".7" fill="none" opacity=".45"/><path d="M${-w * .1} ${T * .1} C0 ${T * .4} ${w * .2} ${T * .45} ${w * .15} ${T * .95}" stroke="#C9A24A" stroke-width=".6" fill="none" opacity=".7"/>`); break; }
    case "linea": g.push(`<path d="M${w * .12} ${w * .4} L${w * .12} ${T - 4}" stroke="${p}" stroke-width="1.4"/><path d="M${-w * .1} ${w * .4} L${-w * .1} ${T - 4}" stroke="${p}" stroke-width=".7" opacity=".8"/>`); break;
    case "puntos": { const r = w * .065; for (let y = -w * .25; y > T + r; y -= w * .26) for (let x = -h + w * .2; x < h; x += w * .3) g.push(`<circle cx="${(x + ((Math.round(y / (w * .26)) % 2) ? w * .15 : 0)).toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${p}"/>`); break; }
    case "carey": { const m = [[-.25, .25, .22], [.2, .45, .18], [-.1, .7, .24], [.25, .85, .16], [-.28, 1.05, .14], [.05, 1.15, .2]]; m.forEach(([x, y, r], j) => { defs += `<radialGradient id="${pre}k${i}${j}"><stop offset="0" stop-color="${p}" stop-opacity=".9"/><stop offset="1" stop-color="${p}" stop-opacity="0"/></radialGradient>`; g.push(`<circle cx="${x * w}" cy="${T * y * .85}" r="${r * w * 1.3}" fill="url(#${pre}k${i}${j})"/>`); }); break; }
  }
  switch (u.acabado) {
    case "cromado": defs += `<linearGradient id="${pre}a${i}" x1="0" y1="0" x2="1" y2="1"><stop offset=".1" stop-color="#fff" stop-opacity=".1"/><stop offset=".3" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset=".65" stop-color="#fff" stop-opacity=".5"/><stop offset=".85" stop-color="#E9D9FF" stop-opacity=".15"/></linearGradient>`; g.push(`<rect x="${-h}" y="${T}" width="${w}" height="${-T + w * .4}" fill="url(#${pre}a${i})"/>`); break;
    case "glitter": g.push(`<rect x="${-h}" y="${T}" width="${w}" height="${-T + w * .4}" fill="url(#${pre}glit)"/>`); break;
    case "ojo": defs += `<linearGradient id="${pre}a${i}" x1="0" y1="1" x2="1" y2="0"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></linearGradient>`; g.push(`<rect x="${-h}" y="${T}" width="${w}" height="${-T + w * .4}" fill="url(#${pre}a${i})"/>`); break;
    case "perlado": defs += `<linearGradient id="${pre}a${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3EE" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#DCEBFF" stop-opacity=".5"/></linearGradient>`; g.push(`<rect x="${-h}" y="${T}" width="${w}" height="${-T + w * .4}" fill="url(#${pre}a${i})"/>`); break;
    case "mate": g.push(`<rect x="${-h}" y="${T}" width="${w}" height="${-T + w * .4}" fill="#fff" opacity=".07"/>`); break;
  }
  if (u.acabado !== "mate") { const y1 = -hb * .15, y2 = Math.max(T + w * .35, -hb * 1.1); g.push(`<rect x="${-h + w * .16}" y="${y2.toFixed(1)}" width="${(w * .11).toFixed(1)}" height="${(y1 - y2).toFixed(1)}" rx="${(w * .055).toFixed(1)}" fill="#fff" opacity="${u.acabado === "cromado" ? .7 : claro(u.color) ? .55 : .32}"/>`); }
  u.deco.forEach(x => g.push(decoSVG(x, w, pre)));
  out.push(`<g clip-path="url(#${cp})">${g.join("")}</g>`);
  out.push(`<path d="${path}" fill="none" stroke="rgba(40,24,16,.16)" stroke-width=".8"/>`);
  return { defs, html: out.join(""), path };
}
function decoSVG(x, w, pre) {
  const cx = (x.x * w).toFixed(1), cy = (x.y * w).toFixed(1);
  switch (x.t) {
    case "piedra": { const r = w * .12; return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="url(#${pre}gema)"/><path d="M0 ${-r} L${r * .5} 0 L0 ${r} L${-r * .5} 0Z" fill="#fff" opacity=".45"/><circle r="${r}" fill="none" stroke="#fff" stroke-width=".5" opacity=".8"/></g>`; }
    case "perla": { const r = w * .1; return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${pre}perla)"/>`; }
    case "estrella": { const r = w * .15, pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; pts.push((Math.cos(a) * rr).toFixed(1) + "," + (Math.sin(a) * rr).toFixed(1)); } return `<polygon transform="translate(${cx} ${cy})" points="${pts.join(" ")}" fill="url(#${pre}oro)"/>`; }
    case "corazon": { const s = w * .013; return `<path transform="translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(-12 -12)" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#D2394E"/>`; }
    case "flor": { const r = w * .07, p = []; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 - Math.PI / 2; p.push(`<circle cx="${(Math.cos(a) * r * 1.3).toFixed(1)}" cy="${(Math.sin(a) * r * 1.3).toFixed(1)}" r="${r.toFixed(2)}" fill="#fff"/>`); } return `<g transform="translate(${cx} ${cy})">${p.join("")}<circle r="${(r * .8).toFixed(2)}" fill="#E7B53C"/></g>`; }
    case "lamina": { const s = w * .2; return `<path transform="translate(${cx} ${cy})" d="M${-s} ${-s * .2} L${-s * .3} ${-s * .9} L${s * .5} ${-s * .6} L${s * .9} ${s * .2} L${s * .1} ${s * .7} L${-s * .6} ${s * .5}Z" fill="url(#${pre}oro)" opacity=".92"/>`; }
  }
  return "";
}
/* SVG completo: manos o pies */
function manoSVG(d0, o = {}) {
  const d = disenoCompleto(d0); if (o.pies === true && d.modo !== "pies") { d.modo = "pies"; d.forma = "cuadrada"; d.largo = "corto"; }
  const modo = d.modo, pre = (o.id || "m") + (++svgN) + "_", dedos = DEDOS[modo];
  const tam = o.tam || 200, inter = !!o.interactivo, f = n => (+n).toFixed(1);
  let defs = `<radialGradient id="${pre}gema" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#E4ECF5"/><stop offset="1" stop-color="#9FB0C4"/></radialGradient>
    <radialGradient id="${pre}perla" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#F3ECE6"/><stop offset="1" stop-color="#CFC3B8"/></radialGradient>
    <linearGradient id="${pre}oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E3A1"/><stop offset=".5" stop-color="#C9A24A"/><stop offset="1" stop-color="#8E6A1E"/></linearGradient>
    <pattern id="${pre}glit" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#fff" opacity=".9"/><circle cx="4" cy="3" r=".55" fill="#F7E3A1"/><circle cx="2.5" cy="5" r=".45" fill="#fff" opacity=".7"/><circle cx="5" cy="5.5" r=".35" fill="#E9D9FF"/></pattern>
    <linearGradient id="${pre}vol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".48" stop-color="#fff" stop-opacity=".12"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    <radialGradient id="${pre}suelo"><stop offset="0" stop-color="#3A2418" stop-opacity=".16"/><stop offset="1" stop-color="#3A2418" stop-opacity="0"/></radialGradient>
    <filter id="${pre}sombra" x="-40%" y="-20%" width="180%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#3A2418" flood-opacity=".22"/></filter>`;
  const unas = []; let arriba = 999;
  dedos.forEach((p, i) => {
    const w = p.w, hb = p.hb;
    const L = largoDe(w, d.forma, d.largo, modo), c = capasUna(d.unas[i], w, L, hb, pre, i, d.forma);
    arriba = Math.min(arriba, p.y - (hb + L) * Math.cos(p.rot * Math.PI / 180) - 14);
    defs += c.defs;
    const sel = inter && o.sel === i;
    unas.push(`<g class="una ${sel ? "sel" : ""}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.rot)})" ${inter ? `data-a="estUna" data-i="${i}" role="button" tabindex="0" aria-label="${NOMBRES_DEDO[modo][i]}"` : ""}>
      <g filter="url(#${pre}sombra)">${c.html}</g><path d="${c.path}" fill="url(#${pre}vol)" clip-path="url(#${pre}c${i})" style="pointer-events:none"/>
      ${inter ? `<path class="aro" d="${c.path}" fill="none" stroke="var(--acento)" stroke-width="2.6" transform="scale(1.08)"/><path d="${c.path}" fill="transparent" stroke="transparent" stroke-width="10"/>` : ""}</g>`);
  });
  const base = modo === "manos" ? 300 : 266, x0 = modo === "manos" ? 8 : 22, vw = modo === "manos" ? 414 : 350;
  const top = Math.min(arriba, modo === "manos" ? 150 : 170), vh = base + 16 - top, vb = `${x0} ${f(top)} ${vw} ${f(vh)}`, alto = vh / vw;
  return `<svg class="mano-svg set ${inter ? "inter" : ""}" viewBox="${vb}" width="${tam}" height="${Math.round(tam * alto)}" role="img" aria-label="Diseño de uñas ${modo === "pies" ? "de pies" : "de manos"}"><defs>${defs}</defs><ellipse cx="215" cy="${base}" rx="190" ry="10" fill="url(#${pre}suelo)"/><g class="unas">${unas.join("")}</g></svg>`;
}
/* uña suelta para botones del panel */
function miniUna(u, forma = "almendra", largo = "medio", tam = 30) {
  const pre = "n" + (++svgN) + "_", w = 22, hb = 23, L = largoDe(w, forma, largo, "manos"), c = capasUna(Object.assign(unaBase(), u), w, L, hb, pre, 0, forma);
  const H = hb + L + 12;
  return `<svg viewBox="${-16} ${-(hb + L) - 3} 32 ${H}" width="${tam}" height="${Math.round(tam * H / 32)}" aria-hidden="true"><defs>${c.defs}<pattern id="${pre}glit" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#fff"/><circle cx="3.5" cy="3" r=".5" fill="#F7E3A1"/></pattern><radialGradient id="${pre}gema" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9FB0C4"/></radialGradient><radialGradient id="${pre}perla" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#CFC3B8"/></radialGradient><linearGradient id="${pre}oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E3A1"/><stop offset="1" stop-color="#8E6A1E"/></linearGradient></defs>${c.html}</svg>`;
}

/* ============================================================
   Pantalla del estudio  #/disenar[/cita/COD | /preset/ID | /reserva]
   ============================================================ */
function prepEstudio(p) {
  const key = p.join("/");
  if (ui.estudio && ui.estudio.key === key) return ui.estudio;
  let d = null, origen = { tipo: p[0] || "libre", ref: p[1] || null };
  if (p[0] === "cita") { const c = citaPorCodigo(p[1]); if (c && c.diseno) d = disenoCompleto(c.diseno); else if (c) d = disenoVacio(c.items.some(i => serv(i.servicio_id).pies) ? "pies" : "manos"); }
  else if (p[0] === "preset") d = disenoCompleto({ preset: p[1] });
  else if (p[0] === "reserva" && ui.borrador.diseno) d = disenoCompleto(ui.borrador.diseno);
  else if (p[0] === "guardado") { const g = db.obtener("disenos", p[1]); if (g) d = disenoCompleto(g.d); }
  d = d || disenoCompleto({ preset: "aura-rosa" });
  const otro = d.modo === "manos" ? "pies" : "manos";
  ui.estudio = { key, d, otros: { [otro]: disenoVacio(otro) }, sel: null, tab: "color", herr: null, hist: [], fut: [], origen };
  return ui.estudio;
}
const E = () => ui.estudio;
function cambiarDiseno(fn, pintarTodo = false) {
  const e = E(); e.hist.push(JSON.stringify(e.d)); if (e.hist.length > 50) e.hist.shift(); e.fut = [];
  fn(e.d); pintarEstudio(pintarTodo);
}
const objetivo = () => { const e = E(); return e.sel === null ? e.d.unas : [e.d.unas[e.sel]]; };

VISTAS.disenar = p => {
  const e = prepEstudio(p), o = e.origen;
  const volver = o.tipo === "cita" ? "#/mi-cita/" + o.ref : o.tipo === "reserva" ? "#/reservar" : "#/";
  return `<header class="top"><div class="top-in">
      <a class="btn btn-t btn-i" href="${volver}" aria-label="Volver">${ic("chev-l")}</a>
      <div class="est-tit"><b>Estudio de uñas</b><small>${esc(MARCA.nombre)}</small></div><span class="esp"></span>
      <button class="btn btn-t btn-i" data-a="estUndo" id="estUndo" aria-label="Deshacer">${ic("undo")}</button>
      <button class="btn btn-t btn-i" data-a="estRedo" id="estRedo" aria-label="Rehacer">${ic("redo")}</button>
      <button class="btn btn-s btn-ch" data-a="estCompartir">${ic("share")}<span class="solo-anc">Compartir</span></button>
    </div></header>
    <main class="estudio">
      <section class="lienzo rev">
        <div class="lienzo-top">${seg("estModo", [["manos", "Manos", "hand"], ["pies", "Pies", "foot"]], e.d.modo, "estModo")}</div>
        <div id="mano" class="mano-wrap"></div>
        <div class="lienzo-pie" id="estSel"></div>
      </section>
      <section class="panel rev" style="--i:1">
        <div class="tabs6" role="tablist">${[["ideas", "Ideas", "sparkles"], ["forma", "Forma", "hand"], ["color", "Color", "palette"], ["acabado", "Acabado", "drop"], ["arte", "Arte", "wand"], ["deco", "Decorar", "gem"]].map(([k, t, i]) => `<button role="tab" data-a="estTab" data-v="${k}" class="${e.tab === k ? "on" : ""}" aria-selected="${e.tab === k}">${ic(i)}<span>${t}</span></button>`).join("")}</div>
        <div id="estPanel" class="est-panel"></div>
        <div id="estPrecio" class="card est-precio"></div>
      </section>
    </main>`;
};
CLASE_RUTA.disenar = "estudio-body";
DESPUES.disenar = () => pintarEstudio(true);

function pintarEstudio(todo = true) {
  const e = E(); if (!e || !$("#mano")) return;
  $("#mano").innerHTML = manoSVG(e.d, { tam: 420, interactivo: true, sel: e.sel, id: "est" });
  const svg = $("#mano svg"); if (svg && e._pop) { svg.classList.add("pop"); e._pop = false; }
  $("#estSel").innerHTML = e.herr
    ? `<span class="chip listo">${ic("gem")} Toca una uña para poner ${esc((DECOS.find(x => x[0] === e.herr) || ["", ""])[1].toLowerCase())}</span><button class="btn btn-t btn-ch" data-a="estDeco" data-v="${e.herr}">Listo</button>`
    : e.sel === null ? `<span class="chip">${ic("hand")} Todas las uñas</span><span class="tenue small">Toca una uña para cambiar solo esa</span>`
      : `<span class="chip listo">${esc(NOMBRES_DEDO[e.d.modo][e.sel])}</span><button class="btn btn-s btn-ch" data-a="estTodas">Todas las uñas</button>`;
  if (todo) {
    $$(".tabs6 button").forEach(b => { b.classList.toggle("on", b.dataset.v === e.tab); b.setAttribute("aria-selected", b.dataset.v === e.tab); });
    $("#estPanel").innerHTML = panelEstudio();
    $$(".seg [data-a=estModo]").forEach(b => b.classList.toggle("on", b.dataset.v === e.d.modo));
    $$(".piel").forEach(b => b.classList.toggle("on", +b.dataset.v === e.d.piel));
  } else {
    $$("#estPanel [data-on]").forEach(b => b.classList.toggle("on", b.dataset.on === "1"));
  }
  $("#estUndo").disabled = !e.hist.length; $("#estRedo").disabled = !e.fut.length;
  const arte = precioDiseno(e.d), base = e.d.modo === "pies" ? serv("s07") : serv(["largo", "xl"].includes(e.d.largo) ? "s03" : "s02");
  const o = e.origen, txt = o.tipo === "cita" ? "Guardar en mi cita" : o.tipo === "reserva" ? "Usar en mi reserva" : "Reservar con este diseño";
  $("#estPrecio").innerHTML = `<div class="fila"><div class="esp"><small class="tenue">${esc(base.nombre)} + arte</small>
      <div class="est-total"><b class="num">${Q(base.precio + arte)}</b><span class="tenue small">· ${durTxt(base.dur + minutosDiseno(e.d))}</span></div>
      <small class="tenue">Arte: ${arte ? Q(arte) : "sin costo extra"}</small></div>
      <button class="btn btn-t btn-i" data-a="estMateriales" aria-label="Ver detalle">${ic("list")}</button></div>
    <div class="fila mt"><button class="btn btn-s" data-a="estGuardar">${ic("heart")}<span>Guardar</span></button><button class="btn btn-p esp" data-a="estUsar">${txt}${ic("arrow-r")}</button></div>`;
}
function panelEstudio() {
  const e = E(), d = e.d, obj = objetivo(), u = obj[0];
  const on = c => c ? 'data-on="1" class="on"' : 'data-on="0"';
  if (e.tab === "ideas") {
    const mios = db.listar("disenos").slice(-6).reverse();
    return `<div class="ideas">${LOOKBOOK.map(l => `<button class="idea" data-a="estPreset" data-v="${l.id}">${manoSVG({ preset: l.id }, { tam: 110 })}<b>${esc(l.nombre)}</b></button>`).join("")}</div>
      ${mios.length ? `<p class="eyebrow mt">Mis diseños</p><div class="ideas">${mios.map(m => `<button class="idea" data-a="estCargar" data-v="${m.id}">${manoSVG(m.d, { tam: 110 })}<b>${esc(m.nombre)}</b></button>`).join("")}</div>` : ""}`;
  }
  if (e.tab === "forma") {
    const largos = d.modo === "pies" ? LARGOS.slice(0, 2) : LARGOS;
    return `<p class="eyebrow">Forma</p><div class="opciones o6">${FORMAS.map(([k, t]) => `<button ${on(d.forma === k)} data-a="estForma" data-v="${k}">${miniUna({ color: u.color }, k, "largo", 26)}<span>${t}</span></button>`).join("")}</div>
      <p class="eyebrow mt">Largo</p>${seg("estLargo", largos.map(([k, t]) => [k, t]), d.largo, "estLargo")}
      ${d.modo === "pies" ? `<p class="tenue small mt">En pies se trabaja corto para que sea cómodo.</p>` : ""}`;
  }
  if (e.tab === "color") {
    return `<div class="fila"><p class="eyebrow esp" style="margin:0">Colores de la casa</p><label class="otro-color">${ic("plus")}<span>Otro</span><input type="color" data-i="estColorLibre" data-solo="change" value="${u.color}" aria-label="Escoger otro color"></label></div>
      <div class="swatches">${db.listar("esmaltes").map(x => `<button class="sw ${x.stock <= 0 ? "agotado" : ""}" style="--c:${x.hex}" ${on(obj.every(n => n.color.toLowerCase() === x.hex.toLowerCase()))} data-a="estColor" data-v="${x.id}" aria-label="${esc(x.nombre)}" title="${esc(x.nombre)}"><i></i><span>${esc(x.nombre)}</span></button>`).join("")}</div>`;
  }
  if (e.tab === "acabado") return `<p class="eyebrow">Acabado</p><div class="opciones o6">${ACABADOS.map(([k, t, q]) => `<button ${on(obj.every(n => n.acabado === k))} data-a="estAcabado" data-v="${k}">${miniUna({ color: u.color, acabado: k }, d.forma, "largo", 26)}<span>${t}</span>${q ? `<small>+${Q(q)}</small>` : ""}</button>`).join("")}</div>`;
  if (e.tab === "arte") return `<p class="eyebrow">Técnica</p><div class="opciones o9">${TECNICAS.map(([k, t, q]) => `<button ${on(obj.every(n => n.tecnica === k))} data-a="estTecnica" data-v="${k}">${miniUna({ color: u.color, tecnica: k, punta: u.tecnica === "ninguna" ? (claro(u.color) ? "#FBFBF9" : "#C9A24A") : u.punta }, d.forma, "largo", 24)}<span>${t}</span>${q ? `<small>+${Q(q)}</small>` : ""}</button>`).join("")}</div>
      <p class="eyebrow mt">Color del detalle</p><div class="puntas">${PUNTAS.map(c => `<button class="sw sw-s" style="--c:${c}" ${on(obj.every(n => n.punta === c))} data-a="estPunta" data-v="${c}" aria-label="Color ${c}"><i></i></button>`).join("")}</div>`;
  if (e.tab === "deco") return `<p class="eyebrow">Escoge y toca la uña</p><div class="opciones o6">${DECOS.map(([k, t, q]) => `<button ${on(e.herr === k)} data-a="estDeco" data-v="${k}"><span class="deco-ic">${decoIcono(k)}</span><span>${t}</span><small>+${Q(q)}</small></button>`).join("")}</div>
      <div class="fila mt"><button class="btn btn-s btn-ch" data-a="estQuitarDeco">${ic("eraser")}<span>${e.sel === null ? "Quitar todas" : "Quitar de esta uña"}</span></button></div>`;
  return "";
}
function decoIcono(k) { const pre = "d" + (++svgN) + "_"; return `<svg viewBox="-12 -12 24 24" width="26" height="26" aria-hidden="true"><defs><radialGradient id="${pre}gema" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9FB0C4"/></radialGradient><radialGradient id="${pre}perla" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#CFC3B8"/></radialGradient><linearGradient id="${pre}oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E3A1"/><stop offset="1" stop-color="#8E6A1E"/></linearGradient></defs><rect x="-12" y="-12" width="24" height="24" rx="7" fill="${k === "flor" ? "#F2C6CF" : "#2A2622"}"/>${decoSVG({ t: k, x: 0, y: 0 }, 60, pre)}</svg>`; }

/* acciones del estudio */
A.estTab = el => { E().tab = el.dataset.v; if (el.dataset.v !== "deco") E().herr = null; pintarEstudio(true); };
A.estModo = el => {
  const e = E(), m = el.dataset.v; if (e.d.modo === m) return;
  e.otros[e.d.modo] = e.d; e.d = e.otros[m] || disenoVacio(m); e.d.piel = e.otros[e.d.modo === "manos" ? "pies" : "manos"].piel; e.sel = null; e.hist = []; e.fut = []; e._pop = true; pintarEstudio(true);
};
A.estPiel = el => cambiarDiseno(d => { d.piel = +el.dataset.v; });
A.estForma = el => { E()._pop = true; cambiarDiseno(d => { d.forma = el.dataset.v; }, true); };
A.estLargo = el => { E()._pop = true; cambiarDiseno(d => { d.largo = el.dataset.v; }, true); };
A.estColor = el => {
  const x = esmalte(el.dataset.v); if (!x) return;
  if (x.stock <= 0) toast(x.nombre + " está agotado: lo pedimos para tu cita", "alert");
  cambiarDiseno(() => objetivo().forEach(u => { u.color = x.hex; u.esmalte_id = x.id; }), true);
};
I.estColorLibre = el => cambiarDiseno(() => objetivo().forEach(u => { u.color = el.value; u.esmalte_id = null; }), true);
A.estAcabado = el => cambiarDiseno(() => objetivo().forEach(u => { u.acabado = el.dataset.v; }), true);
A.estTecnica = el => cambiarDiseno(() => objetivo().forEach(u => { if (u.tecnica === "ninguna" && el.dataset.v !== "ninguna" && u.punta === "#FBFBF9" && claro(u.color)) u.punta = ["frances", "baby"].includes(el.dataset.v) ? "#FBFBF9" : "#C9A24A"; u.tecnica = el.dataset.v; }), true);
A.estPunta = el => cambiarDiseno(() => objetivo().forEach(u => { u.punta = el.dataset.v; if (u.tecnica === "ninguna") u.tecnica = "frances"; }), true);
A.estDeco = el => { const e = E(); e.herr = e.herr === el.dataset.v ? null : el.dataset.v; pintarEstudio(true); };
A.estQuitarDeco = () => cambiarDiseno(() => objetivo().forEach(u => { u.deco = []; }), true);
A.estTodas = () => { E().sel = null; pintarEstudio(true); };
A.estUna = (el, ev) => {
  const e = E(), i = +el.dataset.i;
  if (e.herr) {
    let x = 0, y = -.6;
    if (ev && ev.clientX !== undefined && el.getScreenCTM) { const svg = el.ownerSVGElement, pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const loc = pt.matrixTransform(el.getScreenCTM().inverse()); const w = DEDOS[e.d.modo][i].w; x = clamp(loc.x / w, -.38, .38); y = clamp(loc.y / w, -2.4, .05); }
    cambiarDiseno(d => { const u = d.unas[i]; if (u.deco.length >= 8) { toast("Máximo 8 decoraciones por uña", "alert"); return; } u.deco.push({ t: e.herr, x: +x.toFixed(2), y: +y.toFixed(2) }); });
    return;
  }
  e.sel = e.sel === i ? null : i; pintarEstudio(true);
};
A.estUndo = () => { const e = E(); if (!e.hist.length) return; e.fut.push(JSON.stringify(e.d)); e.d = JSON.parse(e.hist.pop()); pintarEstudio(true); };
A.estRedo = () => { const e = E(); if (!e.fut.length) return; e.hist.push(JSON.stringify(e.d)); e.d = JSON.parse(e.fut.pop()); pintarEstudio(true); };
A.estPreset = el => { const p = LOOKBOOK.find(x => x.id === el.dataset.v); const modo = E().d.modo; E()._pop = true; cambiarDiseno(d => { const n = disenoCompleto({ preset: p.id, pies: modo === "pies" }); n.piel = d.piel; Object.assign(d, n); }, true); E().sel = null; toast(p.nombre); };
A.estCargar = el => { const g = db.obtener("disenos", el.dataset.v); if (!g) return; E()._pop = true; cambiarDiseno(d => Object.assign(d, disenoCompleto(g.d)), true); };
A.estMateriales = () => abrir("materiales", { d: E().d });
MODALES.materiales = m => `${cab("Detalle del diseño", "Lo que verá tu manicurista")}<div class="modal-c">
  <div class="mat-mano">${manoSVG(m.d, { tam: 220 })}</div>
  <div class="lista">${materiales(m.d).map(x => `<div class="row"><div class="row-t"><b>${esc(x.t)}</b></div>${x.n ? `<span class="tenue small">${esc(x.n)}</span>` : ""}</div>`).join("")}</div>
  <p class="tenue small mt">Arte: ${Q(precioDiseno(m.d))} · tiempo extra aprox. ${durTxt(minutosDiseno(m.d))}</p></div>`;
A.estGuardar = () => {
  const e = E(); const n = db.listar("disenos").length + 1;
  db.insertar("disenos", { nombre: "Mi diseño " + n, d: JSON.parse(JSON.stringify(e.d)), fecha: Date.now() });
  toast("Guardado en Mis diseños", "heart");
};
A.estUsar = () => {
  const e = E(), o = e.origen, d = JSON.parse(JSON.stringify(e.d));
  d.precio = precioDiseno(d);
  if (o.tipo === "cita") {
    const c = citaPorCodigo(o.ref); if (!c) { toast("No encontramos la cita", "alert", "malo"); return; }
    c.diseno = d; const it = c.items.find(i => serv(i.servicio_id).diseno) || c.items[0]; c.items.forEach(i => delete i.arte); it.arte = d.precio;
    db.cambio(); toast("Diseño guardado en tu cita"); location.hash = "#/mi-cita/" + c.codigo; return;
  }
  ui.borrador.diseno = d;
  const s = d.modo === "pies" ? "s07" : ["largo", "xl"].includes(d.largo) ? "s03" : "s02";
  const r = ui.borrador.reserva = ui.borrador.reserva || { servs: [], paso: 1 };
  if (!r.servs.some(x => serv(x).diseno)) r.servs.push(s);
  guardarUI(); toast("Diseño listo para tu cita"); location.hash = "#/reservar";
};
A.estCompartir = async () => {
  const e = E();
  try {
    const blob = await imagenDiseno(e.d);
    const file = new File([blob], "mi-diseno.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Mi diseño · " + MARCA.nombre }); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mi-diseno.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 800);
    toast("Imagen descargada", "download");
  } catch (err) { if (err && err.name !== "AbortError") toast("No se pudo crear la imagen", "alert", "malo"); }
};
/* imagen PNG del diseño con la marca */
function imagenDiseno(d) {
  return new Promise((res, rej) => {
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement), col = n => css.getPropertyValue("--" + n).trim();
    g.fillStyle = col("fondo") || "#FAF7F2"; g.fillRect(0, 0, W, H);
    const svg = manoSVG(d, { tam: 760 }).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    const img = new Image();
    img.onload = () => {
      g.drawImage(img, (W - img.width) / 2, 170);
      g.fillStyle = col("tinta") || "#1C1A17"; g.textAlign = "center";
      g.font = `500 64px ${MARCA.fuentes.titulo}, Georgia, serif`; g.fillText(MARCA.nombre, W / 2, 110);
      g.font = `600 30px ${MARCA.fuentes.texto}, sans-serif`; g.fillStyle = col("tinta2") || "#5E574F";
      const f = FORMAS.find(x => x[0] === d.forma), l = LARGOS.find(x => x[0] === d.largo);
      g.fillText(`${f ? f[1] : ""} · ${l ? l[1] : ""} · arte ${Q(precioDiseno(d))}`, W / 2, H - 120);
      g.font = `600 24px ${MARCA.fuentes.texto}, sans-serif`; g.fillStyle = col("acento-texto") || "#8A6A3E";
      g.fillText("MI DISEÑO · " + (MARCA.instagram ? "@" + MARCA.instagram : ""), W / 2, H - 70);
      cv.toBlob(b => b ? res(b) : rej(new Error("sin imagen")), "image/png");
    };
    img.onerror = rej;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}
document.addEventListener("keydown", ev => {
  if (ruta().r !== "disenar" || ui.pila.length || ev.target.matches("input,textarea")) return;
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); ev.shiftKey ? A.estRedo() : A.estUndo(); }
});
