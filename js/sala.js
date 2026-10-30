"use strict";
/* ============================================================
   Demo (entrada por rol), modo presentación y TV de la sala.
   ============================================================ */
CLASE_RUTA.demo = "demo-p"; CLASE_RUTA.presentar = "presentar"; CLASE_RUTA.sala = "sala";

/* =================== ENTRADA DE LA DEMO =================== */
VISTAS.demo = () => {
  const cs = citasDia(), ventas = sum(db.listar("pagos", p => p.fecha >= dia0()), p => p.total);
  const enSalon = cs.filter(c => ["llego", "en_servicio", "terminada"].includes(c.estado)).length;
  const pins = cfg().pins;
  const pase = db.listar("citas", c => c.ini > Date.now() && ["reservada", "confirmada"].includes(c.estado)).sort((a, b) => a.ini - b.ini)[0];
  const tarjeta = (href, icono, titulo, sub, extra = "", i = 0, cls = "") => `<a class="demo-card card click rev ${cls}" href="${href}" style="--i:${i}"><span class="demo-ic">${ic(icono)}</span><span class="demo-tx"><b>${titulo}</b><small>${sub}</small></span>${extra}${ic("arrow-r", "demo-fl")}</a>`;
  return `<header class="top"><div class="top-in">${marcaBloque("#/")}<span class="esp"></span><a class="btn btn-s btn-ch" href="#/">${ic("home")}<span>Página del salón</span></a></div></header>
  <main class="cont demo">
    <section class="demo-hero rev">
      <div class="demo-logo">${logo(88, true)}</div>
      <p class="eyebrow">Demo del sistema</p>
      <h1 class="h1">Todo el salón,<br><em>en un solo lugar.</em></h1>
      <p class="tx2 demo-lead">Reservas en línea, recepción en vivo, el estudio de uñas y las cuentas del mes. Elige una pantalla.</p>
    </section>
    <div class="g4 demo-kpis">
      <div class="card kpi rev" style="--i:1"><small>Citas de hoy</small><b data-cuenta="${cs.length}">${cs.length}</b></div>
      <div class="card kpi rev" style="--i:2"><small>En el salón ahora</small><b data-cuenta="${enSalon}">${enSalon}</b></div>
      <div class="card kpi rev" style="--i:3"><small>Vendido hoy</small><b data-cuenta="${ventas}" data-fmt="q">${Q(ventas)}</b></div>
      <div class="card kpi rev" style="--i:4"><small>Clientas</small><b data-cuenta="${db.d.clientas.length}">${db.d.clientas.length}</b></div>
    </div>
    <h2 class="demo-sub rev">El equipo</h2>
    <div class="g3">
      ${tarjeta("#/recepcion", "grid", "Recepción", "Llegadas, agenda del día y cobro", `<span class="chip">PIN ${pins.recepcion}</span>`, 5)}
      ${tarjeta("#/estilista", "scissors", "Estilista", "Sus citas, la ficha y sus comisiones", `<span class="chip">PIN ${pins.estilista}</span>`, 6)}
      ${tarjeta("#/admin", "sliders", "Administración", "Reportes, personal, inventario y más", `<span class="chip">PIN ${pins.admin}</span>`, 7)}
    </div>
    <h2 class="demo-sub rev">La clienta</h2>
    <div class="g3">
      ${tarjeta("#/", "home", "Página del salón", "Servicios, lookbook y reserva en línea", "", 8)}
      ${tarjeta("#/disenar", "hand", "Estudio de uñas", "Diseña tus uñas uña por uña", `<span class="chip oro">${ic("sparkles")}Nuevo</span>`, 9, "demo-estrella")}
      ${pase ? tarjeta("#/mi-cita/" + pase.codigo, "qr", "Pase de cita", "Confirmar, mover o cancelar", "", 10) : tarjeta("#/reservar", "cal", "Reservar", "En tres pasos", "", 10)}
    </div>
    <h2 class="demo-sub rev">Para presentar</h2>
    <div class="g3">
      ${tarjeta("#/presentar", "present", "Modo presentación", "La clienta, la recepción y la estilista al mismo tiempo", "", 11, "demo-osc")}
      ${tarjeta("#/sala", "tv", "TV de la sala", "Turnos, lookbook y promociones", "", 12)}
      <div class="card demo-reset rev" style="--i:13"><span class="demo-ic">${ic("refresh")}</span><span class="demo-tx"><b>Reiniciar demo</b><small>Vuelven los datos de ejemplo</small></span><button class="btn btn-s btn-ch" data-a="demoReiniciar">Reiniciar</button></div>
    </div>
  </main>`;
};
DESPUES.demo = (p, cambio) => { if (cambio) contarArriba($("#app")); };
A.demoReiniciar = async () => {
  if (await confirmar({ titulo: "¿Reiniciar la demo?", texto: "Vuelven las clientas, citas y ventas de ejemplo.", si: "Reiniciar", peligro: true })) {
    db.reiniciar(); render(); contarArriba($("#app")); toast("Demo lista para presentar", "sparkles");
  }
};

