"use strict";
/* ============================================================
   Administración — la dueña del salón.
   Hoy · Agenda · Clientas · Servicios · Personal · Inventario ·
   Fidelidad · Mensajes · Reportes · Ajustes
   ============================================================ */
ROL_DE.admin = "admin"; CLASE_RUTA.admin = "staff";

const ADM_SECC = [
  ["hoy", "Hoy", "home"], ["agenda", "Agenda", "cal"], ["clientas", "Clientas", "users"], ["servicios", "Servicios", "sparkles"],
  ["personal", "Personal", "scissors"], ["inventario", "Inventario", "box"], ["fidelidad", "Fidelidad", "gift"],
  ["mensajes", "Mensajes", "msg"], ["reportes", "Reportes", "chart"], ["ajustes", "Ajustes", "sliders"]
];
const ADM_V = {};
const ADM_PAL = ["#C9A27E", "#B9A3C8", "#D7A6AE", "#E3BE8F", "#9FB7C9", "#A9BFA4"];
const ADM_MET_COL = { efectivo: "#3F7D5C", tarjeta: "var(--tinta)", transferencia: "#3F6390", link: "var(--acento)", regalo: "#D7A6AE", paquete: "#B9A3C8", membresia: "#9FB7C9", anticipo: "#E3BE8F" };

/* ---------- utilidades ---------- */
const admFi = (k, d) => ui.filtros[k] ?? d;
const admNombreC = k => { const p = String(k.nombre || "").split(" "); return p[0] + (p[1] ? " " + p[1][0] + "." : ""); };
const admColorCli = k => ADM_PAL[[...String(k.id)].reduce((s, c) => s + c.charCodeAt(0), 0) % ADM_PAL.length];
const admAv = (k, t = 36) => avatar({ nombre: k.nombre, color: admColorCli(k) }, t);
const admHHMM = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const admMin = s => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const admPct = n => Math.round(n) + " %";
function admPrimerPago() { const m = {}; db.d.pagos.forEach(p => { if (p.clienta_id && (!m[p.clienta_id] || p.fecha < m[p.clienta_id])) m[p.clienta_id] = p.fecha; }); return m; }
function admAbrir(tipo, datos = {}) { if (!MODALES[tipo]) { toast("Esta ventana todavía no está lista", "alert"); return; } abrir(tipo, datos); }
function admAnimar() {
  const app = $("#app"); app.classList.remove("entra"); void app.offsetWidth; app.classList.add("entra");
  clearTimeout(admAnimar._t); admAnimar._t = setTimeout(() => app.classList.remove("entra"), 1400); contarArriba(app);
}
const admCab = (eyebrow, titulo, acciones = "") => `<div class="adm-cab rev"><div class="adm-cab-t"><p class="eyebrow">${eyebrow}</p><h1 class="h2">${titulo}</h1></div>${acciones ? `<div class="fila-w adm-cab-acc">${acciones}</div>` : ""}</div>`;
const admKpi = (etq, v, fmt, sub = "", i = 0) => `<div class="card kpi rev" style="--i:${i}"><small>${etq}</small><b class="num" ${fmt === "%" ? "" : `data-cuenta="${v}"`} ${fmt === "q" ? 'data-fmt="q"' : ""}>${fmt === "q" ? Q(v) : fmt === "%" ? admPct(v) : Math.round(v).toLocaleString("en-US")}</b>${sub ? `<span class="tenue xs">${sub}</span>` : ""}</div>`;
function admBarrasH(items, fmt = Q) {
  const max = Math.max(1, ...items.map(i => i.v));
  return `<div class="adm-hb">${items.map(it => `<div class="adm-hb-r"><div class="fila"><span class="trunc">${it.pre || ""}${esc(it.t)}</span><span class="esp"></span><b class="num">${fmt(it.v)}</b></div><div class="barra"><i style="width:${(it.v / max * 100).toFixed(1)}%;${it.c ? `background:${it.c}` : ""}"></i></div>${it.sub ? `<small class="tenue xs">${it.sub}</small>` : ""}</div>`).join("") || `<p class="tenue small">Sin datos en este rango.</p>`}</div>`;
}
/* tarjeta editable: muestra la información y solo cambia con Editar → Guardar/Cancelar */
function admEditable(key, titulo, icono, vista, formulario, i = 0) {
  const ed = admFi("admEd", null) === key;
  return `<section class="card adm-ed rev ${ed ? "editando" : ""}" style="--i:${i}">
    <div class="card-t">${ic(icono)}<h2>${titulo}</h2><span class="esp"></span>${ed ? "" : `<button class="btn btn-s btn-ch" data-a="admEdEditar" data-k="${key}">${ic("pen")}<span>Editar</span></button>`}</div>
    ${ed ? `<form data-f="admAj" data-k="${key}" class="pila">${formulario}<div class="fila adm-acc"><span class="esp"></span><button type="button" class="btn btn-s" data-a="admEdCancelar">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>` : vista}
  </section>`;
}
A.admEdEditar = el => {
  if (admFi("admEd", null)) { toast("Termina primero lo que estás editando", "alert"); const f = $(".adm-ed.editando"); f && f.scrollIntoView({ behavior: reducido() ? "auto" : "smooth", block: "center" }); return; }
  ui.filtros.admEd = el.dataset.k;
  if (el.dataset.k === "estaciones") ui.filtros.admEstDraft = JSON.parse(JSON.stringify(db.d.estaciones));
  render();
  setTimeout(() => { const f = $(".adm-ed.editando input, .adm-ed.editando textarea, .adm-ed.editando select"); f && f.focus({ preventScroll: true }); }, 30);
};
A.admEdCancelar = () => { ui.filtros.admEd = null; ui.filtros.admEstDraft = null; render(); };
A.admMEditar = () => { const m = modalTop(); m.editar = true; renderModal(); };
A.admMEdCancelar = () => { const m = modalTop(); if (m.nuevo) cerrar(); else { m.editar = false; renderModal(); } };

/* ---------- vista principal ---------- */
VISTAS.admin = () => {
  const s = ADM_V[tab("adm", "hoy")] ? tab("adm", "hoy") : "hoy";
  const nav = cls => ADM_SECC.map(([k, t, i]) => `<button class="${cls} ${s === k ? "on" : ""}" data-a="admIr" data-v="${k}" ${s === k ? 'aria-current="page"' : ""}>${ic(i)}<span>${t}</span></button>`).join("");
  return `${barraStaff("admin")}<main class="cont adm">
    <aside class="adm-lado"><nav aria-label="Secciones de administración">${nav("adm-nav")}</nav>
      <div class="adm-lado-pie"><button class="btn btn-t btn-ch" data-a="admSalir">${ic("out")}<span>Salir</span></button></div></aside>
    <div class="adm-m"><nav class="adm-menu-m" aria-label="Secciones">${nav("adm-pill")}</nav>${ADM_V[s]()}</div>
  </main>`;
};
DESPUES.admin = (p, cambio) => { if (cambio) contarArriba($("#app")); };
A.admIr = el => {
  ui.tabs.adm = el.dataset.v; ui.filtros.admEd = null; guardarUI(); render(); admAnimar();
  window.scrollTo({ top: 0, behavior: reducido() ? "auto" : "smooth" });
};
A.admSalir = () => { sesion.salir(); location.hash = "#/demo"; };
A.admFicha = el => admAbrir("ficha", { id: el.dataset.id });
A.admAbrirCita = el => admAbrir("cita", { id: el.dataset.id });
A.admNuevaCita = () => admAbrir("nuevaCita", {});

/* =================== HOY =================== */
function admOcupacion(d0) {
  const dow = new Date(d0).getDay(), h = horarioDia(d0), cs = citasDia(d0);
  return db.listar("estilistas").map(e => {
    if (!h || !e.dias.includes(dow)) return { e, pct: null };
    const disp = Math.max(0, Math.min(h[1], e.sale) - Math.max(h[0], e.entra));
    const ocup = sum(cs.flatMap(c => c.items.filter(i => i.estilista_id === e.id)), i => (i.fin - i.ini) / MIN);
    return { e, pct: disp ? Math.min(100, ocup / disp * 100) : 0, ocup, disp };
  });
}
function admAlertas() {
  const out = [];
  db.listar("productos", p => p.stock <= p.minimo).forEach(p => out.push({ ic: "box", c: "aviso", t: p.nombre, sub: `Quedan ${p.stock} ${p.tipo === "uso" ? p.unidad : "u"} · mínimo ${p.minimo}`, a: "admIr", v: "inventario" }));
  db.listar("esmaltes", e => e.stock === 0).forEach(e => out.push({ ic: "palette", c: "malo", t: `${e.nombre} agotado`, sub: "Tono de esmalte · la clienta lo verá con aviso", a: "admIr", v: "inventario", sw: e.hex }));
  db.listar("clientas", k => cumpleEn(k.id, 7)).forEach(k => out.push({ ic: "cake", c: "listo", t: k.nombre, sub: cumpleEn(k.id, 0) ? "Cumple hoy" : "Cumple esta semana", a: "admFicha", id: k.id }));
  retoques().slice(0, 5).forEach(r => out.push({ ic: "refresh", c: "activo", t: r.clienta.nombre, sub: `Retoque de ${r.cat.nombre.toLowerCase()} · ${r.toca < Date.now() ? "vencido" : diaRel(r.toca)}`, a: "admFicha", id: r.clienta.id }));
  const le = db.listar("lista_espera").length; if (le) out.push({ ic: "timer", c: "aviso", t: `${le} en lista de espera`, sub: "Llámalas cuando se libere un espacio", href: "#/recepcion" });
  return out;
}
const admFilaAlerta = (a, i) => {
  const attrs = a.href ? `href="${a.href}"` : `data-a="${a.a}" ${a.v ? `data-v="${a.v}"` : ""} ${a.id ? `data-id="${a.id}"` : ""}`;
  return `<${a.href ? "a" : "button"} class="row click adm-al" ${attrs}><span class="adm-al-ic ${a.c}">${a.sw ? `<i style="background:${a.sw}"></i>` : ic(a.ic)}</span><span class="row-t"><b>${esc(a.t)}</b><small>${esc(a.sub)}</small></span>${ic("chev-r", "tenue")}</${a.href ? "a" : "button"}>`;
};
ADM_V.hoy = () => {
  const h0 = dia0(), pg = db.listar("pagos", p => p.fecha >= h0), ventas = sum(pg, p => p.total);
  const prom = sum(db.listar("pagos", p => p.fecha >= h0 - 28 * DIA && p.fecha < h0), p => p.total) / 24;
  const cs = citasDia(), hechas = cs.filter(c => c.estado === "pagada").length, sala = cs.filter(c => ["llego", "en_servicio", "terminada"].includes(c.estado)).length;
  const prop = sum(pg, p => sum(Object.values(p.propinas || {})));
  const prim = admPrimerPago(), nuevasMes = Object.values(prim).filter(t => t >= inicioMes()).length;
  const ocup = admOcupacion(h0), alertas = admAlertas();
  const prox = cs.filter(c => ["confirmada", "reservada"].includes(c.estado) && c.ini >= Date.now() - 10 * MIN).slice(0, 6);
  const hr = new Date().getHours(), saludo = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";
  const mesV = sum(db.listar("pagos", p => p.fecha >= inicioMes()), p => p.total);
  return `${admCab(fechaLarga(Date.now()), saludo, `<a class="btn btn-s btn-ch" href="#/recepcion">${ic("grid")}<span>Recepción</span></a><button class="btn btn-p btn-ch" data-a="admNuevaCita">${ic("plus")}<span>Nueva cita</span></button>`)}
  <div class="g4 adm-kpis">
    ${admKpi("Ventas de hoy", ventas, "q", `Promedio diario ${Q(Math.round(prom))}`, 0)}
    ${admKpi("Citas de hoy", cs.length, "", `${hechas} cobradas · ${sala} en el salón`, 1)}
    ${admKpi("Propinas de hoy", prop, "q", "Para el equipo", 2)}
    ${admKpi("Ventas del mes", mesV, "q", `${nuevasMes} clientas nuevas`, 3)}
  </div>
  <div class="adm-2c">
    <div class="pila-l">
      <section class="card rev" style="--i:4"><div class="card-t">${ic("users")}<h2>Ocupación del equipo</h2></div>
        <div class="adm-ocup">${ocup.map(o => `<div class="adm-ocup-r">${avatar(o.e, 34)}<div class="adm-ocup-t"><div class="fila"><b class="trunc">${esc(o.e.nombre.split(" ")[0])}</b><span class="tenue xs trunc">${esc(o.e.rol)}</span><span class="esp"></span><span class="num small">${o.pct === null ? "Descansa" : admPct(o.pct)}</span></div>
          <div class="barra"><i style="width:${o.pct || 0}%;background:${o.e.color}"></i></div></div></div>`).join("")}</div></section>
      <section class="rev" style="--i:5"><div class="adm-sub"><h2>Lo que sigue</h2><a class="btn btn-t btn-ch" href="#/recepcion">Ver todo ${ic("chev-r")}</a></div>
        ${prox.length ? `<div class="lista">${prox.map(c => { const e = est(c.items[0].estilista_id); return `<button class="row click" data-a="admAbrirCita" data-id="${c.id}"><span class="adm-hora num">${hora(c.ini)}</span><span class="adm-tira" style="background:${e.color}"></span><span class="row-t"><b>${esc(cli(c.clienta_id).nombre)}</b><small>${esc(nombresServ(c))} · ${esc(e.nombre.split(" ")[0])}</small></span>${chip(ESTADOS[c.estado].t, ESTADOS[c.estado].c)}</button>`; }).join("")}</div>` : `<div class="card">${vacio("No quedan citas por hoy.")}</div>`}
      </section>
    </div>
    <section class="rev" style="--i:6"><div class="adm-sub"><h2>Para atender</h2><span class="chip">${alertas.length}</span></div>
      ${alertas.length ? `<div class="lista">${alertas.slice(0, 10).map(admFilaAlerta).join("")}${alertas.length > 10 ? `<div class="row tenue small">Y ${alertas.length - 10} más</div>` : ""}</div>` : `<div class="card">${vacio("Todo en orden.")}</div>`}
    </section>
  </div>`;
};

