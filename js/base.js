"use strict";
/* ============================================================
   Utilidades, iconos, avisos, ventanas apiladas, rutas y acciones.
   Contrato para todas las pantallas:
   - VISTAS[ruta] = p => html        (p = partes de la ruta después del nombre)
   - ROL_DE[ruta] = "recepcion" | "estilista" | "admin"   (pide PIN)
   - A[nombre](el, ev)  ← clic en [data-a="nombre"]
   - F[nombre](form, datos, ev) ← submit de form[data-f="nombre"]
   - I[nombre](el, ev)  ← input/change en [data-i="nombre"]
   - MODALES[tipo] = m => html; abrir(tipo, datos); cerrar()
   - DESPUES[ruta]() y MODAL_DESPUES[tipo](m) corren tras pintar
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const sum = (a, f = x => x) => a.reduce((s, x) => s + (+f(x) || 0), 0);
const r2 = n => Math.round((+n || 0) * 100) / 100;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const MIN = 60000, HORA = 3600000, DIA = 86400000;
const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- formatos ---------- */
const Q = n => {
  n = r2(n); const dec = Math.abs(n % 1) > 0.001;
  return (n < 0 ? "−" : "") + "Q" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: 2 });
};
const dia0 = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_C = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function hora(t) { const d = new Date(t), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + (h < 12 ? " a. m." : " p. m."); }
const horaMin = min => hora(dia0() + min * MIN);
function fechaLarga(t) { const d = new Date(t); return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }
function fechaCorta(t) { const d = new Date(t); return DIAS_C[d.getDay()] + " " + d.getDate() + " " + MESES_C[d.getMonth()]; }
function diaRel(t) {
  const k = Math.round((dia0(t) - dia0()) / DIA);
  return k === 0 ? "Hoy" : k === 1 ? "Mañana" : k === -1 ? "Ayer" : fechaCorta(t);
}
function durTxt(min) { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; return h ? h + " h" + (m ? " " + m + " min" : "") : m + " min"; }
function haceTxt(t) { const m = Math.round((Date.now() - t) / MIN); return m < 1 ? "ahora" : m < 60 ? "hace " + m + " min" : "hace " + durTxt(m); }
function minTxt(t) { const m = Math.max(0, Math.round((Date.now() - t) / MIN)); return m < 60 ? m + " min" : durTxt(m); }
const cap = s => (s = String(s || "")) && s[0].toUpperCase() + s.slice(1);
const iniciales = n => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
const telFmt = t => String(t || "").replace(/\D/g, "").replace(/^502/, "").replace(/^(\d{4})(\d{4})$/, "$1-$2");
const waLink = (tel, texto) => "https://wa.me/" + (String(tel).replace(/\D/g, "").length === 8 ? "502" : "") + String(tel).replace(/\D/g, "") + "?text=" + encodeURIComponent(texto);
const urlBase = () => location.href.split("#")[0];