/* =================== MODO PRESENTACIÓN =================== */
VISTAS.presentar = () => {
  ["recepcion", "estilista", "admin"].forEach(r => sesion.entrar(r));
  return `<header class="top pres-top"><div class="top-in"><a class="btn btn-t btn-ch" href="#/demo">${ic("chev-l")}<span>Demo</span></a>
    <div class="pres-tit"><b>Modo presentación</b><small>Lo que pasa en un lado aparece en los otros</small></div><span class="esp"></span>
    <button class="btn btn-s btn-ch" data-a="presRecargar">${ic("refresh")}<span>Recargar</span></button></div></header>`;
};
DESPUES.presentar = () => presMontar();
function presMontar() {
  let host = document.getElementById("pres-host");
  if (!host) {
    const u = urlBase();
    host = document.createElement("div"); host.id = "pres-host";
    host.innerHTML = `<div class="pres-grid">
      <figure class="pres-f"><figcaption>${ic("phone")}La clienta</figcaption><div class="pres-marco tel" data-w="390" data-h="844"><iframe src="${u}#/" title="Teléfono de la clienta"></iframe></div></figure>
      <figure class="pres-f pres-centro"><figcaption>${ic("grid")}Recepción</figcaption><div class="pres-marco pc" data-w="1280" data-h="820"><iframe src="${u}#/recepcion" title="Recepción"></iframe></div></figure>
      <figure class="pres-f"><figcaption>${ic("scissors")}Estilista</figcaption><div class="pres-marco tel" data-w="390" data-h="844"><iframe src="${u}#/estilista" title="Estilista"></iframe></div></figure>
    </div>`;
    document.body.appendChild(host);
    requestAnimationFrame(() => host.classList.add("listo"));
  }
  presEscalar();
}
function presEscalar() {
  const alto = Math.max(360, innerHeight - 140), apilado = innerWidth < 1000;
  $$("#pres-host .pres-marco").forEach(m => {
    const w = +m.dataset.w, h = +m.dataset.h, disp = m.parentElement.clientWidth;
    const k = Math.min(1, disp / w, apilado ? 1 : alto / h);
    const f = m.querySelector("iframe");
    f.style.width = w + "px"; f.style.height = h + "px"; f.style.transform = `scale(${k})`;
    m.style.width = Math.round(w * k) + "px"; m.style.height = Math.round(h * k) + "px";
  });
}
window.addEventListener("resize", () => { if (document.getElementById("pres-host")) presEscalar(); });
window.addEventListener("hashchange", () => { if (ruta().r !== "presentar") { const h = document.getElementById("pres-host"); h && h.remove(); } });
A.presRecargar = () => { $$("#pres-host iframe").forEach(f => { try { f.contentWindow.location.reload(); } catch (e) { f.src = f.src; } }); toast("Pantallas recargadas", "refresh"); };