/* =================== AGENDA =================== */
ADM_V.agenda = () => {
  const off = admFi("admSem", 0), dow = (new Date().getDay() + 6) % 7, lunes = dia0() - dow * DIA + off * 7 * DIA;
  const fe = admFi("admEst", ""), dias = Array.from({ length: 7 }, (_, i) => dia0(lunes + i * DIA + 2 * HORA));
  const ests = db.listar("estilistas");
  const d1 = new Date(dias[0]), d7 = new Date(dias[6]);
  const rango = `${d1.getDate()} ${MESES_C[d1.getMonth()]} – ${d7.getDate()} ${MESES_C[d7.getMonth()]}`;
  const semana = dias.map(d => db.listar("citas", c => c.ini >= d && c.ini < d + DIA && activa(c) && (!fe || c.items.some(it => it.estilista_id === fe))).sort((a, b) => a.ini - b.ini));
  return `${admCab("Agenda de la semana", rango, `<div class="seg"><button data-a="admSem" data-d="-1" aria-label="Semana anterior">${ic("chev-l")}</button><button data-a="admSem" data-d="0" class="${off === 0 ? "on" : ""}">Esta semana</button><button data-a="admSem" data-d="1" aria-label="Semana siguiente">${ic("chev-r")}</button></div><button class="btn btn-p btn-ch" data-a="admNuevaCita">${ic("plus")}<span>Nueva cita</span></button>`)}
  <div class="fila-w adm-filtros rev">${[{ id: "", nombre: "Todo el equipo" }, ...ests].map(e => `<button class="chip-b ${fe === e.id ? "on" : ""}" data-a="admAgEst" data-id="${e.id}">${e.id ? `<i style="background:${e.color}"></i>` : ""}${esc(e.id ? e.nombre.split(" ")[0] : e.nombre)}</button>`).join("")}</div>
  <div class="adm-semana">${dias.map((d, i) => {
    const cs = semana[i], cerrado = !horarioDia(d);
    return `<section class="adm-dia card rev ${d === dia0() ? "hoy" : ""} ${cerrado ? "cerrado" : ""}" style="--i:${i}">
      <header><span>${DIAS_C[new Date(d).getDay()]}</span><b class="serif">${new Date(d).getDate()}</b><small>${cerrado ? "Cerrado" : cs.length + (cs.length === 1 ? " cita" : " citas")}</small></header>
      <div class="adm-dia-l">${cs.map(c => { const e = est(c.items[0].estilista_id); return `<button class="adm-ag-c ${c.estado}" style="--c:${e.color}" data-a="admAbrirCita" data-id="${c.id}" title="${esc(cli(c.clienta_id).nombre)} · ${esc(nombresServ(c))}"><span class="num">${hora(c.ini)}</span><b class="trunc">${esc(admNombreC(cli(c.clienta_id)))}</b><small class="trunc">${esc(nombresServ(c))}</small></button>`; }).join("") || `<p class="tenue xs adm-dia-v">${cerrado ? "" : "Sin citas"}</p>`}</div>
      ${cs.length ? `<footer class="num">${Q(sum(cs, totalConArte))}</footer>` : ""}
    </section>`;
  }).join("")}</div>`;
};
A.admSem = el => { const d = +el.dataset.d; ui.filtros.admSem = d === 0 ? 0 : admFi("admSem", 0) + d; render(); };
A.admAgEst = el => { ui.filtros.admEst = el.dataset.id; render(); };