/* PRNG con semilla (datos de ejemplo siempre iguales) */
function azar(semilla) { let s = semilla >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- iconos (Lucide, ISC) ---------- */
const ICONOS = {
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "chev-r": '<path d="m9 18 6-6-6-6"/>', "chev-l": '<path d="m15 18-6-6 6-6"/>', "chev-d": '<path d="m6 9 6 6 6-6"/>',
  "arrow-r": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  timer: '<path d="M10 2h4"/><path d="m12 14 3-3"/><circle cx="12" cy="14" r="8"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  bank: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2 8 5H4z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  star: '<path d="M11.53 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.91l5.16-.75a2.12 2.12 0 0 0 1.6-1.16z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/>',
  tv: '<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  in: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.27-3.66a.5.5 0 0 1 .8.52l-2.83 10.24a1 1 0 0 1-.96.74H5.81a1 1 0 0 1-.96-.74L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.29z"/><path d="M5 21h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  foot: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  send: '<path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
  ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  list: '<path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>',
  menu: '<path d="M4 12h16M4 6h16M4 18h16"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
  wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  present: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  insta: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  move: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.56v16.16a.5.5 0 0 1-.62.49L5 19.4V5.56a2 2 0 0 1 1.51-1.94l4-1A2 2 0 0 1 13 4.56Z"/>'
};
const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ""}</svg>`;

/* ---------- logo ---------- */
function logo(tam = 40, anim = false) {
  const m = MARCA;
  if (m.logoSVG) return m.logoSVG(tam, anim);
  if (m.logoImg) return `<img class="logo-img" src="${m.logoImg}" alt="${esc(m.nombre)}" width="${tam}" height="${tam}" style="width:${tam}px;height:${tam}px">`;
  return `<svg class="logo ${anim ? "logo-anim" : ""}" width="${tam}" height="${tam}" viewBox="0 0 100 100" role="img" aria-label="${esc(m.nombre)}">
    <circle class="anillo a1" pathLength="100" cx="50" cy="50" r="46" fill="none" stroke="var(--acento)" stroke-width="1.4"/>
    <circle class="anillo a2" pathLength="100" cx="51.5" cy="49" r="42" fill="none" stroke="var(--acento)" stroke-width=".8" opacity=".7"/>
    <text class="logo-tx" x="50" y="58" text-anchor="middle" font-family="var(--f-titulo)" font-size="30" fill="var(--tinta)" letter-spacing="1">${esc(m.monograma)}</text>
  </svg>`;
}
const marcaBloque = (href = "#/") => `<a class="marca" href="${href}">${logo(38)}<span><b>${esc(MARCA.nombre)}</b><small>${esc(MARCA.lema)}</small></span></a>`;

/* ---------- avatar ---------- */
function avatar(p, tam = 36) {
  const PASTEL = ["#D7A6AE", "#C9A27E", "#A9BFA4", "#9FB7C9", "#B9A3C8", "#E3BE8F"];
  const color = p && typeof p.color === "string" ? p.color : p && p.nombre ? PASTEL[[...p.nombre].reduce((a, c) => a + c.charCodeAt(0), 0) % PASTEL.length] : "var(--nude)";
  return `<span class="av" style="--av:${color};width:${tam}px;height:${tam}px;font-size:${Math.round(tam * .36)}px" aria-hidden="true">${esc(iniciales(p && p.nombre))}</span>`;
}

/* ---------- QR ---------- */
function qrSVG(texto, color = "#1C1A17") {
  if (!window.qrcode) return "";
  const q = qrcode(0, "M"); q.addData(texto); q.make(); const n = q.getModuleCount(); let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="Código QR" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff" rx="2"/><path d="${d}" fill="${color}"/></svg>`;
}