/* =================== TV DE LA SALA (estilo Apple TV) =================== */
/* El fondo con fotos y diseños vive fuera de #app para que no se reinicie cuando cambian los datos. */
const salaNombre = k => { const p = String(k.nombre || "").split(" "); return p[0] + (p[1] ? " " + p[1][0] + "." : ""); };
const tv = { idx: 0, timer: null, reloj: null, vistos: null, sonido: false, actx: null };
function tvSlides() {
  const fotos = (MARCA.trabajos || []).map(t => ({ tipo: "foto", src: t.src, eyebrow: "Hecho en " + MARCA.corto, titulo: t.alt }));
  const disenos = (typeof LOOKBOOK !== "undefined" ? LOOKBOOK : []).filter(l => ["aura-rosa", "noir-piedras", "nude-glitter", "frances", "cromado-perla", "ojo-gato"].includes(l.id))
    .map(l => ({ tipo: "diseno", preset: l.id, eyebrow: "Diseños de la casa", titulo: l.nombre, desc: l.desc }));
  const promoS = db.listar("servicios", x => x.activo && /promo/i.test(x.desc || ""))[0];
  const mb = db.listar("membresias")[0], L = lealtad();
  const promos = [];
  if (promoS) promos.push({ tipo: "promo", eyebrow: "Promoción del mes", titulo: promoS.nombre + (/chocolate/i.test(promoS.desc) ? " en tono chocolate" : ""), precio: (promoS.desde ? "desde " : "") + Q(promoS.precio) });
  else if (mb) promos.push({ tipo: "promo", eyebrow: "Club del salón", titulo: mb.nombre, desc: mb.desc, precio: Q(mb.precio) + " al mes" });
  promos.push({ tipo: "tarjeta", eyebrow: "Tarjeta de puntos", titulo: `Junta ${L.sellos} sellos`, desc: `y llévate ${L.premio.toLowerCase()}. Pídela en recepción o guárdala en tu Wallet.` });
  if (cfg().promo_cumple) promos.push({ tipo: "promo", eyebrow: "Tu mes", titulo: `${cfg().promo_cumple} % en tu cumpleaños`, desc: "En cualquier servicio, todo el mes.", precio: "" });
  const out = [], a = fotos.length ? fotos : disenos, b = fotos.length ? disenos : [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); if (i % 2 === 1 && promos.length) out.push(promos.shift()); }
  return out.concat(promos);
}
function tvSlideHTML(s, i) {
  const pie = `<div class="tv-cap"><p class="eyebrow">${esc(s.eyebrow)}</p><h2 class="serif">${esc(s.titulo)}</h2>${s.desc ? `<p class="tv-desc">${esc(s.desc)}</p>` : ""}${s.precio ? `<p class="tv-precio serif">${esc(s.precio)}</p>` : ""}</div>`;
  if (s.tipo === "foto") return `<div class="tv-slide foto" data-i="${i}"><div class="tv-luz"></div><div class="tv-borroso" style="background-image:url('${s.src}')"></div><img src="${s.src}" alt="">${pie}</div>`;
  if (s.tipo === "diseno") return `<div class="tv-slide diseno" data-i="${i}"><div class="tv-luz"></div><div class="tv-mano">${manoSVG({ preset: s.preset }, { tam: 900 })}</div>${pie}</div>`;
  if (s.tipo === "tarjeta") return `<div class="tv-slide tarjeta" data-i="${i}"><div class="tv-luz"></div><div class="tv-tp">${tarjetaPuntosHTML({ nombre: "Tu nombre aquí", sellos: 6, puntos: 380, tarjeta: "T0SALA" }, { grande: true })}</div>${pie}</div>`;
  return `<div class="tv-slide promo" data-i="${i}"><div class="tv-luz"></div><svg class="tv-anillos" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90"/><circle cx="104" cy="96" r="80"/><circle cx="96" cy="104" r="70"/></svg>${pie}</div>`;
}
function tvMontarFondo() {
  let f = document.getElementById("tvFondo");
  if (f) return;
  f = document.createElement("div"); f.id = "tvFondo"; f.setAttribute("aria-hidden", "true");
  const sl = tvSlides(); tv.n = sl.length; tv.idx = tv.idx % (tv.n || 1);
  f.innerHTML = sl.map(tvSlideHTML).join("") + `<div class="tv-puntos">${sl.map((_, i) => `<i data-i="${i}"></i>`).join("")}</div>`;
  document.body.prepend(f);
  tvMostrar(tv.idx);
  clearInterval(tv.timer);
  if (!reducido()) tv.timer = setInterval(() => { if (!document.getElementById("tvFondo")) return; tvMostrar((tv.idx + 1) % tv.n); }, 8000);
}
function tvMostrar(i) {
  tv.idx = i;
  $$("#tvFondo .tv-slide").forEach(el => { const on = +el.dataset.i === i; if (on && !el.classList.contains("on")) { el.classList.remove("on"); void el.offsetWidth; } el.classList.toggle("on", on); });
  $$("#tvFondo .tv-puntos i").forEach(el => el.classList.toggle("on", +el.dataset.i === i));
}
function tvDesmontar() { const f = document.getElementById("tvFondo"); f && f.remove(); const l = document.getElementById("tvLlamado"); l && l.remove(); clearInterval(tv.timer); clearInterval(tv.reloj); tv.vistos = null; }
window.addEventListener("hashchange", () => { if (ruta().r !== "sala") tvDesmontar(); });