/* =================== CLIENTAS =================== */
ADM_V.clientas = () => {
  const q = admFi("admQ", ""), f = admFi("admCf", "todas"), hoy = Date.now();
  const todas = db.listar("clientas");
  const info = k => { const u = ultimaVisita(k.id); return { k, u, socia: !!k.membresia, paq: paquetesDe(k.id).length > 0 }; };
  let l = buscarClientas(q).map(info);
  if (f === "cumple") l = l.filter(x => esCumpleMes(x.k.id));
  if (f === "ausentes") l = l.filter(x => !x.u || hoy - x.u.ini > 60 * DIA);
  if (f === "vip") l = l.filter(x => x.k.vip);
  if (f === "socias") l = l.filter(x => x.socia || x.paq);
  const filtros = [["todas", "Todas"], ["cumple", "Cumpleaños del mes"], ["ausentes", "Sin venir 60 días"], ["vip", "VIP"], ["socias", "Con membresía o paquete"]];
  const nVip = todas.filter(k => k.vip).length, nSoc = todas.filter(k => k.membresia).length;
  return `${admCab("Clientas", `${todas.length} clientas`, `<button class="btn btn-p btn-ch" data-a="admNuevaClienta">${ic("plus")}<span>Nueva clienta</span></button>`)}
  <div class="adm-cli-top rev">
    <label class="buscar">${ic("search")}<input class="inp" id="admQ" type="search" placeholder="Nombre o teléfono" value="${esc(q)}" data-i="admBuscar" autocomplete="off" aria-label="Buscar clienta"></label>
    <div class="fila-w">${filtros.map(([k, t]) => `<button class="chip-b ${f === k ? "on" : ""}" data-a="admCf" data-v="${k}">${t}</button>`).join("")}</div>
    <p class="tenue small">${nVip} VIP · ${nSoc} socias · mostrando ${Math.min(l.length, 80)} de ${l.length}</p>
  </div>
  ${l.length ? `<div class="lista rev" style="--i:2">${l.slice(0, 80).map(({ k, u, socia, paq }) => `<button class="row click" data-a="admFicha" data-id="${k.id}">${admAv(k, 40)}
    <span class="row-t"><b>${esc(k.nombre)}</b><small>${esc(telFmt(k.tel))} · ${u ? "Última visita " + diaRel(u.ini).toLowerCase() : "Sin visitas"} · ${Q(gastoDe(k.id))}</small></span>
    <span class="fila-w adm-cli-ch">${k.vip ? chip(ic("crown") + "VIP", "listo") : ""}${socia ? chip("Socia", "activo") : ""}${paq ? chip("Paquete", "cobro") : ""}${esCumpleMes(k.id) ? chip(ic("cake") + (cumpleEn(k.id, 0) ? "Hoy" : "Este mes"), "aviso") : ""}${k.alergias ? chip(ic("alert") + "Alergia", "malo") : ""}</span>${ic("chev-r", "tenue")}</button>`).join("")}</div>` : `<div class="card">${vacio("No encontramos a nadie con esa búsqueda.")}</div>`}`;
};
I.admBuscar = el => { ui.filtros.admQ = el.value; pedirRender(true); };
A.admCf = el => { ui.filtros.admCf = el.dataset.v; render(); };
A.admNuevaClienta = () => abrir("admClienta", {});
MODALES.admClienta = () => `${cab("Nueva clienta", "Se guarda en la base de clientas")}
  <form data-f="admClienta" class="adm-mform"><div class="modal-c pila">
    ${campo("Nombre completo", `<input class="inp" id="adm_k_nombre" name="nombre" required autofocus autocomplete="off">`)}
    <div class="g2">${campo("WhatsApp", `<input class="inp" id="adm_k_tel" name="tel" inputmode="tel" placeholder="5555-1234" required>`)}${campo("Cumpleaños", `<input class="inp" id="adm_k_cumple" name="cumple" type="date">`)}</div>
    ${campo("¿Cómo nos conoció?", `<select class="inp" id="adm_k_origen" name="origen">${["Instagram", "Recomendación", "Google", "Facebook", "TikTok", "Pasaba por aquí"].map(o => `<option>${o}</option>`).join("")}</select>`)}
    ${campo("Alergias o avisos", `<input class="inp" id="adm_k_alergias" name="alergias" placeholder="Opcional">`)}
    ${campo("Notas", `<textarea class="inp" id="adm_k_notas" name="notas" placeholder="Bebida, música, preferencias"></textarea>`)}
  </div><div class="modal-p"><button type="button" class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
F.admClienta = (f, d) => {
  const tel = String(d.tel).replace(/\D/g, "");
  if (tel && db.listar("clientas").some(k => k.tel === tel.replace(/^502/, ""))) toast("Ese número ya existía; se abrió su ficha", "alert");
  const k = clientaPorTel(d.nombre, tel);
  if (d.cumple) k.cumple = d.cumple.slice(5);
  if (d.alergias) k.alergias = d.alergias.trim();
  if (d.notas) k.notas = d.notas.trim();
  k.origen = d.origen;
  db.cambio(); cerrar(); toast("Clienta guardada");
  setTimeout(() => admAbrir("ficha", { id: k.id }), 220);
};

/* =================== SERVICIOS =================== */
const admQuienes = s => s.estilistas && s.estilistas.length ? s.estilistas.map(est) : db.listar("estilistas", e => e.cats.includes(s.cat));
ADM_V.servicios = () => {
  const todos = db.listar("servicios");
  return `${admCab("Servicios", `${todos.filter(s => s.activo).length} activos`, `<button class="btn btn-p btn-ch" data-a="admServNuevo">${ic("plus")}<span>Nuevo servicio</span></button>`)}
  <div class="pila-l">${CATEGORIAS.map((c, i) => { const l = todos.filter(s => s.cat === c.id); return `<section class="rev" style="--i:${i + 1}">
    <div class="adm-sub"><span class="adm-cat-ic">${ic(c.icono)}</span><h2>${c.nombre}</h2><span class="tenue small">${c.sub}</span></div>
    <div class="lista">${l.map(s => `<button class="row click ${s.activo ? "" : "apagado"}" data-a="admServVer" data-id="${s.id}">
      <span class="row-t"><b>${esc(s.nombre)}</b><small>${durTxt(s.dur)}${s.pose ? ` · pose ${s.pose.min} min` : ""} · ${TIPOS_ESTACION[s.est] || ""}${s.anticipo ? ` · anticipo ${Q(s.anticipo)}` : ""}</small></span>
      ${s.activo ? "" : chip("Inactivo", "apagado")}<span class="adm-precio num">${s.desde ? "<small>desde</small> " : ""}${Q(s.precio)}</span>${ic("chev-r", "tenue")}</button>`).join("")}</div></section>`; }).join("")}</div>`;
};
A.admServVer = el => abrir("admServicio", { id: el.dataset.id });
A.admServNuevo = () => abrir("admServicio", { nuevo: true, editar: true });
MODALES.admServicio = m => {
  const s = m.nuevo ? { nombre: "", cat: "unas", precio: 0, dur: 60, est: "unas", desde: false, pose: null, anticipo: 0, activo: true, desc: "", estilistas: null, consumo: [] } : serv(m.id);
  if (!m.editar) {
    const quien = admQuienes(s);
    return `${cab(esc(s.nombre), catDe(s.cat).nombre)}<div class="modal-c pila-l">
      <div class="adm-serv-p"><span class="serif">${s.desde ? "<small>desde</small> " : ""}${Q(s.precio)}</span><div class="fila-w">${chip(ic("clock") + durTxt(s.dur))}${s.pose ? chip(ic("timer") + `Pose ${s.pose.min} min`, "activo") : ""}${chip(TIPOS_ESTACION[s.est] || "")}${s.anticipo ? chip(`Anticipo ${Q(s.anticipo)}`, "listo") : ""}${s.activo ? chip("Activo", "ok") : chip("Inactivo", "apagado")}</div></div>
      ${s.desc ? `<p class="tx2">${esc(s.desc)}</p>` : ""}
      ${s.pose ? `<div class="card card-suave small">Mientras actúa el producto (del minuto ${s.pose.ini} al ${s.pose.ini + s.pose.min}), la estilista puede atender a otra clienta.</div>` : ""}
      <div><p class="eyebrow">Lo hacen</p><div class="fila-w">${quien.map(e => `<span class="adm-quien">${avatar(e, 28)}${esc(e.nombre.split(" ")[0])}</span>`).join("") || `<span class="tenue small">Nadie todavía</span>`}</div></div>
      ${(s.consumo || []).length ? `<div><p class="eyebrow">Descuenta del inventario</p><div class="fila-w">${s.consumo.map(x => chip(`${esc((db.obtener("productos", x.producto_id) || {}).nombre || "")} × ${x.cant}`)).join("")}</div></div>` : ""}
    </div><div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cerrar</button><button class="btn btn-p" data-a="admMEditar">${ic("pen")}<span>Editar</span></button></div>`;
  }
  const q = admQuienes(s).map(e => e.id);
  return `${cab(m.nuevo ? "Nuevo servicio" : "Editar servicio", m.nuevo ? "" : esc(s.nombre))}
  <form data-f="admServ" class="adm-mform"><div class="modal-c pila">
    ${campo("Nombre", `<input class="inp" id="adm_s_nombre" name="nombre" value="${esc(s.nombre)}" required autofocus>`)}
    <div class="g2">${campo("Categoría", `<select class="inp" id="adm_s_cat" name="cat">${CATEGORIAS.map(c => `<option value="${c.id}" ${s.cat === c.id ? "selected" : ""}>${c.nombre}</option>`).join("")}</select>`)}
      ${campo("Estación", `<select class="inp" id="adm_s_est" name="est">${Object.entries(TIPOS_ESTACION).map(([k, t]) => `<option value="${k}" ${s.est === k ? "selected" : ""}>${t}</option>`).join("")}</select>`)}</div>
    <div class="g2">${campo("Precio (Q)", `<input class="inp num" id="adm_s_precio" name="precio" type="number" min="0" step="5" value="${s.precio}" required>`)}
      ${campo("Duración (min)", `<input class="inp num" id="adm_s_dur" name="dur" type="number" min="5" step="5" value="${s.dur}" required>`)}</div>
    <label class="check"><input type="checkbox" id="adm_s_desde" name="desde" ${s.desde ? "checked" : ""}> Mostrar como precio «desde»</label>
    <div class="card card-suave pila"><b class="small">Tiempo de pose (opcional)</b>
      <div class="g2">${campo("Empieza al minuto", `<input class="inp num" id="adm_s_pi" name="pose_ini" type="number" min="0" step="5" value="${s.pose ? s.pose.ini : ""}" placeholder="30">`)}${campo("Dura (min)", `<input class="inp num" id="adm_s_pm" name="pose_min" type="number" min="0" step="5" value="${s.pose ? s.pose.min : ""}" placeholder="0 = sin pose">`)}</div></div>
    ${campo("Anticipo para reservar (Q)", `<input class="inp num" id="adm_s_ant" name="anticipo" type="number" min="0" step="25" value="${s.anticipo || 0}">`, "0 = no pide anticipo")}
    <div><p class="campo"><span>Quién lo hace</span></p><div class="adm-checks">${db.listar("estilistas").map(e => `<label class="check">${avatar(e, 26)}<input type="checkbox" id="adm_s_q_${e.id}" name="q_${e.id}" ${q.includes(e.id) ? "checked" : ""}> ${esc(e.nombre.split(" ")[0])}</label>`).join("")}</div></div>
    ${campo("Descripción corta", `<textarea class="inp" id="adm_s_desc" name="desc" placeholder="Lo que ve la clienta al reservar">${esc(s.desc || "")}</textarea>`)}
    <label class="fila"><span class="esp b">Activo para reservar</span><span class="interruptor"><input type="checkbox" id="adm_s_act" name="activo" ${s.activo ? "checked" : ""} aria-label="Activo"><span></span></span></label>
  </div><div class="modal-p"><button type="button" class="btn btn-s" data-a="admMEdCancelar">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
};
F.admServ = (f, d) => {
  const m = modalTop(), s = m.nuevo ? { id: "s" + uid().slice(0, 5), consumo: [] } : serv(m.id);
  const pi = +d.pose_ini || 0, pm = +d.pose_min || 0, dur = Math.max(5, +d.dur || 30);
  Object.assign(s, { nombre: d.nombre.trim(), cat: d.cat, precio: +d.precio || 0, desde: !!d.desde, dur, est: d.est, anticipo: +d.anticipo || 0, activo: !!d.activo, desc: (d.desc || "").trim(), pose: pm > 0 ? { ini: pi, min: pm } : null });
  const q = db.listar("estilistas").filter(e => d["q_" + e.id]).map(e => e.id);
  s.estilistas = q.length ? q : null;
  if (m.nuevo) db.d.servicios.push(s);
  db.cambio(); m.nuevo = false; m.id = s.id; m.editar = false; renderModal();
  if (pm > 0 && pi + pm > dur) toast("La pose pasa de la duración del servicio. Revísalo.", "alert"); else toast("Servicio guardado");
};