/* ---------- avisos (toast) ---------- */
function toast(t, icono = "check", tipo = "") {
  const box = $("#avisos"); const el = document.createElement("div");
  el.className = "toast " + tipo; el.setAttribute("role", "status"); el.innerHTML = ic(icono) + `<span>${esc(t)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("sale"); setTimeout(() => el.remove(), 260); }, 2600);
}

/* ---------- estado de interfaz ---------- */
const ui = { pila: [], tabs: {}, filtros: {}, borrador: {}, rutaPrev: null, entra: true };
const guardarUI = () => { try { sessionStorage.setItem(MARCA.clave + ".ui", JSON.stringify({ tabs: ui.tabs, borrador: ui.borrador })); } catch (e) {} };
try { const g = JSON.parse(sessionStorage.getItem(MARCA.clave + ".ui") || "{}"); ui.tabs = g.tabs || {}; ui.borrador = g.borrador || {}; } catch (e) {}
const tab = (k, def) => ui.tabs[k] || def;

const sesion = {
  ok(rol) { try { return sessionStorage.getItem(MARCA.clave + ".pin." + rol) === "1"; } catch (e) { return false; } },
  entrar(rol) { try { sessionStorage.setItem(MARCA.clave + ".pin." + rol, "1"); } catch (e) {} },
  salir() { try { ["recepcion", "estilista", "admin"].forEach(r => sessionStorage.removeItem(MARCA.clave + ".pin." + r)); } catch (e) {} }
};

/* ---------- rutas y render ---------- */
const VISTAS = {}, ROL_DE = {}, A = {}, F = {}, I = {}, MODALES = {}, MODAL_DESPUES = {}, DESPUES = {}, CLASE_RUTA = {};
function ruta() { const h = location.hash.replace(/^#\/?/, ""); const [r, ...p] = h.split("/"); return { r: r || "", p: p.map(decodeURIComponent) }; }
let programado = false, pendiente = false;
function pedirRender(local = true) {
  if (!local) {
    const a = document.activeElement;
    if (a && a.matches && a.matches("input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select")) { pendiente = true; return; }
  }
  if (programado) return; programado = true;
  queueMicrotask(() => { programado = false; render(); });
}
document.addEventListener("focusout", () => { if (pendiente) setTimeout(() => { if (pendiente && !document.activeElement.matches("input,textarea,select")) { pendiente = false; render(); } }, 60); });

function render() {
  const { r, p } = ruta();
  const app = $("#app");
  const cambio = ui.rutaPrev !== location.hash;
  const scrolls = {}; $$("[data-scroll]", app).forEach(el => scrolls[el.dataset.scroll] = [el.scrollLeft, el.scrollTop]);
  const valores = {}; $$("input[id],textarea[id],select[id]", app).forEach(el => { if (el.dataset.libre !== "0") valores[el.id] = el.type === "checkbox" ? el.checked : el.value; });
  const foco = document.activeElement && document.activeElement.id;
  document.body.className = CLASE_RUTA[r] || "";
  const v = VISTAS[r] || VISTAS[""];
  app.innerHTML = ROL_DE[r] && !sesion.ok(ROL_DE[r]) ? vPin(ROL_DE[r]) : v(p);
  if (!cambio) {
    Object.entries(valores).forEach(([id, val]) => { const el = app.querySelector("#" + CSS.escape(id)); if (el && el.dataset.libre !== "0") { if (el.type === "checkbox") el.checked = val; else if (el.value !== val) el.value = val; } });
    $$("[data-scroll]", app).forEach(el => { const s = scrolls[el.dataset.scroll]; if (s) { el.scrollLeft = s[0]; el.scrollTop = s[1]; } });
    if (foco) { const f = document.getElementById(foco); f && f.focus && f.focus({ preventScroll: true }); }
  } else {
    app.classList.remove("entra"); void app.offsetWidth; app.classList.add("entra");
    clearTimeout(render._t); render._t = setTimeout(() => app.classList.remove("entra"), 1400);
    ui.rutaPrev = location.hash;
  }
  pintarQRs(app);
  DESPUES[r] && !(ROL_DE[r] && !sesion.ok(ROL_DE[r])) && DESPUES[r](p, cambio);
  renderModal();
}
function pintarQRs(raiz) { $$("[data-qr]", raiz).forEach(el => { if (!el.firstChild) el.innerHTML = qrSVG(el.dataset.qr); }); }

/* ---------- ventanas apiladas ---------- */
function renderModal() {
  const capa = $("#capa");
  const capas = $$(":scope > .velo", capa);
  // guardar valores por capa
  const valores = capas.map(c => { const v = {}; $$("input[id],textarea[id],select[id]", c).forEach(el => v[el.id] = el.type === "checkbox" ? el.checked : el.value); return v; });
  const scrolls = capas.map(c => { const m = $(".modal-c", c); return m ? m.scrollTop : 0; });
  if (!ui.pila.length) { capa.innerHTML = ""; document.body.classList.remove("con-modal"); return; }
  document.body.classList.add("con-modal");
  capa.innerHTML = ui.pila.map((m, i) => {
    const html = MODALES[m.tipo] ? MODALES[m.tipo](m) : "";
    const nuevo = !m._visto; m._visto = true;
    return `<div class="velo ${nuevo ? "nuevo" : ""} ${i < ui.pila.length - 1 ? "atras" : ""}" data-capa="${i}" style="z-index:${100 + i * 2}">
      <div class="modal ${m.ancho ? "modal-" + m.ancho : ""}" role="dialog" aria-modal="true" aria-labelledby="mt${i}">${html.replace('id="mtit"', `id="mt${i}"`)}</div></div>`;
  }).join("");
  $$(":scope > .velo", capa).forEach((c, i) => {
    const v = valores[i]; if (v) Object.entries(v).forEach(([id, val]) => { const el = c.querySelector("#" + CSS.escape(id)); if (el && el.dataset.libre !== "0") { if (el.type === "checkbox") el.checked = val; else el.value = val; } });
    const mc = $(".modal-c", c); if (mc && scrolls[i]) mc.scrollTop = scrolls[i];
  });
  pintarQRs(capa);
  const top = ui.pila[ui.pila.length - 1];
  if (top._enfocar !== false) { top._enfocar = false; setTimeout(() => { const c = capa.lastElementChild; const f = c && (c.querySelector("[autofocus]") || c.querySelector(".modal-h .btn")); f && f.focus({ preventScroll: true }); }, 40); }
  ui.pila.forEach(m => MODAL_DESPUES[m.tipo] && MODAL_DESPUES[m.tipo](m));
}
function abrir(tipo, datos = {}) { ui.pila.push(Object.assign({}, datos, { tipo })); renderModal(); }
function cerrar() {
  const capa = $("#capa"); const ult = capa.lastElementChild;
  if (!ui.pila.length) return;
  const m = ui.pila[ui.pila.length - 1];
  if (ult && !reducido()) {
    ult.classList.add("sale");
    setTimeout(() => { const i = ui.pila.indexOf(m); if (i >= 0) ui.pila.splice(i, 1); renderModal(); }, 190);
  } else { ui.pila.pop(); renderModal(); }
  m.alCerrar && m.alCerrar();
}
const cerrarTodo = () => { ui.pila = []; renderModal(); };
const modalTop = () => ui.pila[ui.pila.length - 1];
const cab = (t, sub = "", extra = "") => `<div class="modal-h"><div class="modal-ht"><h2 id="mtit">${t}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${extra}<button class="btn btn-t btn-i" data-a="cerrar" aria-label="Cerrar">${ic("x")}</button></div>`;

/* confirmación propia (nunca confirm()) */
MODALES.confirmar = m => `${cab(m.titulo, "")}<div class="modal-c"><p class="tx2">${m.texto || ""}</p></div>
  <div class="modal-p"><button class="btn btn-s" data-a="cerrar">${m.no || "Cancelar"}</button><button class="btn ${m.peligro ? "btn-peligro" : "btn-p"}" data-a="confirmarSi" autofocus>${m.si || "Aceptar"}</button></div>`;
function confirmar(o) { return new Promise(res => { abrir("confirmar", Object.assign({ alCerrar: () => res(false) }, o, { _res: res })); }); }
A.confirmarSi = () => { const m = modalTop(); m.alCerrar = null; cerrar(); m._res(true); };
A.cerrar = () => cerrar();

/* ---------- eventos globales ---------- */
document.addEventListener("click", ev => {
  const velo = ev.target.classList && ev.target.classList.contains("velo") ? ev.target : null;
  if (velo && +velo.dataset.capa === ui.pila.length - 1) { cerrar(); return; }
  const el = ev.target.closest("[data-a]"); if (!el || el.disabled) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === "A" && !el.getAttribute("href")) ev.preventDefault();
  if (el.tagName === "BUTTON" || el.dataset.prev !== undefined) ev.preventDefault();
  fn(el, ev);
});
document.addEventListener("submit", ev => {
  const f = ev.target.closest("form[data-f]"); if (!f) return; ev.preventDefault();
  const fn = F[f.dataset.f]; if (!fn) return;
  fn(f, Object.fromEntries(new FormData(f).entries()), ev);
});
["input", "change"].forEach(t => document.addEventListener(t, ev => {
  const el = ev.target.closest("[data-i]"); if (!el) return;
  if (t === "change" && el.dataset.solo !== "change" && el.matches("input[type=text],input[type=search],input:not([type]),textarea")) return;
  if (t === "input" && el.dataset.solo === "change") return;
  const fn = I[el.dataset.i]; fn && fn(el, ev);
}));
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && ui.pila.length) { ev.preventDefault(); cerrar(); }
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches("[data-a]:not(button):not(a):not(input)")) { ev.preventDefault(); ev.target.click(); }
});
window.addEventListener("hashchange", () => { cerrarTodo(); render(); window.scrollTo(0, 0); });

/* ---------- piezas comunes de interfaz ---------- */
const seg = (clave, opciones, actual, accion = "tab", cls = "") => `<div class="seg ${cls}" role="tablist">${opciones.map(([k, t, i]) => `<button role="tab" aria-selected="${actual === k}" class="${actual === k ? "on" : ""}" data-a="${accion}" data-k="${clave}" data-v="${k}">${i ? ic(i) : ""}<span>${t}</span></button>`).join("")}</div>`;
A.tab = el => { ui.tabs[el.dataset.k] = el.dataset.v; guardarUI(); render(); };
const vacio = (texto, boton = "") => `<div class="vacio">${ic("sparkles")}<p>${texto}</p>${boton}</div>`;
const chip = (t, cls = "") => `<span class="chip ${cls}">${t}</span>`;
const campo = (etq, html, ayuda = "") => `<label class="campo"><span>${etq}</span>${html}${ayuda ? `<small>${ayuda}</small>` : ""}</label>`;

/* barra del personal */
function barraStaff(activa) {
  const it = [["recepcion", "Recepción", "grid"], ["estilista", "Estilista", "scissors"], ["admin", "Administración", "sliders"]];
  return `<header class="top"><div class="top-in">${marcaBloque("#/demo")}<span class="esp"></span>
    <nav class="staff-nav" aria-label="Áreas">${it.map(([k, t, i]) => `<a href="#/${k}" class="${activa === k ? "on" : ""}" ${activa === k ? 'aria-current="page"' : ""}>${ic(i)}<span>${t}</span></a>`).join("")}</nav>
    <a class="btn btn-t btn-i" href="#/" aria-label="Ver la página del salón" title="Página del salón">${ic("home")}</a></div></header>`;
}
function vPin(rol) {
  const nom = { recepcion: "Recepción", estilista: "Estilista", admin: "Administración" }[rol];
  return `${barraStaff(rol)}<main class="cont" style="max-width:420px">
    <form class="card pin-card rev" data-f="pin" data-rol="${rol}">
      <span class="pin-ic">${ic("lock")}</span>
      <h1 class="h2">${nom}</h1>
      <p class="tx2">Escribe tu PIN para entrar</p>
      <input class="inp pin-inp" id="pin" name="pin" inputmode="numeric" autocomplete="off" maxlength="6" autofocus aria-label="PIN">
      <button class="btn btn-p btn-b">Entrar</button>
      <p class="tenue small">PIN de demo: <b>${cfg().pins[rol]}</b></p>
    </form></main>`;
}
F.pin = (f, d) => {
  const rol = f.dataset.rol;
  if (String(d.pin).trim() === cfg().pins[rol]) { sesion.entrar(rol); render(); }
  else { toast("PIN incorrecto", "alert", "malo"); const i = $("#pin"); i.value = ""; i.classList.remove("tiembla"); void i.offsetWidth; i.classList.add("tiembla"); }
};

/* descargar un archivo de texto (CSV) */
function descargar(nombre, texto, tipo = "text/csv;charset=utf-8") {
  const b = new Blob(["﻿" + texto], { type: tipo }); const a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const csv = filas => filas.map(f => f.map(v => /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n");

/* números que suben al aparecer */
function contarArriba(raiz = document) {
  if (reducido()) return;
  $$("[data-cuenta]", raiz).forEach(el => {
    if (el._contado) return; el._contado = true;
    const fin = +el.dataset.cuenta, fmt = el.dataset.fmt === "q" ? Q : n => Math.round(n).toLocaleString("en-US");
    const t0 = performance.now(), dur = 700;
    const paso = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(fin * e); if (k < 1) requestAnimationFrame(paso); else el.textContent = fmt(fin); };
    requestAnimationFrame(paso);
  });
}