function tvTicker() {
  const items = db.listar("servicios", x => x.activo).slice(0, 14).map(x => `<span>${esc(x.nombre)} <b>${x.desde ? "desde " : ""}${Q(x.precio)}</b></span>`);
  const promo = db.listar("servicios", x => x.activo && /promo/i.test(x.desc || ""))[0];
  if (promo) items.unshift(`<span class="tv-tk-promo">${ic("sparkles")}${esc(promo.desc)}</span>`);
  items.push(`<span class="tv-tk-promo">${ic("star")}Tarjeta de puntos: ${lealtad().sellos} sellos = ${esc(lealtad().premio.toLowerCase())}</span>`);
  const fila = items.join('<i class="tv-sep">✦</i>');
  return `<div class="tv-tk-pista"><div class="tv-tk-mov">${fila}<i class="tv-sep">✦</i>${fila}<i class="tv-sep">✦</i></div></div>`;
}

VISTAS.sala = () => {
  const ahora = Date.now();
  const enServ = citasDia(ahora, c => c.estado === "en_servicio").sort((a, b) => (b.t.empezo || 0) - (a.t.empezo || 0)).slice(0, 3);
  const espera = citasDia(ahora, c => c.estado === "llego").slice(0, 3);
  const lugar = c => { const x = c.estacion_id && db.obtener("estaciones", c.estacion_id); return x ? x.nombre : "con " + est(c.items[0].estilista_id).nombre.split(" ")[0]; };
  return `<main class="tv">
    <header class="tv-top">${logo(58)}<div class="tv-marca"><b class="serif">${esc(MARCA.nombre)}</b><small>${esc(MARCA.lema)}</small></div><span class="esp"></span>
      <div class="tv-reloj"><b class="serif num" id="tvHora">${hora(ahora).replace(/ (a|p)\. m\./, "")}<small>${hora(ahora).includes("a. m.") ? "a. m." : "p. m."}</small></b><span>${cap(fechaLarga(ahora))}</span></div>
      <button class="tv-btn ${tv.sonido ? "on" : ""}" data-a="tvSonido" aria-pressed="${tv.sonido}" aria-label="${tv.sonido ? "Silenciar avisos" : "Activar sonido de avisos"}" title="${tv.sonido ? "Sonido activado" : "Activar sonido"}">${ic("bell")}</button>
      <button class="tv-btn" data-a="salaPantalla" aria-label="Pantalla completa" title="Pantalla completa">${ic("present")}</button></header>
    <aside class="tv-turnos" aria-label="Turnos">
      ${enServ.length ? `<p class="eyebrow">Es tu turno</p>${enServ.map(c => `<div class="tv-turno"><i class="tv-pulso"></i><div><b class="serif">${esc(salaNombre(cli(c.clienta_id)))}</b><span>${esc(lugar(c))}</span></div></div>`).join("")}` : `<p class="eyebrow">Bienvenida</p><p class="tv-bien serif">Ponte cómoda, en un momento te atendemos.</p>`}
      ${espera.length ? `<p class="eyebrow tv-ee">En espera</p>${espera.map(c => `<div class="tv-esp"><b>${esc(salaNombre(cli(c.clienta_id)))}</b><span>con ${esc(est(c.items[0].estilista_id).nombre.split(" ")[0])}</span></div>`).join("")}` : ""}
    </aside>
    <footer class="tv-banda"><div class="tv-qr"><div class="qr" data-qr="${esc(reservarURL())}"></div><div><b>Reserva aquí</b><small>y junta sellos</small></div></div>${tvTicker()}</footer>
  </main>`;
};
DESPUES.sala = () => {
  tvMontarFondo();
  clearInterval(tv.reloj);
  tv.reloj = setInterval(() => { const h = $("#tvHora"); if (!h || ruta().r !== "sala") return; const t = hora(Date.now()); h.innerHTML = t.replace(/ (a|p)\. m\./, "") + `<small>${t.includes("a. m.") ? "a. m." : "p. m."}</small>`; }, 15000);
  /* llamado en grande cuando alguien entra a servicio */
  const actuales = citasDia(Date.now(), c => c.estado === "en_servicio");
  if (tv.vistos === null) {
    tv.vistos = new Set(actuales.map(c => c.id));
    const reciente = actuales.filter(c => c.t.empezo && Date.now() - c.t.empezo < 60 * MIN).sort((a, b) => b.t.empezo - a.t.empezo)[0];
    if (reciente) setTimeout(() => tvLlamar(reciente), 1600);
  } else actuales.filter(c => !tv.vistos.has(c.id)).forEach((c, i) => { tv.vistos.add(c.id); setTimeout(() => tvLlamar(c), i * 9500); });
};
function tvLlamar(c) {
  if (ruta().r !== "sala") return;
  const x = c.estacion_id && db.obtener("estaciones", c.estacion_id);
  let l = document.getElementById("tvLlamado"); if (l) l.remove();
  l = document.createElement("div"); l.id = "tvLlamado"; l.setAttribute("role", "status");
  l.innerHTML = `<div class="tv-ll-in"><svg class="tv-ll-anillos" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="80"/></svg>
    <p class="eyebrow">Es tu turno</p><b class="serif">${esc(salaNombre(cli(c.clienta_id)))}</b><span>${x ? "te esperan en la " + esc(x.nombre) : "te atiende " + esc(est(c.items[0].estilista_id).nombre.split(" ")[0])}</span></div>`;
  document.body.appendChild(l);
  requestAnimationFrame(() => l.classList.add("on"));
  tvTono();
  setTimeout(() => { l.classList.remove("on"); setTimeout(() => l.remove(), 700); }, 7000);
}
function tvTono() {
  if (!tv.sonido) return;
  try {
    tv.actx = tv.actx || new (window.AudioContext || window.webkitAudioContext)();
    [[659.3, 0], [880, .22]].forEach(([fr, d]) => { const o = tv.actx.createOscillator(), g = tv.actx.createGain(), t = tv.actx.currentTime + d; o.type = "sine"; o.frequency.value = fr; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .04); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2); o.connect(g).connect(tv.actx.destination); o.start(t); o.stop(t + 1.25); });
  } catch (e) {}
}
A.tvSonido = () => { tv.sonido = !tv.sonido; if (tv.sonido) tvTono(); toast(tv.sonido ? "Sonido de avisos activado" : "Avisos en silencio", "bell"); render(); };
A.salaPantalla = () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen().catch(() => toast("Tu navegador no dejó abrir pantalla completa", "alert")); };