/* =================== PERSONAL =================== */
const ADM_DIAS = [[1, "L"], [2, "M"], [3, "M"], [4, "J"], [5, "V"], [6, "S"], [0, "D"]];
ADM_V.personal = () => {
  const ini = inicioMes(), ests = db.listar("estilistas");
  return `${admCab("Personal", `${ests.length} personas en el equipo`, `<button class="btn btn-s btn-ch" data-a="admPagoAbrir">${ic("receipt")}<span>Reporte de pago</span></button><button class="btn btn-p btn-ch" data-a="admEstNuevo">${ic("plus")}<span>Agregar</span></button>`)}
  <div class="g3">${ests.map((e, i) => { const c = comisiones(e.id, ini), pct = e.meta ? Math.min(100, c.servicios / e.meta * 100) : 0; return `<article class="card adm-est rev" style="--i:${i}">
    <div class="fila">${avatar(e, 52)}<div class="row-t"><b class="serif adm-est-n">${esc(e.nombre)}</b><small class="tenue">${esc(e.rol)}</small></div></div>
    <div class="adm-dias">${ADM_DIAS.map(([d, t]) => `<span class="${e.dias.includes(d) ? "on" : ""}" title="${DIAS[d]}">${t}</span>`).join("")}<small class="tenue num">${horaMin(e.entra)} – ${horaMin(e.sale)}</small></div>
    <div class="fila-w">${e.cats.map(k => chip(catDe(k).nombre)).join("")}</div>
    <div class="adm-est-m"><div class="fila small"><span class="tenue">Meta del mes</span><span class="esp"></span><b class="num">${Q(c.servicios)}</b><span class="tenue num">/ ${Q(e.meta)}</span></div><div class="barra"><i style="width:${pct}%;background:${e.color}"></i></div></div>
    <div class="adm-est-c"><div><small>Comisión</small><b class="num">${Q(c.com_serv + c.com_prod)}</b></div><div><small>Propinas</small><b class="num">${Q(c.propinas)}</b></div><div><small>Servicios</small><b class="num">${c.citas}</b></div></div>
    <p class="tenue xs">${e.com_serv} % en servicios · ${e.com_prod} % en productos</p>
    <button class="btn btn-s btn-ch" data-a="admEstEditar" data-id="${e.id}">${ic("pen")}<span>Editar</span></button>
  </article>`; }).join("")}</div>`;
};
A.admEstEditar = el => abrir("admEstilista", { id: el.dataset.id });
A.admEstNuevo = () => abrir("admEstilista", { nuevo: true });
MODALES.admEstilista = m => {
  const e = m.nuevo ? { nombre: "", rol: "", cats: [], color: ADM_PAL[db.d.estilistas.length % ADM_PAL.length], com_serv: 35, com_prod: 10, meta: 20000, dias: [1, 2, 3, 4, 5, 6], entra: 9 * 60, sale: 18 * 60 } : est(m.id);
  return `${cab(m.nuevo ? "Agregar al equipo" : "Editar a " + esc(e.nombre.split(" ")[0]), "")}
  <form data-f="admEst" class="adm-mform"><div class="modal-c pila">
    <div class="g2">${campo("Nombre", `<input class="inp" id="adm_e_nombre" name="nombre" value="${esc(e.nombre)}" required autofocus>`)}${campo("Puesto", `<input class="inp" id="adm_e_rol" name="rol" value="${esc(e.rol)}" placeholder="Nail artist">`)}</div>
    <div><p class="campo"><span>Días que trabaja</span></p><div class="adm-checks">${ADM_DIAS.map(([d]) => `<label class="check"><input type="checkbox" id="adm_e_d${d}" name="d${d}" ${e.dias.includes(d) ? "checked" : ""}> ${DIAS_C[d]}</label>`).join("")}</div></div>
    <div class="g2">${campo("Entra", `<input class="inp" id="adm_e_entra" name="entra" type="time" value="${admHHMM(e.entra)}">`)}${campo("Sale", `<input class="inp" id="adm_e_sale" name="sale" type="time" value="${admHHMM(e.sale)}">`)}</div>
    <div><p class="campo"><span>Servicios que hace</span></p><div class="adm-checks">${CATEGORIAS.map(c => `<label class="check"><input type="checkbox" id="adm_e_c_${c.id}" name="c_${c.id}" ${e.cats.includes(c.id) ? "checked" : ""}> ${c.nombre}</label>`).join("")}</div></div>
    <div class="g2">${campo("Comisión en servicios (%)", `<input class="inp num" id="adm_e_cs" name="com_serv" type="number" min="0" max="100" value="${e.com_serv}">`)}${campo("Comisión en productos (%)", `<input class="inp num" id="adm_e_cp" name="com_prod" type="number" min="0" max="100" value="${e.com_prod}">`)}</div>
    <div class="g2">${campo("Meta de ventas del mes (Q)", `<input class="inp num" id="adm_e_meta" name="meta" type="number" min="0" step="500" value="${e.meta}">`)}${campo("Color en la agenda", `<input class="inp adm-color" id="adm_e_color" name="color" type="color" value="${e.color}">`)}</div>
  </div><div class="modal-p"><button type="button" class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
};
F.admEst = (f, d) => {
  const m = modalTop(), e = m.nuevo ? { id: "e" + uid().slice(0, 5) } : est(m.id);
  const dias = ADM_DIAS.map(([x]) => x).filter(x => d["d" + x]), cats = CATEGORIAS.map(c => c.id).filter(c => d["c_" + c]);
  Object.assign(e, { nombre: d.nombre.trim(), rol: d.rol.trim(), dias, cats, entra: admMin(d.entra), sale: admMin(d.sale), com_serv: clamp(+d.com_serv || 0, 0, 100), com_prod: clamp(+d.com_prod || 0, 0, 100), meta: +d.meta || 0, color: d.color });
  if (m.nuevo) db.d.estilistas.push(e);
  if (!cats.length) toast("Sin servicios asignados no aparecerá para reservar", "alert"); else toast("Guardado");
  db.cambio(); cerrar();
};
function admPeriodo(k) {
  const d = new Date(), y = d.getFullYear(), mo = d.getMonth(), dd = d.getDate(), finMes = (yy, mm) => new Date(yy, mm + 1, 0).getDate();
  if (k === "q_act") return dd <= 15 ? [+new Date(y, mo, 1), +new Date(y, mo, 16), `1 al 15 de ${MESES[mo]}`] : [+new Date(y, mo, 16), +new Date(y, mo + 1, 1), `16 al ${finMes(y, mo)} de ${MESES[mo]}`];
  if (k === "q_ant") return dd <= 15 ? [+new Date(y, mo - 1, 16), +new Date(y, mo, 1), `16 al ${finMes(y, mo - 1)} de ${MESES[(mo + 11) % 12]}`] : [+new Date(y, mo, 1), +new Date(y, mo, 16), `1 al 15 de ${MESES[mo]}`];
  if (k === "mes_ant") return [+new Date(y, mo - 1, 1), +new Date(y, mo, 1), MESES[(mo + 11) % 12]];
  return [+new Date(y, mo, 1), +new Date(y, mo + 1, 1), `${MESES[mo]} ${y}`];
}
A.admPagoAbrir = () => abrir("admPago", { ancho: "ancho", per: "q_act" });
A.admPagoPer = el => { modalTop().per = el.dataset.v; renderModal(); };
MODALES.admPago = m => {
  const [a, b, txt] = admPeriodo(m.per), filas = db.listar("estilistas").map(e => ({ e, c: comisiones(e.id, a, b) }));
  const T = k => sum(filas, f => f.c[k]);
  return `${cab("Reporte de pago", txt)}<div class="modal-c pila adm-pago">
    <div class="seg adm-noimp">${[["q_act", "Esta quincena"], ["q_ant", "Quincena pasada"], ["mes", "Este mes"], ["mes_ant", "Mes pasado"]].map(([k, t]) => `<button class="${m.per === k ? "on" : ""}" data-a="admPagoPer" data-v="${k}">${t}</button>`).join("")}</div>
    <div class="adm-imp-cab"><b class="serif">${esc(MARCA.nombre)}</b><span>Pago al equipo · ${txt}</span></div>
    <div class="tabla-env"><table class="tabla adm-tpago"><thead><tr><th>Persona</th><th class="r">Servicios</th><th class="r">Comisión</th><th class="r">Productos</th><th class="r">Comisión</th><th class="r">Propinas</th><th class="r">A pagar</th></tr></thead>
    <tbody>${filas.map(({ e, c }) => `<tr><td><span class="fila">${avatar(e, 26)}<span><b>${esc(e.nombre)}</b><br><small class="tenue">${c.citas} servicios · ${e.com_serv} % / ${e.com_prod} %</small></span></span></td><td class="r num">${Q(c.servicios)}</td><td class="r num">${Q(c.com_serv)}</td><td class="r num">${Q(c.productos)}</td><td class="r num">${Q(c.com_prod)}</td><td class="r num">${Q(c.propinas)}</td><td class="r num"><b>${Q(c.total)}</b></td></tr>`).join("")}</tbody>
    <tfoot><tr><th>Total</th><th class="r num">${Q(T("servicios"))}</th><th class="r num">${Q(T("com_serv"))}</th><th class="r num">${Q(T("productos"))}</th><th class="r num">${Q(T("com_prod"))}</th><th class="r num">${Q(T("propinas"))}</th><th class="r num">${Q(T("total"))}</th></tr></tfoot></table></div>
    <p class="tenue xs">Las propinas se entregan completas. Las comisiones salen de lo cobrado en caja en este período.</p>
  </div><div class="modal-p adm-noimp"><button class="btn btn-s" data-a="admPagoCSV">${ic("download")}<span>CSV</span></button><button class="btn btn-p" data-a="admImprimir">${ic("file")}<span>Imprimir</span></button></div>`;
};
A.admImprimir = () => { document.body.classList.add("adm-imprime"); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove("adm-imprime"), 400); }, 50); };
A.admPagoCSV = () => {
  const m = modalTop(), [a, b, txt] = admPeriodo(m.per);
  const filas = [["Persona", "Servicios", "Comisión servicios", "Productos", "Comisión productos", "Propinas", "A pagar"]];
  db.listar("estilistas").forEach(e => { const c = comisiones(e.id, a, b); filas.push([e.nombre, c.servicios, c.com_serv, c.productos, c.com_prod, c.propinas, c.total]); });
  descargar(`pago-equipo-${txt.replace(/\s+/g, "-")}.csv`, csv(filas)); toast("CSV descargado", "download");
};

/* =================== INVENTARIO =================== */
ADM_V.inventario = () => {
  const t = tab("admInv", "venta"), prods = db.listar("productos"), esm = db.listar("esmaltes");
  const bajos = prods.filter(p => p.stock <= p.minimo).length + esm.filter(e => e.stock === 0).length;
  const valor = sum(prods.filter(p => p.tipo === "venta"), p => p.stock * p.costo);
  const movs = db.listar("movimientos_inventario").sort((a, b) => b.fecha - a.fecha).slice(0, 20);
  const nombreDe = id => (db.obtener("productos", id) || db.obtener("esmaltes", id) || { nombre: "—" }).nombre;
  let cuerpo = "";
  if (t === "esmaltes") {
    cuerpo = `<div class="adm-esm rev" style="--i:2">${esm.map(e => `<button class="adm-esm-c card click" data-a="admAjustar" data-t="esmaltes" data-id="${e.id}"><span class="adm-esm-sw" style="--sw:${e.hex}"></span><b class="trunc">${esc(e.nombre)}</b><small class="tenue">${esc(e.codigo)}</small>${e.stock === 0 ? chip("Agotado", "malo") : e.stock <= 1 ? chip(`${e.stock} frasco`, "aviso") : chip(`${e.stock} frascos`)}</button>`).join("")}</div>`;
  } else {
    const l = prods.filter(p => p.tipo === t);
    cuerpo = `<div class="lista rev" style="--i:2">${l.map(p => { const bajo = p.stock <= p.minimo; return `<div class="row">
      <span class="adm-inv-n num ${bajo ? "bajo" : ""}">${p.stock}</span>
      <span class="row-t"><b>${esc(p.nombre)}</b><small>${p.marca ? esc(p.marca) + " · " : ""}${t === "venta" ? `${Q(p.precio)} · costo ${Q(p.costo)}` : esc(p.unidad)} · mínimo ${p.minimo}</small></span>
      ${bajo ? chip("Bajo", "aviso") : ""}
      <button class="btn btn-t btn-ch btn-i" data-a="admProdEditar" data-id="${p.id}" aria-label="Editar ${esc(p.nombre)}">${ic("pen")}</button>
      <button class="btn btn-s btn-ch" data-a="admAjustar" data-t="productos" data-id="${p.id}">Ajustar</button></div>`; }).join("")}</div>`;
  }
  return `${admCab("Inventario", bajos ? `${bajos} por reponer` : "Todo en existencia", `<button class="btn btn-p btn-ch" data-a="admProdNuevo">${ic("plus")}<span>Nuevo producto</span></button>`)}
  <div class="g4 adm-kpis">${admKpi("Valor en venta (al costo)", valor, "q", "", 0)}${admKpi("Productos de venta", prods.filter(p => p.tipo === "venta").length, "", "", 1)}${admKpi("Insumos de uso", prods.filter(p => p.tipo === "uso").length, "", "", 2)}${admKpi("Tonos de esmalte", esm.length, "", `${esm.filter(e => e.stock === 0).length} agotados`, 3)}</div>
  <div class="rev adm-tabs">${seg("admInv", [["venta", "Venta", "bag"], ["uso", "Uso interno", "box"], ["esmaltes", "Esmaltes", "palette"]], t)}</div>
  ${cuerpo}
  <section class="rev mt-l" style="--i:3"><div class="adm-sub"><h2>Movimientos recientes</h2></div>
    ${movs.length ? `<div class="lista">${movs.map(x => `<div class="row"><span class="adm-mov num ${x.cant > 0 ? "mas" : "menos"}">${x.cant > 0 ? "+" : ""}${x.cant}</span><span class="row-t"><b>${esc(nombreDe(x.producto_id))}</b><small>${esc(x.nota || x.tipo)}</small></span><span class="tenue xs">${haceTxt(x.fecha)}</span></div>`).join("")}</div>` : `<div class="card">${vacio("Aquí aparecen ventas, usos y ajustes.")}</div>`}
  </section>`;
};
A.admAjustar = el => abrir("admAjuste", { t: el.dataset.t, id: el.dataset.id, dir: "entrada" });
A.admAjDir = el => { modalTop().dir = el.dataset.v; renderModal(); };
MODALES.admAjuste = m => {
  const it = db.obtener(m.t, m.id) || {}, motivos = m.dir === "entrada" ? ["Compra", "Conteo físico", "Devolución"] : ["Conteo físico", "Merma o daño", "Cortesía", "Uso interno"];
  return `${cab("Ajustar existencias", esc(it.nombre))}
  <form data-f="admAjuste" class="adm-mform"><div class="modal-c pila">
    <div class="adm-aj-hoy">${m.t === "esmaltes" ? `<span class="adm-esm-sw" style="--sw:${it.hex}"></span>` : ""}<div><small class="tenue">Hay ahora</small><b class="serif num">${it.stock}</b></div></div>
    <div class="seg seg-b">${[["entrada", "Entra", "plus"], ["salida", "Sale", "minus"]].map(([k, t, i]) => `<button type="button" class="${m.dir === k ? "on" : ""}" data-a="admAjDir" data-v="${k}">${ic(i)}<span>${t}</span></button>`).join("")}</div>
    <div class="g2">${campo("Cantidad", `<input class="inp num" id="adm_aj_c" name="cant" type="number" min="1" step="1" value="1" required autofocus>`)}${campo("Motivo", `<select class="inp" id="adm_aj_m" name="motivo">${motivos.map(x => `<option>${x}</option>`).join("")}</select>`)}</div>
    ${campo("Nota", `<input class="inp" id="adm_aj_n" name="nota" placeholder="Opcional">`)}
  </div><div class="modal-p"><button type="button" class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
};
F.admAjuste = (f, d) => {
  const m = modalTop(), it = db.obtener(m.t, m.id); if (!it) return;
  const c = Math.max(1, Math.round(+d.cant || 1)), delta = m.dir === "entrada" ? c : -c;
  if (it.stock + delta < 0) toast(`Solo había ${it.stock}; quedó en 0`, "alert");
  it.stock = Math.max(0, it.stock + delta);
  db.d.movimientos_inventario.push({ id: uid(), producto_id: it.id, tipo: m.dir, cant: delta, nota: d.motivo + (d.nota ? " · " + d.nota.trim() : ""), fecha: Date.now() });
  db.cambio(); cerrar(); toast(`${it.nombre}: ${it.stock}`, "box");
};
A.admProdEditar = el => abrir("admProducto", { id: el.dataset.id });
A.admProdNuevo = () => abrir("admProducto", { nuevo: true });
MODALES.admProducto = m => {
  const p = m.nuevo ? { nombre: "", marca: "", tipo: tab("admInv", "venta") === "uso" ? "uso" : "venta", precio: 0, costo: 0, stock: 0, minimo: 2, unidad: "u" } : db.obtener("productos", m.id);
  return `${cab(m.nuevo ? "Nuevo producto" : "Editar producto", m.nuevo ? "" : esc(p.nombre))}
  <form data-f="admProd" class="adm-mform"><div class="modal-c pila">
    ${campo("Nombre", `<input class="inp" id="adm_p_n" name="nombre" value="${esc(p.nombre)}" required autofocus>`)}
    <div class="g2">${campo("Marca", `<input class="inp" id="adm_p_m" name="marca" value="${esc(p.marca)}">`)}${campo("Tipo", `<select class="inp" id="adm_p_t" name="tipo"><option value="venta" ${p.tipo === "venta" ? "selected" : ""}>Para vender</option><option value="uso" ${p.tipo === "uso" ? "selected" : ""}>Uso interno</option></select>`)}</div>
    <div class="g2">${campo("Precio de venta (Q)", `<input class="inp num" id="adm_p_p" name="precio" type="number" min="0" step="5" value="${p.precio}">`)}${campo("Costo (Q)", `<input class="inp num" id="adm_p_c" name="costo" type="number" min="0" step="5" value="${p.costo}">`)}</div>
    <div class="g2">${campo("Mínimo para avisar", `<input class="inp num" id="adm_p_min" name="minimo" type="number" min="0" value="${p.minimo}">`)}${campo("Unidad", `<input class="inp" id="adm_p_u" name="unidad" value="${esc(p.unidad)}">`)}</div>
    ${m.nuevo ? campo("Existencia inicial", `<input class="inp num" id="adm_p_s" name="stock" type="number" min="0" value="0">`) : `<p class="tenue small">Las existencias se cambian con «Ajustar» para que quede registro.</p>`}
  </div><div class="modal-p"><button type="button" class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
};
F.admProd = (f, d) => {
  const m = modalTop(), p = m.nuevo ? { id: "p" + uid().slice(0, 5), stock: Math.max(0, +d.stock || 0) } : db.obtener("productos", m.id);
  Object.assign(p, { nombre: d.nombre.trim(), marca: d.marca.trim(), tipo: d.tipo, precio: +d.precio || 0, costo: +d.costo || 0, minimo: +d.minimo || 0, unidad: d.unidad.trim() || "u" });
  if (m.nuevo) db.d.productos.push(p);
  if (p.tipo === "venta" && p.precio && p.precio <= p.costo) toast("El precio de venta no deja ganancia", "alert"); else toast("Producto guardado");
  db.cambio(); cerrar();
};

/* =================== FIDELIDAD =================== */
function tarjetaRegaloHTML(g) {
  const d = g.diseno || "oro";
  return `<div class="regalo regalo-${d}"><div class="regalo-top">${logo(30)}<span>${esc(MARCA.nombre)}</span></div>
    <div class="regalo-m"><small>Tarjeta de regalo</small><b class="serif num">${Q(g.monto || 0)}</b></div>
    <div class="regalo-pie"><span>${g.para ? "Para " + esc(g.para) : "&nbsp;"}${g.de ? `<i>De ${esc(g.de)}</i>` : ""}</span><code>${esc(g.codigo || "GR-····")}</code></div></div>`;
}
const admRegaloVisual = g => typeof tarjetaRegaloSVG === "function" ? tarjetaRegaloSVG(g) : tarjetaRegaloHTML(g);
const admLinkRegalo = g => urlBase() + "#/regalo/" + g.codigo;
ADM_V.fidelidad = () => {
  const t = tab("admFid", "membresias");
  const socias = db.listar("clientas", k => k.membresia), recurrente = sum(socias, k => (membresiaDe(k.id) || {}).precio || 0);
  const regalos = db.listar("tarjetas_regalo"), saldoReg = sum(regalos, g => g.saldo);
  const paqAct = db.listar("paquetes_clienta", paqActivo);
  let cuerpo = "";
  if (t === "membresias") cuerpo = `<div class="adm-sub rev"><h2>Membresías</h2><span class="esp"></span><button class="btn btn-p btn-ch" data-a="admSociaNueva">${ic("plus")}<span>Agregar socia</span></button></div>
    <div class="g2">${db.listar("membresias").map((mb, i) => { const ss = socias.filter(k => k.membresia.membresia_id === mb.id); return `<article class="card adm-mem rev" style="--i:${i + 2};--mc:${mb.color}">
      <div class="fila"><span class="adm-mem-ic">${ic("crown")}</span><div class="row-t"><b class="serif adm-mem-n">${esc(mb.nombre)}</b><small class="tenue">${esc(mb.desc)}</small></div></div>
      <div class="fila"><span class="serif adm-mem-p num">${Q(mb.precio)}</span><span class="tenue small">al mes</span><span class="esp"></span>${chip(`${ss.length} socias`, "listo")}</div>
      <div class="fila-w">${mb.incluye.map(x => chip(`${x.cant} × ${esc(serv(x.servicio_id).nombre)}`)).join("")}${chip(`${mb.descuento} % de descuento`, "ok")}</div>
      <div class="lista adm-mem-l">${ss.map(k => { const us = sum(Object.entries(k.membresia.usos || {}).filter(([kk]) => kk.startsWith(new Date().getMonth() + ":")), ([, v]) => v); return `<div class="row">${admAv(k, 30)}<span class="row-t"><b>${esc(k.nombre)}</b><small>Desde ${fechaCorta(k.membresia.desde)} · ${us} usos este mes</small></span><button class="btn btn-t btn-ch btn-i" data-a="admSociaQuitar" data-id="${k.id}" aria-label="Quitar membresía de ${esc(k.nombre)}">${ic("x")}</button></div>`; }).join("") || `<div class="row tenue small">Todavía sin socias</div>`}</div>
    </article>`; }).join("")}</div>`;
  if (t === "paquetes") cuerpo = `<div class="adm-sub rev"><h2>Paquetes</h2><span class="esp"></span><button class="btn btn-p btn-ch" data-a="admPaqVender">${ic("plus")}<span>Vender paquete</span></button></div>
    <div class="g3">${db.listar("paquetes").map((q, i) => { const normal = paqNormal(q), ses = paqSesiones(q); return `<article class="card adm-paq rev" style="--i:${i + 2}">
      <span class="adm-paq-n serif">${ses}<small>${ses === 1 ? "sesión" : "sesiones"}</small></span><b>${esc(q.nombre)}</b><p class="tenue small">${esc(q.desc || paqResumen(q))}</p>
      <div class="fila"><span class="serif adm-mem-p num">${Q(q.precio)}</span>${normal > q.precio ? `<s class="tenue small num">${Q(normal)}</s>` : ""}<span class="esp"></span><span class="tenue xs">Vence en ${q.vigencia} días</span></div>
    </article>`; }).join("")}</div>
    <div class="adm-sub rev mt-l"><h2>Paquetes activos</h2></div>
    ${paqAct.length ? `<div class="lista rev">${paqAct.map(p => { const q = paqDe(p), vence = p.comprado + q.vigencia * DIA, n = paqSesiones(q), u = paqUsadas(p);
      if (!p.clienta_id) return `<a class="row click" href="${admLinkRegalo(p.regalo)}" target="_blank" rel="noopener"><span class="adm-av-reg">${ic("gift")}</span><span class="row-t"><b>Regalo para ${esc(p.regalo.para)}</b><small>${esc(q.nombre)} · ${esc(p.regalo.codigo)} · sin canjear</small></span>${ic("link")}</a>`;
      const k = cli(p.clienta_id); return `<button class="row click" data-a="admFicha" data-id="${k.id}">${admAv(k, 34)}<span class="row-t"><b>${esc(k.nombre)}</b><small>${esc(q.nombre)} · vence ${fechaCorta(vence)}</small></span><span class="adm-sesiones">${Array.from({ length: n }, (_, i) => `<i class="${i < u ? "us" : ""}"></i>`).join("")}</span><span class="tenue xs num">${u}/${n}</span></button>`; }).join("")}</div>` : `<div class="card">${vacio("Nadie tiene paquetes activos.")}</div>`}`;
  if (t === "regalos") cuerpo = `<div class="adm-sub rev"><h2>Tarjetas de regalo</h2><span class="tenue small">Saldo por canjear ${Q(saldoReg)}</span><span class="esp"></span><button class="btn btn-p btn-ch" data-a="admRegaloNuevo">${ic("gift")}<span>Vender regalo</span></button></div>
    <div class="adm-regalos">${regalos.slice().sort((a, b) => b.creado - a.creado).map((g, i) => `<article class="adm-reg rev" style="--i:${i + 2}">${admRegaloVisual(g)}
      <div class="fila"><div class="row-t"><b class="small">Saldo ${Q(g.saldo)} de ${Q(g.monto)}</b><small class="tenue">${esc(g.para)} · ${fechaCorta(g.creado)}</small></div><a class="btn btn-s btn-ch btn-i" href="${admLinkRegalo(g)}" target="_blank" rel="noopener" aria-label="Abrir tarjeta">${ic("link")}</a></div>
      <div class="barra"><i style="width:${g.monto ? g.saldo / g.monto * 100 : 0}%"></i></div></article>`).join("")}</div>`;
  if (t === "puntos") {
    const top = db.listar("clientas").sort((a, b) => (b.puntos || 0) - (a.puntos || 0)).slice(0, 8), c = cfg();
    cuerpo = `<div class="g2 mt">${admEditable("puntos", "Reglas de puntos y cumpleaños", "star",
      `<div class="adm-reglas"><div><b class="serif num">1</b><small>punto por cada ${Q(c.puntos_cada)}</small></div><div><b class="serif num">${Q(c.valor_punto)}</b><small>vale cada punto</small></div><div><b class="serif num">${c.promo_cumple} %</b><small>en el mes de su cumpleaños</small></div><div><b class="serif num">${lealtad().sellos}</b><small>sellos para: ${esc(lealtad().premio)}</small></div><div><b class="serif num">${db.listar("clientas", k => k.wallet && (k.wallet.apple || k.wallet.google)).length}</b><small>tarjetas guardadas en Wallet</small></div></div>`,
      `<div class="g2">${campo("Un punto por cada (Q)", `<input class="inp num" id="adm_pt_c" name="puntos_cada" type="number" min="1" value="${c.puntos_cada}">`)}${campo("Valor del punto (Q)", `<input class="inp num" id="adm_pt_v" name="valor_punto" type="number" min="0" step="0.05" value="${c.valor_punto}">`)}</div>${campo("Descuento de cumpleaños (%)", `<input class="inp num" id="adm_pt_b" name="promo_cumple" type="number" min="0" max="100" value="${c.promo_cumple}">`)}<div class="g2">${campo("Sellos para el premio", `<input class="inp num" id="adm_pt_s" name="sellos" type="number" min="3" max="12" value="${lealtad().sellos}">`)}${campo("Premio", `<input class="inp" id="adm_pt_p" name="premio" value="${esc(lealtad().premio)}">`)}</div>`, 2)}
      <section class="rev" style="--i:3"><div class="adm-sub"><h2>Más puntos</h2></div><div class="lista">${top.map((k, i) => `<button class="row click" data-a="admFicha" data-id="${k.id}"><span class="adm-rank num">${i + 1}</span>${admAv(k, 32)}<span class="row-t"><b>${esc(k.nombre)}</b><small>Equivale a ${Q((k.puntos || 0) * c.valor_punto)}</small></span><b class="num">${(k.puntos || 0).toLocaleString("en-US")}</b></button>`).join("")}</div></section></div>`;
  }
  return `${admCab("Fidelidad", "Que vuelvan, y que vuelvan seguido")}
  <div class="g4 adm-kpis">${admKpi("Socias activas", socias.length, "", "Membresías", 0)}${admKpi("Ingreso fijo al mes", recurrente, "q", "Por membresías", 1)}${admKpi("Paquetes activos", paqAct.length, "", "", 2)}${admKpi("Saldo en regalos", saldoReg, "q", `${regalos.length} tarjetas`, 3)}</div>
  <div class="rev adm-tabs">${seg("admFid", [["membresias", "Membresías", "crown"], ["paquetes", "Paquetes", "box"], ["regalos", "Regalos", "gift"], ["puntos", "Puntos", "star"]], t)}</div>
  ${cuerpo}`;
};
A.admSociaQuitar = async el => {
  const k = cli(el.dataset.id);
  if (await confirmar({ titulo: "¿Quitar la membresía?", texto: `${esc(k.nombre)} deja de tener los beneficios desde hoy.`, si: "Quitar", peligro: true })) { k.membresia = null; db.cambio(); toast("Membresía quitada"); }
};
A.admSociaNueva = () => abrir("admSocia", {});
MODALES.admSocia = () => `${cab("Agregar socia", "Se cobra la primera mensualidad")}
  <form data-f="admSocia" class="adm-mform"><div class="modal-c pila">
    ${campo("Membresía", `<select class="inp" id="adm_so_m" name="mem">${db.listar("membresias").map(m => `<option value="${m.id}">${esc(m.nombre)} · ${Q(m.precio)} al mes</option>`).join("")}</select>`)}
    ${campo("Clienta", `<select class="inp" id="adm_so_k" name="k" required>${db.listar("clientas", k => !k.membresia).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(k => `<option value="${k.id}">${esc(k.nombre)} · ${telFmt(k.tel)}</option>`).join("")}</select>`)}
    ${campo("Forma de pago", admSelMetodo("adm_so_mt"))}
  </div><div class="modal-p"><button type="button" class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p">Cobrar y agregar</button></div></form>`;
const admSelMetodo = id => `<select class="inp" id="${id}" name="metodo">${["tarjeta", "efectivo", "transferencia", "link"].map(k => `<option value="${k}">${METODOS[k][0]}</option>`).join("")}</select>`;
F.admSocia = (f, d) => {
  const k = cli(d.k), mb = db.obtener("membresias", d.mem); if (!k.id || !mb) return;
  k.membresia = { membresia_id: mb.id, desde: Date.now(), usos: {} };
  registrarCobro(null, { clienta_id: k.id, lineas: [{ tipo: "membresia", ref: mb.id, nombre: "Membresía " + mb.nombre, precio: mb.precio, cant: 1, estilista_id: null }], metodos: [{ metodo: d.metodo, monto: mb.precio }] });
  cerrar(); toast(`${k.nombre.split(" ")[0]} ya es socia de ${mb.nombre}`, "crown");
};
A.admPaqVender = () => abrir("vender", { modo: "combo" });
A.admRegaloNuevo = () => abrir("vender", { modo: "monto" });
MODALES.admRegaloListo = m => {
  const g = db.obtener("tarjetas_regalo", m.id); if (!g) return cab("Tarjeta");
  const link = admLinkRegalo(g), txt = `${g.para ? "Para " + g.para + ": " : ""}una tarjeta de regalo de ${Q(g.monto)} en ${MARCA.nombre}. ${g.mensaje ? "«" + g.mensaje + "» " : ""}Ábrela aquí: ${link}`;
  return `${cab("Tarjeta lista", "Cobrada y activa")}<div class="modal-c pila-l adm-listo">
    ${admRegaloVisual(g)}
    <div class="fila adm-listo-qr"><div class="adm-qr" data-qr="${esc(link)}"></div><div class="pila"><b>Para canjear en recepción</b><span class="tenue small">Código <b class="num">${g.codigo}</b></span><button class="btn btn-s btn-ch" data-a="admCopiar" data-tx="${esc(link)}">${ic("copy")}<span>Copiar link</span></button></div></div>
  </div><div class="modal-p"><a class="btn btn-s" href="${link}" target="_blank" rel="noopener">${ic("eye")}<span>Ver</span></a><a class="btn btn-p" href="${waLink(g.tel || MARCA.whatsapp, txt)}" target="_blank" rel="noopener">${ic("msg")}<span>Enviar por WhatsApp</span></a></div>`;
};
A.admCopiar = el => { navigator.clipboard && navigator.clipboard.writeText(el.dataset.tx).then(() => toast("Link copiado", "copy"), () => toast("No se pudo copiar", "alert")); };

/* =================== MENSAJES =================== */
const ADM_PLANT = [["msj_confirmacion", "Confirmación de cita", "check"], ["msj_recordatorio", "Recordatorio de mañana", "bell"], ["msj_cumple", "Cumpleaños", "cake"], ["msj_retoque", "Retoque", "refresh"], ["msj_extranamos", "Te extrañamos", "heart"]];
const admVars = t => esc(t).replace(/\{(\w+)\}/g, '<span class="adm-var">$1</span>');
function admEnvios(tipo) {
  const c = cfg(), hoy = Date.now();
  if (tipo === "manana") return citasDia(dia0() + DIA + 2 * HORA, x => ["confirmada", "reservada"].includes(x.estado)).map(x => { const k = cli(x.clienta_id); return { k, sub: `${hora(x.ini)} · ${nombresServ(x)}`, tx: textoPlantilla(c.msj_recordatorio, x, k), tipo: "recordatorio" }; });
  if (tipo === "cumple") return db.listar("clientas", k => esCumpleMes(k.id)).map(k => { const [, d] = k.cumple.split("-"); return { k, sub: cumpleEn(k.id, 0) ? "Cumple hoy" : `Cumple el ${+d}`, tx: textoPlantilla(c.msj_cumple, null, k), tipo: "cumple" }; });
  if (tipo === "retoque") return retoques().map(r => ({ k: r.clienta, sub: `${r.cat.nombre} · ${r.toca < hoy ? "vencido" : diaRel(r.toca).toLowerCase()}`, tx: textoPlantilla(c.msj_retoque.replace("{categoria}", r.cat.nombre.toLowerCase()), null, r.clienta), tipo: "retoque" }));
  return db.listar("clientas").map(k => ({ k, u: ultimaVisita(k.id) })).filter(x => x.u && hoy - x.u.ini > 60 * DIA && !db.listar("citas", c2 => c2.clienta_id === x.k.id && c2.ini > hoy && activa(c2)).length)
    .map(x => ({ k: x.k, sub: `Última visita hace ${Math.round((hoy - x.u.ini) / DIA)} días`, tx: textoPlantilla(c.msj_extranamos, null, x.k), tipo: "extranamos" }));
}
const admEnviadoHoy = (k, tipo) => db.listar("mensajes", x => x.clienta_id === k && x.tipo === tipo && x.fecha >= dia0()).length > 0;
ADM_V.mensajes = () => {
  const t = tab("admEnv", "manana"), l = admEnvios(t), c = cfg();
  const hist = db.listar("mensajes").sort((a, b) => b.fecha - a.fecha).slice(0, 8);
  return `${admCab("Mensajes", "WhatsApp listo para enviar con un toque")}
  <div class="rev adm-tabs">${seg("admEnv", [["manana", "Recordar mañana", "bell"], ["cumple", "Cumpleaños", "cake"], ["retoque", "Retoques", "refresh"], ["ausentes", "Te extrañamos", "heart"]], t)}</div>
  ${l.length ? `<div class="lista rev" style="--i:1">${l.map(x => { const env = admEnviadoHoy(x.k.id, x.tipo); return `<div class="row">${admAv(x.k, 36)}<span class="row-t"><b>${esc(x.k.nombre)}</b><small>${esc(x.sub)}</small></span>
    ${env ? chip(ic("check") + "Enviado", "ok") : ""}<a class="btn ${env ? "btn-s" : "btn-a"} btn-ch" href="${waLink(x.k.tel, x.tx)}" target="_blank" rel="noopener" data-a="admEnviado" data-k="${x.k.id}" data-tipo="${x.tipo}" data-tx="${esc(x.tx)}">${ic("msg")}<span>${env ? "Otra vez" : "Enviar"}</span></a></div>`; }).join("")}</div>` : `<div class="card rev">${vacio("Nadie en esta lista por ahora.")}</div>`}
  <div class="adm-sub rev mt-l"><h2>Plantillas</h2><span class="tenue small">Las palabras en dorado se llenan solas</span></div>
  <div class="g2">${ADM_PLANT.map(([k, t, i], n) => admEditable(k, t, i, `<p class="adm-plant">${admVars(c[k] || "")}</p>`,
    `${campo("Texto", `<textarea class="inp" id="adm_${k}" name="texto" rows="4">${esc(c[k] || "")}</textarea>`, "Puedes usar {nombre}, {salon}, {fecha}, {hora}, {servicio}, {link} y {reservar}")}`, n + 2)).join("")}</div>
  ${hist.length ? `<div class="adm-sub rev mt-l"><h2>Enviados</h2></div><div class="lista rev">${hist.map(x => { const k = x.clienta_id ? cli(x.clienta_id) : { nombre: "—" }; return `<div class="row"><span class="adm-al-ic ok">${ic("send")}</span><span class="row-t"><b>${esc(k.nombre)}</b><small>${esc(x.texto)}</small></span><span class="tenue xs">${haceTxt(x.fecha)}</span></div>`; }).join("")}</div>` : ""}`;
};
A.admEnviado = el => { registrarMensaje(cli(el.dataset.k), el.dataset.tipo, el.dataset.tx); setTimeout(() => pedirRender(true), 400); };

/* =================== REPORTES =================== */
function admReporte(n) {
  const desde = dia0() - (n - 1) * DIA, antes = desde - n * DIA;
  const pg = db.listar("pagos", p => p.fecha >= desde), pgA = db.listar("pagos", p => p.fecha >= antes && p.fecha < desde);
  const r = { n, desde, pg, ventas: sum(pg, p => p.total), ventasA: sum(pgA, p => p.total) };
  const conCita = pg.filter(p => p.cita_id); r.ticket = conCita.length ? sum(conCita, p => p.total) / conCita.length : 0; r.atendidas = conCita.length;
  r.propinas = sum(pg, p => sum(Object.values(p.propinas || {})));
  r.dias = Array.from({ length: n }, (_, i) => { const d = dia0(desde + i * DIA + 2 * HORA); return { d, v: sum(pg.filter(p => p.fecha >= d && p.fecha < d + DIA), p => p.total) }; });
  r.cat = {}; r.serv = {}; r.est = {}; r.met = {}; r.prod = {};
  pg.forEach(p => {
    p.lineas.forEach(l => {
      const v = l.precio * l.cant;
      if (l.tipo === "servicio") { const s = serv(l.ref); r.cat[s.cat] = (r.cat[s.cat] || 0) + v; (r.serv[l.ref] = r.serv[l.ref] || { v: 0, n: 0 }).v += v; r.serv[l.ref].n++; if (l.estilista_id) r.est[l.estilista_id] = (r.est[l.estilista_id] || 0) + v; }
      else if (l.tipo === "producto") { (r.prod[l.ref] = r.prod[l.ref] || { v: 0, n: 0 }).v += v; r.prod[l.ref].n += l.cant; }
    });
    p.metodos.forEach(m => r.met[m.metodo] = (r.met[m.metodo] || 0) + m.monto);
  });
  const prim = admPrimerPago(), ks = [...new Set(pg.map(p => p.clienta_id).filter(Boolean))];
  r.clientas = ks.length; r.nuevas = ks.filter(k => prim[k] >= desde).length;
  const cs = db.listar("citas", c => c.ini >= desde && c.ini < Date.now());
  const pag = cs.filter(c => c.estado === "pagada");
  r.reagenda = pag.length ? pag.filter(c => db.d.citas.some(x => x.clienta_id === c.clienta_id && x.id !== c.id && x.ini > c.ini && x.ini - c.ini < 60 * DIA && activa(x))).length / pag.length * 100 : 0;
  r.faltas = cs.filter(c => c.estado === "falta").length; r.canceladas = cs.filter(c => c.estado === "cancelada").length;
  r.faltasPct = cs.length ? r.faltas / cs.length * 100 : 0;
  r.horas = []; for (let h = 8; h <= 19; h++) r.horas.push(h);
  r.calor = Array.from({ length: 7 }, () => r.horas.map(() => 0));
  cs.filter(activa).forEach(c => { const d = new Date(c.ini), j = r.horas.indexOf(d.getHours()); if (j >= 0) r.calor[(d.getDay() + 6) % 7][j]++; });
  return r;
}
function admGrafDias(dias, n) {
  const max = Math.max(1, ...dias.map(d => d.v)), paso = n <= 7 ? 1 : n <= 30 ? 6 : 15;
  return `<div class="adm-graf" role="img" aria-label="Ventas por día"><div class="adm-graf-y num"><span>${Q(Math.round(max))}</span><span>${Q(Math.round(max / 2))}</span><span>Q0</span></div>
    <div class="adm-graf-b ${n > 30 ? "fina" : ""}">${dias.map((d, i) => { const f = new Date(d.d); return `<div class="adm-gb ${d.d === dia0() ? "hoy" : ""}" title="${fechaCorta(d.d)} · ${Q(d.v)}"><i style="height:${Math.max(d.v ? 2 : 0, d.v / max * 100).toFixed(1)}%"></i>${(n - 1 - i) % paso === 0 ? `<span>${n <= 7 ? DIAS_C[f.getDay()] : f.getDate() + " " + MESES_C[f.getMonth()]}</span>` : ""}</div>`; }).join("")}</div></div>`;
}
ADM_V.reportes = () => {
  const n = +tab("admRango", "30"), r = admReporte(n);
  const delta = r.ventasA ? (r.ventas - r.ventasA) / r.ventasA * 100 : 0;
  const totMet = sum(Object.values(r.met));
  const metodos = Object.entries(r.met).sort((a, b) => b[1] - a[1]);
  const maxC = Math.max(1, ...r.calor.flat());
  return `${admCab("Reportes", `Últimos ${n} días`, `${seg("admRango", [["7", "7 días"], ["30", "30 días"], ["90", "90 días"]], String(n))}<button class="btn btn-s btn-ch" data-a="admCSV">${ic("download")}<span>CSV</span></button>`)}
  <div class="g4 adm-kpis">
    ${admKpi("Ventas", r.ventas, "q", `<span class="${delta >= 0 ? "adm-sube" : "adm-baja"}">${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta))} %</span> vs. los ${n} días anteriores`, 0)}
    ${admKpi("Ticket promedio", r.ticket, "q", `${r.atendidas} citas cobradas`, 1)}
    ${admKpi("Clientas atendidas", r.clientas, "", `${r.nuevas} nuevas · ${r.clientas - r.nuevas} que regresan`, 2)}
    ${admKpi("Vuelven a agendar", r.reagenda, "%", `${admPct(r.faltasPct)} no vino · ${r.canceladas} canceladas`, 3)}
  </div>
  <section class="card rev adm-r" style="--i:4"><div class="card-t">${ic("chart")}<h2>Ventas por día</h2><span class="esp"></span><span class="tenue small">Propinas ${Q(r.propinas)}</span></div>${admGrafDias(r.dias, n)}</section>
  <div class="g2 mt">
    <section class="card rev" style="--i:5"><div class="card-t">${ic("grid")}<h2>Por categoría</h2></div>${admBarrasH(CATEGORIAS.map((c, i) => ({ t: c.nombre, v: r.cat[c.id] || 0, c: ["var(--acento)", "var(--tinta)", "#B9A3C8", "#A9BFA4"][i], sub: r.ventas ? admPct((r.cat[c.id] || 0) / r.ventas * 100) + " de las ventas" : "" })).sort((a, b) => b.v - a.v))}</section>
    <section class="card rev" style="--i:6"><div class="card-t">${ic("users")}<h2>Por estilista</h2></div>${admBarrasH(db.listar("estilistas").map(e => ({ t: e.nombre, v: r.est[e.id] || 0, c: e.color, pre: avatar(e, 22) })).sort((a, b) => b.v - a.v))}</section>
    <section class="card rev" style="--i:7"><div class="card-t">${ic("sparkles")}<h2>Servicios más vendidos</h2></div>${admBarrasH(Object.entries(r.serv).sort((a, b) => b[1].v - a[1].v).slice(0, 8).map(([id, x]) => ({ t: serv(id).nombre, v: x.v, sub: `${x.n} veces` })))}</section>
    <section class="card rev" style="--i:8"><div class="card-t">${ic("card")}<h2>Formas de pago</h2></div>
      <div class="adm-met">${metodos.map(([k, v]) => `<i style="flex:${v};background:${ADM_MET_COL[k] || "var(--tenue)"}" title="${(METODOS[k] || [k])[0]} ${Q(v)}"></i>`).join("")}</div>
      <div class="adm-leyenda">${metodos.map(([k, v]) => `<div class="fila small"><i style="background:${ADM_MET_COL[k] || "var(--tenue)"}"></i><span>${(METODOS[k] || [k])[0]}</span><span class="esp"></span><b class="num">${Q(v)}</b><span class="tenue num adm-pctc">${totMet ? admPct(v / totMet * 100) : ""}</span></div>`).join("")}</div></section>
    <section class="card rev" style="--i:9"><div class="card-t">${ic("clock")}<h2>Horas pico</h2><span class="esp"></span><span class="tenue xs">Más oscuro = más citas</span></div>
      <div class="adm-calor" role="table" aria-label="Citas por día y hora"><span></span>${r.horas.map(h => `<span class="adm-calor-h">${h % 2 === 0 ? (h % 12 || 12) + (h < 12 ? "a" : "p") : ""}</span>`).join("")}
      ${r.calor.map((fila, d) => `<span class="adm-calor-d">${DIAS_C[(d + 1) % 7]}</span>${fila.map((v, j) => `<i style="--k:${(v / maxC).toFixed(2)}" title="${DIAS[(d + 1) % 7]} ${r.horas[j]}:00 · ${v} citas"></i>`).join("")}`).join("")}</div></section>
    <section class="card rev" style="--i:10"><div class="card-t">${ic("bag")}<h2>Productos más vendidos</h2></div>${admBarrasH(Object.entries(r.prod).sort((a, b) => b[1].v - a[1].v).slice(0, 6).map(([id, x]) => ({ t: (db.obtener("productos", id) || { nombre: "—" }).nombre, v: x.v, sub: `${x.n} unidades` })))}</section>
  </div>`;
};
A.admCSV = () => {
  const n = +tab("admRango", "30"), r = admReporte(n);
  const filas = [["Fecha", "Hora", "Clienta", "Conceptos", "Personal", "Formas de pago", "Descuento", "Total", "Propina"]];
  r.pg.slice().sort((a, b) => a.fecha - b.fecha).forEach(p => {
    const f = new Date(p.fecha);
    filas.push([`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`, hora(p.fecha), p.clienta_id ? cli(p.clienta_id).nombre : "", p.lineas.map(l => l.nombre).join(" + "),
      [...new Set(p.lineas.map(l => l.estilista_id).filter(Boolean))].map(id => est(id).nombre).join(" + "), p.metodos.map(m => (METODOS[m.metodo] || [m.metodo])[0] + " " + m.monto).join(" + "), p.descuento || 0, p.total, sum(Object.values(p.propinas || {}))]);
  });
  descargar(`ventas-${n}-dias.csv`, csv(filas)); toast("CSV descargado", "download");
};

/* =================== AJUSTES =================== */
ADM_V.ajustes = () => {
  const c = cfg(), m = MARCA, orden = [1, 2, 3, 4, 5, 6, 0];
  const draft = admFi("admEstDraft", null), estac = admFi("admEd", null) === "estaciones" && draft ? draft : db.listar("estaciones");
  return `${admCab("Ajustes", esc(MARCA.nombre))}
  <div class="g2">
    <section class="card rev adm-marca" style="--i:1"><div class="card-t">${ic("sparkles")}<h2>Marca</h2></div>
      <div class="fila">${logo(64, true)}<div class="row-t"><b class="serif adm-est-n">${esc(m.nombre)}</b><small class="tenue">${esc(m.lema)}</small></div></div>
      <div class="adm-paleta">${["fondo", "acento", "nude", "tinta"].map(k => `<span style="background:${m.colores[k]}" title="${k}"></span>`).join("")}<small class="tenue">${esc(m.fuentes.titulo)} + ${esc(m.fuentes.texto)}</small></div>
      <div class="pila small"><span class="fila">${ic("pin", "tenue")}${esc(m.direccion)}</span><span class="fila">${ic("phone", "tenue")}+${esc(m.whatsapp)}</span><span class="fila">${ic("insta", "tenue")}@${esc(m.instagram)}</span></div>
      <p class="tenue xs">El nombre, los colores y el logo se cambian en marca.js.</p></section>
    ${admEditable("horario", "Horario del salón", "clock",
      `<div class="adm-horario">${orden.map(d => { const h = c.horario[d]; return `<div class="fila"><span class="adm-dn">${DIAS[d]}</span><span class="esp"></span>${h ? `<span class="num">${horaMin(h[0])} – ${horaMin(h[1])}</span>` : `<span class="tenue">Cerrado</span>`}</div>`; }).join("")}</div>`,
      `<div class="adm-horario">${orden.map(d => { const h = c.horario[d]; return `<div class="adm-hor-e"><label class="check"><input type="checkbox" id="adm_h_o${d}" name="o${d}" ${h ? "checked" : ""}> <span class="adm-dn">${DIAS[d]}</span></label><input class="inp" type="time" id="adm_h_a${d}" name="a${d}" value="${admHHMM(h ? h[0] : 540)}" aria-label="Abre ${DIAS[d]}"><input class="inp" type="time" id="adm_h_b${d}" name="b${d}" value="${admHHMM(h ? h[1] : 1080)}" aria-label="Cierra ${DIAS[d]}"></div>`; }).join("")}</div>`, 2)}
    ${admEditable("reglas", "Reservas y cancelaciones", "cal",
      `<div class="adm-reglas"><div><b class="serif num">${c.horas_cancelar} h</b><small>antes para cancelar o mover sin aviso</small></div><div><b class="serif num">${c.intervalo} min</b><small>entre horarios ofrecidos</small></div><div><b class="serif num">${db.listar("servicios", s => s.anticipo).length}</b><small>servicios piden anticipo</small></div></div>
       <div class="fila-w mt">${db.listar("servicios", s => s.anticipo).map(s => chip(`${esc(s.nombre)} · ${Q(s.anticipo)}`, "listo")).join("")}</div>`,
      `<div class="g2">${campo("Horas para cancelar", `<input class="inp num" id="adm_r_hc" name="horas_cancelar" type="number" min="0" max="72" value="${c.horas_cancelar}">`)}${campo("Horarios cada", `<select class="inp" id="adm_r_iv" name="intervalo">${[15, 30, 60].map(v => `<option value="${v}" ${c.intervalo === v ? "selected" : ""}>${v} minutos</option>`).join("")}</select>`)}</div><p class="tenue small">El anticipo de cada servicio se cambia en Servicios.</p>`, 3)}
    ${admEditable("estaciones", "Estaciones", "grid",
      `<div class="fila-w">${estac.map(x => chip(`${esc(x.nombre)}`)).join("")}</div><p class="tenue xs mt">${estac.length} lugares de trabajo. Recepción los asigna sola al empezar.</p>`,
      `<div class="lista adm-est-l">${estac.map((x, i) => `<div class="row"><span class="row-t"><b>${esc(x.nombre)}</b><small>${TIPOS_ESTACION[x.tipo]}</small></span><button type="button" class="btn btn-t btn-ch btn-i" data-a="admEstQuitar" data-n="${i}" aria-label="Quitar ${esc(x.nombre)}">${ic("trash")}</button></div>`).join("")}</div>
       <div class="adm-est-add"><input class="inp" id="adm_x_nombre" placeholder="Nombre, ej. Silla 4" data-libre="0" aria-label="Nombre de la estación"><select class="inp" id="adm_x_tipo" data-libre="0" aria-label="Tipo">${Object.entries(TIPOS_ESTACION).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select><button type="button" class="btn btn-s" data-a="admEstAgregar">${ic("plus")}<span>Agregar</span></button></div>`, 4)}
    ${admEditable("banco", "Datos para transferencia", "bank", `<p class="tx2">${esc(c.banco)}</p><p class="tenue xs mt">Se muestran a la clienta al pagar por transferencia.</p>`,
      campo("Banco, cuenta y nombre", `<textarea class="inp" id="adm_b" name="banco">${esc(c.banco)}</textarea>`), 5)}
    ${admEditable("pins", "PIN de entrada", "lock",
      `<div class="adm-reglas"><div><b class="num">${c.pins.recepcion}</b><small>Recepción</small></div><div><b class="num">${c.pins.estilista}</b><small>Estilista</small></div><div><b class="num">${c.pins.admin}</b><small>Administración</small></div></div>`,
      `<div class="g3">${[["recepcion", "Recepción"], ["estilista", "Estilista"], ["admin", "Administración"]].map(([k, t]) => campo(t, `<input class="inp num" id="adm_pin_${k}" name="${k}" inputmode="numeric" maxlength="6" value="${c.pins[k]}">`)).join("")}</div><p class="tenue xs">De 4 a 6 números.</p>`, 6)}
    <section class="card rev adm-peligro" style="--i:7"><div class="card-t">${ic("refresh")}<h2>Reiniciar la demo</h2></div>
      <p class="tx2 small">Vuelven las clientas, citas y ventas de ejemplo. Úsalo antes de cada presentación.</p>
      <button class="btn btn-peligro" data-a="admReiniciar">${ic("refresh")}<span>Reiniciar demo</span></button></section>
  </div>`;
};
A.admEstQuitar = el => {
  const d = admFi("admEstDraft", []), x = d[+el.dataset.n]; if (!x) return;
  if (db.listar("citas", c => c.estado === "en_servicio" && c.estacion_id === x.id).length) toast(`${x.nombre} está ocupada ahora; se libera al terminar`, "alert");
  d.splice(+el.dataset.n, 1); render();
};
A.admEstAgregar = () => {
  const n = $("#adm_x_nombre").value.trim(), t = $("#adm_x_tipo").value;
  if (!n) { toast("Escribe el nombre de la estación", "alert"); $("#adm_x_nombre").focus(); return; }
  admFi("admEstDraft", []).push({ id: "x" + uid().slice(0, 5), nombre: n, tipo: t }); render();
};
F.admAj = (f, d) => {
  const k = f.dataset.k, c = cfg();
  if (k === "horario") [0, 1, 2, 3, 4, 5, 6].forEach(x => { if (!d["o" + x]) { c.horario[x] = null; return; } const a = admMin(d["a" + x]), b = admMin(d["b" + x]); c.horario[x] = b > a ? [a, b] : [a, a + 60]; if (b <= a) toast(`${DIAS[x]}: la hora de cierre era antes de abrir`, "alert"); });
  else if (k === "reglas") { c.horas_cancelar = clamp(+d.horas_cancelar || 0, 0, 72); c.intervalo = +d.intervalo || 15; }
  else if (k === "estaciones") { db.d.estaciones = admFi("admEstDraft", db.d.estaciones); ui.filtros.admEstDraft = null; }
  else if (k === "banco") c.banco = d.banco.trim();
  else if (k === "pins") ["recepcion", "estilista", "admin"].forEach(r => { const v = String(d[r] || "").replace(/\D/g, ""); if (v.length >= 4 && v.length <= 6) c.pins[r] = v; else toast(`El PIN de ${({ recepcion: "recepción", estilista: "estilista", admin: "administración" })[r]} necesita de 4 a 6 números; se dejó el anterior`, "alert"); });
  else if (k === "puntos") { c.puntos_cada = Math.max(1, +d.puntos_cada || 10); c.valor_punto = Math.max(0, +d.valor_punto || 0); c.promo_cumple = clamp(+d.promo_cumple || 0, 0, 100); c.lealtad = Object.assign({}, lealtad(), { sellos: clamp(+d.sellos || 8, 3, 12), premio: String(d.premio || "").trim() || lealtad().premio }); }
  else if (k.startsWith("msj_")) c[k] = d.texto.trim();
  ui.filtros.admEd = null; db.cambio(); toast("Guardado");
};
A.admReiniciar = async () => {
  if (await confirmar({ titulo: "¿Reiniciar la demo?", texto: "Vuelven los datos de ejemplo y se pierde lo que se haya cambiado.", si: "Reiniciar", peligro: true })) {
    db.reiniciar(); ui.filtros = {}; render(); toast("Demo reiniciada", "refresh");
  }
};
