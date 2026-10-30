"use strict";
/* ============================================================
   Recepción: tablero en vivo, agenda, estaciones, lista de espera,
   nueva cita, cobro, recibo, caja y ficha de belleza.
   ============================================================ */
ROL_DE.recepcion = "recepcion"; CLASE_RUTA.recepcion = "staff";

const RC = { timer: null };
function arrancarReloj() {
  if (RC.timer) return;
  RC.timer = setInterval(() => { const r = ruta().r; if (r === "recepcion" || r === "estilista") pedirRender(false); }, 30000);
}
const mt = () => modalTop();
const avCli = (k, t = 36) => avatar({ nombre: k.nombre, color: "color-mix(in srgb, var(--acento) 78%, var(--tinta))" }, t);
const miniDiseno = (d, t = 56) => d && typeof manoSVG === "function" ? `<span class="rc-mini" aria-label="Diseño de uñas">${manoSVG(d, { tam: t, pies: d.pies })}</span>` : "";
const COLS = [["llegar", "Por llegar", "cal"], ["espera", "En espera", "coffee"], ["servicio", "En servicio", "sparkles"], ["cobrar", "Por cobrar", "receipt"]];
const colDe = c => ({ reservada: "llegar", confirmada: "llegar", llego: "espera", en_servicio: "servicio", terminada: "cobrar" })[c.estado];
const totalCuenta = c => totalConArte(c) + sum(c.productos || [], p => (db.obtener("productos", p.producto_id) || { precio: 0 }).precio * p.cant);

function poseDe(c) {
  if (c.estado !== "en_servicio") return null;
  const corr = c.t.empezo ? c.t.empezo - c.ini : 0, ahora = Date.now();
  for (const i of c.items) {
    const s = serv(i.servicio_id); if (!s.pose) continue;
    const a = i.ini + corr + s.pose.ini * MIN, b = a + s.pose.min * MIN;
    if (ahora >= a && ahora < b) return { fin: b };
  }
  return null;
}
function insignias(k) {
  let h = "";
  if (k.vip) h += chip(ic("crown") + "VIP", "oro");
  if (k.alergias) h += chip(ic("alert") + esc(k.alergias), "malo");
  if (cumpleEn(k.id, 0)) h += chip(ic("cake") + "Cumple hoy", "listo");
  else if (esCumpleMes(k.id)) h += chip(ic("cake") + "Cumple este mes", "listo");
  const mb = membresiaDe(k.id); if (mb) h += chip(ic("crown") + esc(mb.nombre));
  return h;
}

/* ---------- vista principal ---------- */
VISTAS.recepcion = () => {
  const hoyL = citasDia();
  const t = tab("rcTab", "tablero");
  const enSalon = hoyL.filter(c => ["llego", "en_servicio"].includes(c.estado)).length;
  const vendido = sum(db.listar("pagos", p => p.fecha >= dia0()), p => p.total);
  const porCobrar = sum(hoyL.filter(c => c.estado === "terminada"), totalCuenta);
  const manana = citasDia(Date.now() + DIA).filter(c => !c.recordado).length;
  const espera = db.listar("lista_espera").length;
  return `${barraStaff("recepcion")}<main class="cont rc">
    <div class="rc-head rev">
      <div><p class="eyebrow">${esc(fechaLarga(Date.now()))}</p><h1 class="h2">Recepción</h1></div>
      <span class="esp"></span>
      <div class="rc-head-acc">
        <button class="btn btn-s btn-ch" data-a="rcCaja">${ic("cash")}<span>Caja</span></button>
        <button class="btn btn-s btn-ch" data-a="rcVender">${ic("gift")}<span>Combos y regalos</span></button>
        <button class="btn btn-s btn-ch" data-a="rcRecordatorios">${ic("bell")}<span>Mañana</span>${manana ? `<b class="rc-badge">${manana}</b>` : ""}</button>
        <button class="btn btn-s btn-ch" data-a="rcQR">${ic("qr")}<span>Llegó por QR</span></button>
        <button class="btn btn-s btn-ch" data-a="rcWalkin">${ic("door")}<span>Sin cita</span></button>
        <button class="btn btn-p btn-ch" data-a="rcNueva">${ic("plus")}<span>Nueva cita</span></button>
      </div>
    </div>
    <div class="rc-kpis">
      <div class="card kpi rev" style="--i:1"><small>Citas de hoy</small><b data-cuenta="${hoyL.length}">${hoyL.length}</b></div>
      <div class="card kpi rev" style="--i:2"><small>En el salón ahora</small><b data-cuenta="${enSalon}">${enSalon}</b></div>
      <div class="card kpi rev" style="--i:3"><small>Por cobrar</small><b data-cuenta="${porCobrar}" data-fmt="q">${Q(porCobrar)}</b></div>
      <div class="card kpi rev" style="--i:4"><small>Vendido hoy</small><b data-cuenta="${vendido}" data-fmt="q">${Q(vendido)}</b></div>
    </div>
    <div class="rc-tabs rev" style="--i:3">${seg("rcTab", [["tablero", "Tablero", "grid"], ["agenda", "Agenda", "cal"], ["estaciones", "Estaciones", "pin"], ["espera", "Espera" + (espera ? ` · ${espera}` : ""), "list"]], t)}
      <span class="chip ok vivo"><span class="punto"></span>En vivo</span></div>
    ${t === "agenda" ? vAgenda() : t === "estaciones" ? vEstaciones() : t === "espera" ? vEspera() : vTablero(hoyL)}
  </main>`;
};
DESPUES.recepcion = (p, cambio) => { arrancarReloj(); if (cambio) contarArriba($("#app")); };

/* ---------- tablero ---------- */
function vTablero(hoyL) {
  const g = { llegar: [], espera: [], servicio: [], cobrar: [] };
  hoyL.forEach(c => { const k = colDe(c); if (k) g[k].push(c); });
  g.espera.sort((a, b) => (a.t.llego || 0) - (b.t.llego || 0));
  g.servicio.sort((a, b) => (a.t.empezo || 0) - (b.t.empezo || 0));
  const on = tab("rcCol", "llegar");
  const vacioTxt = { llegar: "Nadie más por llegar", espera: "Sala de espera vacía", servicio: "Nadie en servicio", cobrar: "Todo cobrado" };
  return `<div class="rc-colseg">${seg("rcCol", COLS.map(([k, t]) => [k, `${t} <b class="rc-n">${g[k].length}</b>`]), on)}</div>
    <div class="rc-board">${COLS.map(([k, t, i], n) => `<section class="rc-col rev ${k === on ? "on" : ""} rc-col-${k}" style="--i:${n + 4}" aria-label="${t}">
      <header class="rc-col-h">${ic(i)}<h2>${t}</h2><span class="rc-n">${g[k].length}</span></header>
      <div class="rc-col-c">${g[k].length ? g[k].map(tarjeta).join("") : `<p class="rc-vacia">${vacioTxt[k]}</p>`}</div></section>`).join("")}</div>`;
}
function tarjeta(c) {
  const k = cli(c.clienta_id), col = colDe(c), ahora = Date.now();
  let meta = "", acc = "", extra = "";
  if (col === "llegar") {
    const tarde = ahora > c.ini + 10 * MIN;
    meta = tarde ? chip(ic("clock") + "Tarde " + minTxt(c.ini), "aviso") : chip(ESTADOS[c.estado].t, ESTADOS[c.estado].c);
    if (c.origen === "en_linea") meta += chip(ic("sparkles") + "En línea");
    acc = `<button class="btn btn-p btn-ch" data-a="rcLlego" data-id="${c.id}">${ic("in")}Llegó</button>
      ${tarde ? `<button class="btn btn-s btn-ch" data-a="rcFalta" data-id="${c.id}">No vino</button>` : ""}
      <button class="btn btn-t btn-ch btn-i" data-a="rcMover" data-id="${c.id}" aria-label="Mover cita" title="Mover">${ic("move")}</button>`;
  } else if (col === "espera") {
    const m = (ahora - (c.t.llego || ahora)) / MIN;
    meta = chip(ic("timer") + "Espera " + minTxt(c.t.llego || ahora), m > 10 ? "aviso" : "neutro");
    if (k.bebida) extra = `<p class="rc-bebida">${ic("coffee")}${esc(k.bebida)}</p>`;
    acc = `<button class="btn btn-p btn-ch" data-a="rcEmpezar" data-id="${c.id}">${ic("play")}Empezar</button>`;
  } else if (col === "servicio") {
    const ini = c.t.empezo || c.ini, dur = c.fin - c.ini, k2 = clamp((ahora - ini) / dur, 0, 1), pose = poseDe(c);
    const queda = Math.round((ini + dur - ahora) / MIN);
    meta = pose ? chip(`<span class="punto"></span>En pose · ${Math.max(1, Math.round((pose.fin - ahora) / MIN))} min`, "activo vivo")
      : chip(ic("timer") + (queda > 0 ? "Quedan " + durTxt(queda) : "Pasado " + durTxt(-queda)), queda < 0 ? "aviso" : "activo");
    const x = c.estacion_id && db.obtener("estaciones", c.estacion_id);
    extra = `<div class="barra rc-prog" role="progressbar" aria-valuenow="${Math.round(k2 * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${k2 * 100}%"></i></div>${x ? `<p class="rc-bebida">${ic("pin")}${esc(x.nombre)}</p>` : ""}`;
    acc = `<button class="btn btn-ok btn-ch" data-a="rcTerminar" data-id="${c.id}">${ic("check")}Terminar</button>`;
  } else if (col === "cobrar") {
    meta = chip(ic("receipt") + Q(totalCuenta(c)), "cobro");
    acc = `<button class="btn btn-a btn-ch" data-a="rcCobrar" data-id="${c.id}">${ic("cash")}Cobrar</button>`;
  }
  return `<article class="rc-card click" data-a="rcAbrirCita" data-id="${c.id}" tabindex="0" role="button" aria-label="Cita de ${esc(k.nombre)}">
    <div class="rc-card-h"><span class="rc-hora num">${hora(c.ini)}</span>${meta}<span class="esp"></span><span class="rc-avs">${estilistasDe(c).map(e => avatar(e, 26)).join("")}</span></div>
    <div class="rc-card-b"><div class="rc-card-t"><b class="rc-cli">${esc(k.nombre)}</b><small>${esc(nombresServ(c))}</small>
      ${insignias(k) ? `<div class="fila-w rc-ins">${insignias(k)}</div>` : ""}</div>${miniDiseno(c.diseno)}</div>
    ${extra}<div class="rc-acc">${acc}</div></article>`;
}

/* acciones del tablero */
const citaDe = el => db.obtener("citas", el.dataset.id);
A.rcAbrirCita = el => abrir("cita", { id: el.dataset.id });
A.rcMover = el => abrir("cita", { id: el.dataset.id, mover: true });
A.rcLlego = el => { const c = citaDe(el); marcarLlegada(c); toast(cli(c.clienta_id).nombre.split(" ")[0] + " ya está aquí", "in"); };
A.rcEmpezar = el => { const c = citaDe(el); empezar(c); const x = c.estacion_id && db.obtener("estaciones", c.estacion_id); toast("Servicio iniciado" + (x ? " · " + x.nombre : ""), "play"); };
A.rcTerminar = el => { terminar(citaDe(el)); toast("Listo para cobrar", "receipt"); };
A.rcCobrar = el => abrir("cobro", { id: el.dataset.id });
A.rcFalta = async el => {
  const c = citaDe(el), k = cli(c.clienta_id);
  if (await confirmar({ titulo: "¿Marcar que no vino?", texto: `${esc(k.nombre)} · ${hora(c.ini)}. Queda en su historial como falta.`, si: "No vino", peligro: true })) { cancelarCita(c, true); toast("Marcada como falta", "alert"); }
};
A.rcConfirmar = el => { const c = citaDe(el); c.estado = "confirmada"; c.confirmo = true; db.cambio(); toast("Cita confirmada"); };
A.rcCancelar = async el => {
  const c = citaDe(el);
  if (await confirmar({ titulo: "¿Cancelar la cita?", texto: `${esc(cli(c.clienta_id).nombre)} · ${esc(diaRel(c.ini))} ${hora(c.ini)}`, si: "Cancelar cita", no: "Volver", peligro: true })) { cancelarCita(c); cerrarTodo(); toast("Cita cancelada", "x"); }
};
A.rcNueva = () => abrir("nuevaCita", {});
A.rcFicha = el => abrir("ficha", { id: el.dataset.id, sec: el.dataset.sec });

/* ---------- agenda ---------- */
const PPM = 1.35;
function vAgenda() {
  const off = +tab("rcDia", "0"), d0 = dia0() + off * DIA, h = horarioDia(d0);
  const nav = `<div class="rc-ag-nav rev">
    <button class="btn btn-s btn-ch btn-i" data-a="rcDia" data-v="${off - 1}" aria-label="Día anterior">${ic("chev-l")}</button>
    <div class="seg">${[[-1, "Ayer"], [0, "Hoy"], [1, "Mañana"]].map(([v, t]) => `<button class="${off === v ? "on" : ""}" data-a="rcDia" data-v="${v}">${t}</button>`).join("")}</div>
    <button class="btn btn-s btn-ch btn-i" data-a="rcDia" data-v="${off + 1}" aria-label="Día siguiente">${ic("chev-r")}</button>
    <b class="rc-ag-fecha">${esc(fechaLarga(d0))}</b></div>`;
  if (!h) return nav + `<div class="card">${vacio("El salón no abre este día")}</div>`;
  const ests = db.listar("estilistas", e => e.dias.includes(new Date(d0).getDay()));
  const citas = citasDia(d0), ini = h[0], fin = h[1], alto = (fin - ini) * PPM;
  const horas = []; for (let m = Math.ceil(ini / 60) * 60; m < fin; m += 60) horas.push(m);
  const ahoraMin = (Date.now() - d0) / MIN, verAhora = off === 0 && ahoraMin > ini && ahoraMin < fin;
  const cols = ests.map(e => {
    const bloques = [];
    citas.forEach(c => c.items.forEach(i => {
      if (i.estilista_id !== e.id) return;
      const s = serv(i.servicio_id), top = ((i.ini - d0) / MIN - ini) * PPM, alto = (i.fin - i.ini) / MIN * PPM;
      const k = cli(c.clienta_id);
      bloques.push(`<button class="rc-blk est-${c.estado}" style="top:${top}px;height:${Math.max(22, alto - 3)}px;--c:${e.color}" data-a="rcAbrirCita" data-id="${c.id}">
        ${s.pose ? `<i class="rc-pose" style="top:${s.pose.ini * PPM}px;height:${s.pose.min * PPM}px" title="Tiempo de pose"></i>` : ""}
        <b>${esc(k.nombre)}</b><small>${hora(i.ini)} · ${esc(s.nombre)}</small>${c.diseno && alto > 70 ? miniDiseno(c.diseno, 34) : ""}</button>`);
    }));
    return `<div class="rc-ag-col" style="height:${alto}px" data-a="rcAgSlot" data-e="${e.id}" data-d0="${d0}" data-ini="${ini}" title="Toca un espacio libre para agendar">${bloques.join("")}</div>`;
  });
  return `${nav}<div class="card rc-ag-card rev" style="--i:2"><div class="rc-ag" data-scroll="ag">
    <div class="rc-ag-grid" style="grid-template-columns:52px repeat(${ests.length}, minmax(150px, 1fr))">
      <div class="rc-ag-esq"></div>${ests.map(e => `<div class="rc-ag-est">${avatar(e, 28)}<span class="trunc"><b>${esc(e.nombre.split(" ")[0])}</b><small>${esc(e.rol)}</small></span></div>`).join("")}
      <div class="rc-ag-hrs" style="height:${alto}px">${horas.map(m => `<span style="top:${(m - ini) * PPM}px">${horaMin(m).replace(":00", "")}</span>`).join("")}</div>
      ${cols.join("")}
      ${verAhora ? `<div class="rc-ahora" style="top:calc(var(--cab) + ${(ahoraMin - ini) * PPM}px)"><span>${hora(Date.now())}</span></div>` : ""}
    </div></div></div>
    <p class="tenue small rc-ag-ley"><i class="rc-ley-pose"></i>Tiempo de pose: la estilista puede atender a otra clienta</p>`;
}
A.rcDia = el => { ui.tabs.rcDia = el.dataset.v; guardarUI(); render(); };
A.rcAgSlot = (el, ev) => {
  const r = el.getBoundingClientRect(), y = ev.clientY - r.top;
  const min = +el.dataset.ini + Math.floor(y / PPM / 15) * 15;
  abrir("nuevaCita", { t: +el.dataset.d0 + min * MIN, estilista_id: el.dataset.e });
};

/* ---------- estaciones ---------- */
function vEstaciones() {
  const enServ = db.listar("citas", c => c.estado === "en_servicio");
  const espera = citasDia(Date.now(), c => c.estado === "llego");
  const tipos = Object.keys(TIPOS_ESTACION);
  let n = 0;
  return `<div class="rc-est">${tipos.map(tp => {
    const xs = db.listar("estaciones", x => x.tipo === tp); if (!xs.length) return "";
    const libres = xs.filter(x => !enServ.some(c => c.estacion_id === x.id)).length;
    return `<section class="rc-est-g rev" style="--i:${n++}"><header class="fila"><h2 class="rc-sub">${TIPOS_ESTACION[tp]}</h2><span class="esp"></span>${chip(libres + " libre" + (libres === 1 ? "" : "s"), libres ? "ok" : "aviso")}</header>
      <div class="rc-est-l">${xs.map(x => {
        const c = enServ.find(c => c.estacion_id === x.id);
        if (c) {
          const k = cli(c.clienta_id), e = est(c.items[0].estilista_id), ini = c.t.empezo || c.ini, k2 = clamp((Date.now() - ini) / (c.fin - c.ini), 0, 1), pose = poseDe(c);
          return `<button class="rc-st ocupada" style="--c:${e.color}" data-a="rcAbrirCita" data-id="${c.id}">
            <span class="rc-st-n">${esc(x.nombre)}</span>${avatar(e, 30)}<b class="trunc">${esc(k.nombre)}</b><small class="trunc">${esc(nombresServ(c))}</small>
            ${pose ? chip(`<span class="punto"></span>En pose`, "activo vivo") : chip(ic("timer") + minTxt(ini), "activo")}
            <div class="barra"><i style="width:${k2 * 100}%;background:${e.color}"></i></div></button>`;
        }
        const sig = espera.find(c => serv(c.items[0].servicio_id).est === tp);
        return `<div class="rc-st libre"><span class="rc-st-n">${esc(x.nombre)}</span><span class="rc-st-ic">${ic("check")}</span><b>Libre</b>
          ${sig ? `<button class="btn btn-p btn-ch" data-a="rcPasar" data-id="${sig.id}" data-x="${x.id}">Pasar a ${esc(cli(sig.clienta_id).nombre.split(" ")[0])}</button>` : `<small class="tenue">Sin nadie esperando</small>`}</div>`;
      }).join("")}</div></section>`;
  }).join("")}</div>`;
}
A.rcPasar = el => { const c = citaDe(el); c.estacion_id = el.dataset.x; empezar(c); toast(cli(c.clienta_id).nombre.split(" ")[0] + " pasó a " + db.obtener("estaciones", el.dataset.x).nombre, "play"); };

/* ---------- lista de espera ---------- */
function vEspera() {
  const l = db.listar("lista_espera").sort((a, b) => a.creado - b.creado);
  return `<div class="rc-esp-h rev"><p class="tx2">Clientas que quieren un espacio si se libera.</p><span class="esp"></span><button class="btn btn-p btn-ch" data-a="rcEsperaNueva">${ic("plus")}Agregar</button></div>
  ${l.length ? `<div class="lista rev" style="--i:1">${l.map(x => `<div class="row">
      ${avatar({ nombre: x.nombre, color: "var(--nude)" }, 40)}
      <div class="row-t"><b>${esc(x.nombre)}</b><small>${esc(serv(x.servicio_id).nombre)}${x.nota ? " · " + esc(x.nota) : ""} · ${haceTxt(x.creado)}</small></div>
      <a class="btn btn-s btn-ch btn-i" href="${waLink(x.tel, `Hola ${x.nombre.split(" ")[0]}, se liberó un espacio para ${serv(x.servicio_id).nombre} en ${MARCA.nombre}. ¿Te lo apartamos?`)}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${ic("msg")}</a>
      <button class="btn btn-p btn-ch" data-a="rcEsperaCita" data-id="${x.id}">Dar cita</button>
      <button class="btn btn-t btn-ch btn-i" data-a="rcEsperaQuitar" data-id="${x.id}" aria-label="Quitar de la lista">${ic("x")}</button></div>`).join("")}</div>`
    : `<div class="card rev">${vacio("Nadie en lista de espera")}</div>`}`;
}
A.rcEsperaNueva = () => abrir("rcEspera", {});
A.rcEsperaQuitar = el => { db.eliminar("lista_espera", el.dataset.id); toast("Quitada de la lista"); };
A.rcEsperaCita = el => { const x = db.obtener("lista_espera", el.dataset.id); abrir("nuevaCita", { nombre: x.nombre, tel: x.tel, servicio_id: x.servicio_id, esperaId: x.id, notas: x.nota }); };
MODALES.rcEspera = () => `${cab("Lista de espera")}<form class="modal-c pila" data-f="rcEspera" id="fEspera">
    ${campo("Nombre", `<input class="inp" id="esNom" name="nombre" required autofocus autocomplete="off">`)}
    ${campo("WhatsApp", `<input class="inp" id="esTel" name="tel" inputmode="tel" autocomplete="off">`)}
    ${campo("Servicio", `<select class="inp" id="esServ" name="servicio_id">${db.listar("servicios", s => s.activo).map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join("")}</select>`)}
    ${campo("Nota", `<input class="inp" id="esNota" name="nota" placeholder="Ej. después de las 3" autocomplete="off">`)}
  </form><div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p" form="fEspera">Agregar</button></div>`;
F.rcEspera = (f, d) => { db.insertar("lista_espera", { nombre: d.nombre.trim(), tel: d.tel, servicio_id: d.servicio_id, nota: d.nota, creado: Date.now() }); cerrar(); toast("Agregada a la lista de espera"); };

/* ---------- nueva cita ---------- */
function itemsManual(servs, t, estId) {
  let cur = t;
  return servs.map(s => {
    const sv = serv(s), e = estId && puede(est(estId), s) ? estId : (db.listar("estilistas", x => puede(x, s))[0] || {}).id;
    const it = { id: uid(), servicio_id: s, estilista_id: e, ini: cur, fin: cur + sv.dur * MIN, precio: sv.precio }; cur = it.fin; return it;
  });
}
function resultadosCli(q) {
  if (!q || q.trim().length < 2) return "";
  const l = buscarClientas(q).slice(0, 5);
  return l.length ? `<div class="lista nc-res">${l.map(k => `<button class="row click" data-a="ncCli" data-id="${k.id}">${avCli(k, 34)}<span class="row-t"><b>${esc(k.nombre)}</b><small>${telFmt(k.tel)}${k.vip ? " · VIP" : ""}</small></span>${ic("chev-r")}</button>`).join("")}</div>`
    : `<p class="tenue small">Sin resultados: escríbela abajo como nueva.</p>`;
}
MODALES.nuevaCita = m => {
  if (!m._init) {
    m._init = true; m.ancho = "ancho"; m.servicios = m.servicio_id ? [m.servicio_id] : [];
    m.est = m.estilista_id || ""; m.dia = dia0(m.t || Date.now()); m.slot = m.t || null; m.cat = m.servicio_id ? serv(m.servicio_id).cat : (m.estilista_id ? est(m.estilista_id).cats[0] : "unas");
  }
  const k = m.clienta_id ? cli(m.clienta_id) : null;
  const servs = db.listar("servicios", s => s.activo && s.cat === m.cat);
  const total = sum(m.servicios, s => serv(s).precio), dur = sum(m.servicios, s => serv(s).dur);
  const ests = db.listar("estilistas", e => !m.servicios.length || m.servicios.some(s => puede(e, s)));
  const dias = []; for (let i = 0, d = dia0(); dias.length < 10 && i < 20; i++, d += DIA) if (horarioDia(d)) dias.push(d);
  if (!dias.includes(m.dia)) dias.unshift(m.dia);
  const libres = m.servicios.length ? horasLibres(m.dia, m.servicios, m.est) : [];
  const forzada = m.slot && dia0(m.slot) === m.dia && !libres.some(x => x.t === m.slot);
  const anticipo = sum(m.servicios, s => serv(s).anticipo || 0);
  return `${cab("Nueva cita", k ? esc(k.nombre) : "")}<div class="modal-c nc">
    <section class="nc-sec"><h3 class="nc-t"><span>1</span>Clienta</h3>
      ${k ? `<div class="nc-cli">${avCli(k, 44)}<div class="row-t"><b>${esc(k.nombre)}</b><small>${telFmt(k.tel)}</small><div class="fila-w">${insignias(k)}</div></div><button class="btn btn-t btn-ch" data-a="ncCambiarCli">Cambiar</button></div>`
      : `<div class="buscar">${ic("search")}<input class="inp" id="ncBuscar" data-i="ncBuscar" placeholder="Buscar por nombre o teléfono" autocomplete="off" value="${esc(m.q || "")}"></div>
        <div id="ncRes">${resultadosCli(m.q)}</div>
        <div class="g2 nc-nueva">${campo("Nombre", `<input class="inp" id="ncNombre" value="${esc(m.nombre || "")}" autocomplete="off">`)}${campo("WhatsApp", `<input class="inp" id="ncTel" inputmode="tel" value="${esc(m.tel || "")}" autocomplete="off">`)}</div>`}
    </section>
    <section class="nc-sec"><h3 class="nc-t"><span>2</span>Servicios</h3>
      ${seg("ncCat", CATEGORIAS.map(c => [c.id, c.nombre]), m.cat, "ncCat")}
      <div class="nc-servs">${servs.map(s => `<button class="rc-tog ${m.servicios.includes(s.id) ? "on" : ""}" data-a="ncServ" data-id="${s.id}" aria-pressed="${m.servicios.includes(s.id)}"><b>${esc(s.nombre)}</b><small>${s.desde ? "desde " : ""}${Q(s.precio)} · ${durTxt(s.dur)}</small></button>`).join("")}</div>
      ${m.servicios.length ? `<p class="nc-sel">${ic("check")}<span>${m.servicios.map(s => esc(serv(s).nombre)).join(" + ")}</span><b>${Q(total)} · ${durTxt(dur)}</b></p>` : ""}
      ${m.diseno ? `<div class="nc-dis">${miniDiseno(m.diseno, 48)}<span>Con su diseño de uñas guardado</span></div>` : ""}
    </section>
    <section class="nc-sec"><h3 class="nc-t"><span>3</span>Estilista y hora</h3>
      <div class="nc-ests"><button class="rc-tog rc-tog-s ${!m.est ? "on" : ""}" data-a="ncEst" data-id="">${ic("sparkles")}<b>Quien esté libre</b></button>
        ${ests.map(e => `<button class="rc-tog rc-tog-s ${m.est === e.id ? "on" : ""}" data-a="ncEst" data-id="${e.id}">${avatar(e, 24)}<b>${esc(e.nombre.split(" ")[0])}</b></button>`).join("")}</div>
      <div class="nc-dias">${dias.map(d => `<button class="nc-dia ${d === m.dia ? "on" : ""}" data-a="ncDia" data-t="${d}"><small>${d === dia0() ? "Hoy" : DIAS_C[new Date(d).getDay()]}</small><b>${new Date(d).getDate()}</b></button>`).join("")}</div>
      ${!m.servicios.length ? `<p class="tenue small">Escoge un servicio para ver las horas libres.</p>`
      : `<div class="nc-slots">${forzada ? `<button class="nc-slot on forz" data-a="ncSlot" data-t="${m.slot}">${hora(m.slot)}<small>encimada</small></button>` : ""}
        ${libres.length ? libres.map(x => `<button class="nc-slot ${x.t === m.slot ? "on" : ""}" data-a="ncSlot" data-t="${x.t}">${hora(x.t)}</button>`).join("") : (forzada ? "" : `<p class="tenue small">No quedan horas libres este día.</p>`)}</div>`}
    </section>
    <section class="nc-sec">${campo("Notas", `<textarea class="inp" id="ncNotas" rows="2" placeholder="Referencias, preferencias…">${esc(m.notas || "")}</textarea>`)}
      <label class="check mt"><input type="checkbox" id="ncConf" checked> Ya está confirmada</label>
      ${anticipo ? `<p class="nc-ant">${ic("alert")}Pide anticipo de ${Q(anticipo)}. Al guardar te doy el link.</p>` : ""}</section>
  </div>
  <div class="modal-p"><span class="nc-tot tenue">${m.slot ? esc(diaRel(m.slot)) + " · " + hora(m.slot) : "Sin hora"}</span><span class="esp"></span><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p" data-a="ncGuardar">Agendar${total ? " · " + Q(total) : ""}</button></div>`;
};
I.ncBuscar = el => { const m = mt(); m.q = el.value; const b = $("#ncRes"); if (b) b.innerHTML = resultadosCli(m.q); };
A.ncCli = el => { const m = mt(); m.clienta_id = el.dataset.id; m.q = ""; renderModal(); };
A.ncCambiarCli = () => { const m = mt(); m.clienta_id = null; renderModal(); };
A.ncCat = el => { const m = mt(); m.cat = el.dataset.v; renderModal(); };
A.ncServ = el => { const m = mt(), id = el.dataset.id, i = m.servicios.indexOf(id); if (i >= 0) m.servicios.splice(i, 1); else m.servicios.push(id); if (m.est && !m.servicios.every(s => puede(est(m.est), s))) m.est = ""; renderModal(); };
A.ncEst = el => { const m = mt(); m.est = el.dataset.id; renderModal(); };
A.ncDia = el => { const m = mt(); m.dia = +el.dataset.t; if (m.slot && dia0(m.slot) !== m.dia) m.slot = null; renderModal(); };
A.ncSlot = el => { const m = mt(); m.slot = +el.dataset.t; renderModal(); };
A.ncGuardar = () => {
  const m = mt(); if (!m || m.tipo !== "nuevaCita") return;
  let k = m.clienta_id ? cli(m.clienta_id) : null;
  if (!k) {
    const n = ($("#ncNombre") || {}).value || "", t = ($("#ncTel") || {}).value || "";
    if (!n.trim()) { toast("Falta el nombre de la clienta", "alert", "malo"); $("#ncNombre") && $("#ncNombre").focus(); return; }
    k = clientaPorTel(n, t);
  }
  if (!m.servicios.length) return toast("Escoge al menos un servicio", "alert", "malo");
  if (!m.slot) return toast("Escoge una hora", "alert", "malo");
  const plan = planificar(m.servicios, m.slot, m.est);
  const items = plan || itemsManual(m.servicios, m.slot, m.est);
  const ant = sum(m.servicios, s => serv(s).anticipo || 0);
  const c = crearCita({ clienta_id: k.id, items, origen: m.walkin ? "sin_cita" : "recepcion", estado: $("#ncConf") && !$("#ncConf").checked ? "reservada" : "confirmada", notas: ($("#ncNotas") || {}).value || "", diseno: m.diseno || null, anticipo: ant ? { monto: ant, pagado: false } : null });
  if (m.esperaId) db.eliminar("lista_espera", m.esperaId);
  if (!plan) toast("Quedó encimada con otra cita: revisa la agenda", "alert");
  cerrar(); abrir("ncListo", { id: c.id });
};
MODALES.ncListo = m => {
  const c = db.obtener("citas", m.id); if (!c) return cab("Cita");
  const k = cli(c.clienta_id), l = m.linkId && db.obtener("links_pago", m.linkId);
  return `${cab("Cita agendada")}<div class="modal-c nc-listo">
    <div class="nc-ok">${ic("check")}</div>
    <h3 class="h3 centro">${esc(k.nombre)}</h3>
    <p class="tx2 centro">${esc(fechaLarga(c.ini))} · ${hora(c.ini)}<br>${esc(nombresServ(c))} con ${esc(estilistasDe(c).map(e => e.nombre.split(" ")[0]).join(" y "))}</p>
    <div class="nc-pase"><div class="nc-qr" data-qr="${esc(linkCita(c))}"></div><div><b>Pase de la clienta</b><small class="tenue">Confirma, mueve o cancela desde aquí. Código ${c.codigo}</small></div></div>
    ${c.anticipo && !c.anticipo.pagado ? `<div class="card card-suave nc-antc"><b>Anticipo de ${Q(c.anticipo.monto)}</b>
      ${l ? `<div class="fila"><div class="nc-qr nc-qr-s" data-qr="${esc(urlLink(l))}"></div><div class="pila"><small class="tenue">${l.estado === "pagado" ? "Pagado" : "Esperando el pago"}</small><a class="btn btn-s btn-ch" href="${waLink(k.tel, `Hola ${k.nombre.split(" ")[0]}, este es el link para tu anticipo de ${Q(l.monto)}: ${urlLink(l)}`)}" target="_blank" rel="noopener">${ic("msg")}Enviar link</a></div></div>`
      : `<button class="btn btn-s btn-ch" data-a="ncLinkAnt" data-id="${c.id}">${ic("link")}Crear link de anticipo</button>`}</div>` : ""}
  </div>
  <div class="modal-p"><a class="btn btn-s" href="${waLink(k.tel, textoPlantilla(cfg().msj_confirmacion, c, k))}" target="_blank" rel="noopener" data-a="ncWaConf" data-id="${c.id}">${ic("msg")}Enviar por WhatsApp</a><button class="btn btn-p" data-a="cerrar">Listo</button></div>`;
};
A.ncLinkAnt = el => { const c = citaDe(el), m = mt(); const l = crearLink(c.anticipo.monto, "Anticipo · " + nombresServ(c), c.id); m.linkId = l.id; renderModal(); };
A.ncWaConf = el => { const c = citaDe(el); registrarMensaje(cli(c.clienta_id), "confirmacion", textoPlantilla(cfg().msj_confirmacion, c, cli(c.clienta_id))); };

/* ---------- sin cita (walk-in) ---------- */
A.rcWalkin = () => abrir("rcWalkin", {});
function proximoLibre(e, s) {
  const t0 = Math.ceil(Date.now() / (5 * MIN)) * 5 * MIN;
  if (librePara(e, s, t0)) return { t: t0, ya: true };
  for (let t = Math.ceil(t0 / (15 * MIN)) * 15 * MIN; t < dia0() + DIA; t += 15 * MIN) if (librePara(e, s, t)) return { t, ya: false };
  return null;
}
MODALES.rcWalkin = m => {
  m.cat = m.cat || "unas";
  if (!m.servicio_id) {
    return `${cab("Sin cita", "¿Qué se quiere hacer?")}<div class="modal-c">
      ${seg("wkCat", CATEGORIAS.map(c => [c.id, c.nombre]), m.cat, "wkCat")}
      <div class="wk-servs">${db.listar("servicios", s => s.activo && s.cat === m.cat).map(s => `<button class="rc-tog" data-a="wkServ" data-id="${s.id}"><b>${esc(s.nombre)}</b><small>${Q(s.precio)} · ${durTxt(s.dur)}</small></button>`).join("")}</div></div>`;
  }
  const s = serv(m.servicio_id);
  const opciones = db.listar("estilistas", e => puede(e, s.id)).map(e => ({ e, p: proximoLibre(e, s.id) })).sort((a, b) => (a.p ? a.p.t : 9e15) - (b.p ? b.p.t : 9e15));
  return `${cab(esc(s.nombre), "¿Quién la atiende?")}<div class="modal-c pila">
    <div class="g2">${campo("Nombre (opcional)", `<input class="inp" id="wkNom" autocomplete="off" autofocus>`)}${campo("WhatsApp (opcional)", `<input class="inp" id="wkTel" inputmode="tel" autocomplete="off">`)}</div>
    <div class="lista">${opciones.map(({ e, p }) => `<button class="row click" data-a="wkEst" data-id="${e.id}" data-t="${p ? p.t : ""}" ${p ? "" : "disabled"}>
      ${avatar(e, 40)}<span class="row-t"><b>${esc(e.nombre)}</b><small>${esc(e.rol)}</small></span>
      ${p ? (p.ya ? chip(`<span class="punto"></span>Libre ya`, "ok vivo") : chip("Libre a las " + hora(p.t), "aviso")) : chip("Ocupada hoy", "apagado")}${ic("chev-r")}</button>`).join("")}</div>
    <button class="btn btn-t" data-a="wkVolver">${ic("chev-l")}Otro servicio</button>
    <button class="btn btn-s" data-a="wkEspera">${ic("list")}Mejor a la lista de espera</button></div>`;
};
A.wkCat = el => { mt().cat = el.dataset.v; renderModal(); };
A.wkServ = el => { mt().servicio_id = el.dataset.id; renderModal(); };
A.wkVolver = () => { mt().servicio_id = null; renderModal(); };
A.wkEst = el => {
  const m = mt(), t = +el.dataset.t; if (!t) return;
  const nom = $("#wkNom").value.trim() || "Clienta sin cita", tel = $("#wkTel").value.trim();
  const k = tel || nom !== "Clienta sin cita" ? clientaPorTel(nom, tel) : clientaPorTel(nom + " " + hora(Date.now()), "");
  const items = planificar([m.servicio_id], t, el.dataset.id) || itemsManual([m.servicio_id], t, el.dataset.id);
  const ya = t <= Date.now() + 5 * MIN;
  const c = crearCita({ clienta_id: k.id, items, origen: "sin_cita", estado: ya ? "llego" : "confirmada" });
  if (m.vale) { c.vales = [m.vale]; db.cambio(); }
  if (ya) { c.t.llego = Date.now(); db.cambio(); }
  cerrar(); toast(ya ? "Ya está en la sala de espera" : "Apartada para las " + hora(t), ya ? "coffee" : "cal");
};
A.wkEspera = () => { const m = mt(); const nom = $("#wkNom").value.trim(), tel = $("#wkTel").value.trim(); db.insertar("lista_espera", { nombre: nom || "Clienta sin cita", tel, servicio_id: m.servicio_id, nota: "Llegó sin cita", creado: Date.now() }); cerrar(); toast("Agregada a la lista de espera"); };

/* ---------- llegó por QR ---------- */
A.rcQR = () => abrir("rcQR", {});
MODALES.rcQR = m => {
  const por = citasDia(Date.now(), c => ["reservada", "confirmada"].includes(c.estado));
  return `${cab("Llegó por QR", "Escanea el pase, la tarjeta de puntos o una tarjeta impresa")}<form class="modal-c pila" data-f="rcQR" id="fQR">
    <div class="qr-box"><span class="qr-esq"></span>${ic("qr")}<input class="inp qr-inp" id="qrCod" name="codigo" placeholder="C4K7QX" autocomplete="off" autocapitalize="characters" autofocus aria-label="Código de la cita"></div>
    <button class="btn btn-p btn-b">Registrar llegada</button>
    ${por.length ? `<p class="eyebrow mt">O toca a quien llegó</p><div class="lista">${por.slice(0, 8).map(c => `<button type="button" class="row click" data-a="qrTocar" data-id="${c.id}">${avCli(cli(c.clienta_id), 34)}<span class="row-t"><b>${esc(cli(c.clienta_id).nombre)}</b><small>${hora(c.ini)} · ${esc(nombresServ(c))}</small></span><span class="tenue small num">${c.codigo}</span></button>`).join("")}</div>` : ""}
  </form>`;
};
F.rcQR = (f, d) => {
  const cod = String(d.codigo || "").trim().split("/").pop().toUpperCase();
  const c = citaPorCodigo(cod);
  if (!c && tarjetaImpresa(cod)) { cerrar(); abrir("vale", { cod: tarjetaImpresa(cod).codigo }); return; }
  if (!c) {
    const kt = clientaPorTarjeta(cod);
    if (kt) { cerrar(); const hoyC = citasDia(Date.now(), x => x.clienta_id === kt.id && ["reservada", "confirmada"].includes(x.estado))[0]; if (hoyC) { marcarLlegada(hoyC); toast("Bienvenida, " + kt.nombre.split(" ")[0], "in"); } else toast("Tarjeta de " + kt.nombre.split(" ")[0] + ": " + (kt.sellos || 0) + " sellos", "star"); abrir("ficha", { id: kt.id }); return; }
    toast("No encontré ese código", "alert", "malo"); return;
  }
  if (dia0(c.ini) !== dia0()) toast("Ojo: esa cita es para " + diaRel(c.ini).toLowerCase(), "alert");
  marcarLlegada(c); cerrar(); toast("Bienvenida, " + cli(c.clienta_id).nombre.split(" ")[0], "in");
};
A.qrTocar = el => { const c = citaDe(el); marcarLlegada(c); cerrar(); toast("Bienvenida, " + cli(c.clienta_id).nombre.split(" ")[0], "in"); };

/* ---------- recordatorios de mañana ---------- */
A.rcRecordatorios = () => abrir("rcRecordatorios", {});
MODALES.rcRecordatorios = () => {
  const l = citasDia(Date.now() + DIA);
  return `${cab("Recordatorios de mañana", l.length + " cita" + (l.length === 1 ? "" : "s") + " · " + esc(fechaLarga(Date.now() + DIA)))}<div class="modal-c">
    ${l.length ? `<div class="lista">${l.map(c => { const k = cli(c.clienta_id); return `<div class="row">${avCli(k, 36)}<div class="row-t"><b>${esc(k.nombre)}</b><small>${hora(c.ini)} · ${esc(nombresServ(c))}</small></div>
      ${c.recordado ? chip(ic("check") + "Enviado", "ok") : ""}
      <a class="btn ${c.recordado ? "btn-s" : "btn-p"} btn-ch" href="${waLink(k.tel, textoPlantilla(cfg().msj_recordatorio, c, k))}" target="_blank" rel="noopener" data-a="rcRecEnviado" data-id="${c.id}">${ic("msg")}${c.recordado ? "Otra vez" : "Enviar"}</a></div>`; }).join("")}</div>`
    : vacio("Mañana no hay citas todavía")}</div>`;
};
A.rcRecEnviado = el => { const c = citaDe(el), k = cli(c.clienta_id); c.recordado = true; registrarMensaje(k, "recordatorio", textoPlantilla(cfg().msj_recordatorio, c, k)); db.cambio(); };

/* ---------- caja ---------- */
function resumenTurno(t) {
  const ps = db.listar("pagos", p => p.turno_id === t.id), por = {};
  ps.forEach(p => p.metodos.forEach(x => por[x.metodo] = r2((por[x.metodo] || 0) + x.monto)));
  const propinas = sum(ps, p => sum(Object.values(p.propinas || {})));
  const propEf = sum(ps.filter(p => (p.propina_metodo || (p.metodos.find(x => !["anticipo", "paquete", "membresia", "regalo"].includes(x.metodo)) || {}).metodo) === "efectivo"), p => sum(Object.values(p.propinas || {})));
  return { ps, por, propinas, propEf, ventas: sum(ps, p => p.total), esperado: r2(t.fondo + (por.efectivo || 0) + propEf) };
}
A.rcCaja = () => abrir("rcCaja", {});
MODALES.rcCaja = m => {
  const t = turnoAbierto();
  if (!t) {
    const ult = db.listar("turnos_caja", x => x.cerrado).sort((a, b) => b.cerrado - a.cerrado)[0];
    return `${cab("Caja", "No hay turno abierto")}<form class="modal-c pila" data-f="rcAbrirCaja" id="fCaja">
      ${campo("Fondo inicial", `<input class="inp num" id="cjFondo" name="fondo" inputmode="decimal" value="500" autofocus>`, "El efectivo con el que empieza la caja")}
      ${ult ? `<p class="tenue small">Último cierre: ${esc(diaRel(ult.cerrado))} ${hora(ult.cerrado)} · diferencia ${Q(ult.diferencia || 0)}</p>` : ""}
    </form><div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p" form="fCaja">Abrir turno</button></div>`;
  }
  const r = resumenTurno(t), cont = m.contado !== undefined && m.contado !== "" ? +m.contado : null;
  return `${cab("Caja", "Turno abierto " + esc(diaRel(t.abierto).toLowerCase()) + " a las " + hora(t.abierto))}<div class="modal-c pila">
    <div class="g3 cj-kpis"><div class="card kpi"><small>Ventas del turno</small><b>${Q(r.ventas)}</b></div><div class="card kpi"><small>Cobros</small><b>${r.ps.length}</b></div><div class="card kpi"><small>Propinas</small><b>${Q(r.propinas)}</b></div></div>
    <div class="lista">${Object.keys(METODOS).filter(k => r.por[k]).map(k => `<div class="row">${ic(METODOS[k][1])}<span class="row-t"><b>${METODOS[k][0]}</b></span><b class="num">${Q(r.por[k])}</b></div>`).join("") || `<div class="row"><span class="row-t tenue">Sin cobros todavía</span></div>`}</div>
    <div class="card card-suave cj-cuadre">
      <div class="fila"><span>Fondo</span><span class="esp"></span><b class="num">${Q(t.fondo)}</b></div>
      <div class="fila"><span>Efectivo cobrado</span><span class="esp"></span><b class="num">${Q(r.por.efectivo || 0)}</b></div>
      <div class="fila"><span>Propinas en efectivo</span><span class="esp"></span><b class="num">${Q(r.propEf)}</b></div>
      <div class="fila cj-esp"><span>Debe haber</span><span class="esp"></span><b class="num">${Q(r.esperado)}</b></div>
      ${campo("Efectivo contado", `<input class="inp num" id="cjContado" data-i="cjContado" inputmode="decimal" placeholder="0.00" value="${esc(m.contado ?? "")}">`)}
      <p class="cj-dif" id="cjDif">${difTxt(cont, r.esperado)}</p>
    </div></div>
    <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Seguir</button><button class="btn btn-p" data-a="rcCerrarCaja">Cerrar turno</button></div>`;
};
function difTxt(cont, esp) {
  if (cont === null || isNaN(cont)) return `<span class="tenue">Cuenta el efectivo para cuadrar</span>`;
  const d = r2(cont - esp);
  return d === 0 ? `<span class="chip ok">${ic("check")}Cuadra exacto</span>` : `<span class="chip ${d > 0 ? "aviso" : "malo"}">${d > 0 ? "Sobran " : "Faltan "}${Q(Math.abs(d))}</span>`;
}
I.cjContado = el => { const m = mt(); m.contado = el.value; const t = turnoAbierto(); if (t) $("#cjDif").innerHTML = difTxt(el.value === "" ? null : +el.value, resumenTurno(t).esperado); };
F.rcAbrirCaja = (f, d) => { db.insertar("turnos_caja", { abierto: Date.now(), fondo: +d.fondo || 0, cerrado: null, contado: null }); cerrar(); toast("Turno abierto", "cash"); };
A.rcCerrarCaja = async () => {
  const m = mt(), t = turnoAbierto(); if (!t) return;
  const r = resumenTurno(t), cont = m.contado === undefined || m.contado === "" ? null : +m.contado;
  if (cont === null) toast("Cerraste sin contar el efectivo", "alert");
  if (!(await confirmar({ titulo: "¿Cerrar el turno?", texto: `Ventas ${Q(r.ventas)} · debe haber ${Q(r.esperado)} en efectivo.`, si: "Cerrar turno" }))) return;
  t.cerrado = Date.now(); t.contado = cont; t.esperado = r.esperado; t.diferencia = cont === null ? 0 : r2(cont - r.esperado); db.cambio();
  cerrar(); toast("Turno cerrado", "lock");
};

/* ---------- detalle de la cita ---------- */
MODALES.cita = m => {
  const c = db.obtener("citas", m.id); if (!c) return `${cab("Cita")}<div class="modal-c">${vacio("No encontré la cita")}</div>`;
  const k = cli(c.clienta_id), st = ESTADOS[c.estado];
  m.mdia = m.mdia || dia0(Math.max(c.ini, dia0()));
  const tieneDis = c.items.some(i => serv(i.servicio_id).diseno);
  const acc = {
    reservada: `<button class="btn btn-s" data-a="rcConfirmar" data-id="${c.id}">${ic("check")}Confirmar</button><button class="btn btn-p" data-a="ciLlego" data-id="${c.id}">${ic("in")}Llegó</button>`,
    confirmada: `<button class="btn btn-p" data-a="ciLlego" data-id="${c.id}">${ic("in")}Llegó</button>`,
    llego: `<button class="btn btn-p" data-a="ciEmpezar" data-id="${c.id}">${ic("play")}Empezar</button>`,
    en_servicio: `<button class="btn btn-ok" data-a="ciTerminar" data-id="${c.id}">${ic("check")}Terminar</button>`,
    terminada: `<button class="btn btn-a" data-a="rcCobrar" data-id="${c.id}">${ic("cash")}Cobrar ${Q(totalCuenta(c))}</button>`,
    pagada: c.pago_id ? `<button class="btn btn-s" data-a="ciRecibo" data-id="${c.pago_id}">${ic("receipt")}Ver recibo</button>` : ""
  }[c.estado] || "";
  let mover = "";
  if (m.mover && activa(c) && c.estado !== "pagada") {
    const dias = []; for (let i = 0, d = dia0(); dias.length < 10 && i < 20; i++, d += DIA) if (horarioDia(d)) dias.push(d);
    const servs = c.items.map(i => i.servicio_id), libres = horasLibres(m.mdia, servs, c.items[0].estilista_id, c.id);
    mover = `<section class="ci-mover"><div class="fila"><h3 class="rc-sub">Mover a</h3><span class="esp"></span><button class="btn btn-t btn-ch" data-a="ciMoverX">Cerrar</button></div>
      <div class="nc-dias">${dias.map(d => `<button class="nc-dia ${d === m.mdia ? "on" : ""}" data-a="ciMDia" data-t="${d}"><small>${d === dia0() ? "Hoy" : DIAS_C[new Date(d).getDay()]}</small><b>${new Date(d).getDate()}</b></button>`).join("")}</div>
      <div class="nc-slots">${libres.length ? libres.map(x => `<button class="nc-slot ${x.t === c.ini ? "on" : ""}" data-a="ciMover" data-t="${x.t}">${hora(x.t)}</button>`).join("") : `<p class="tenue small">Sin horas libres con ${esc(est(c.items[0].estilista_id).nombre.split(" ")[0])} este día.</p>`}</div></section>`;
  }
  return `${cab(esc(k.nombre), esc(diaRel(c.ini)) + " · " + hora(c.ini) + " – " + hora(c.fin), chip(st.t, st.c))}<div class="modal-c pila ci">
    <div class="ci-cli">${avCli(k, 44)}<div class="row-t"><b>${esc(k.nombre)}</b><small>${telFmt(k.tel)} · ${citasDe(k.id).filter(x => x.estado === "pagada").length} visitas</small><div class="fila-w">${insignias(k)}</div></div>
      <a class="btn btn-s btn-ch btn-i" href="${waLink(k.tel, "Hola " + k.nombre.split(" ")[0] + ", ")}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic("msg")}</a>
      <button class="btn btn-s btn-ch" data-a="rcFicha" data-id="${k.id}">${ic("user")}Ficha</button></div>
    ${k.bebida || k.notas ? `<p class="ci-pref">${k.bebida ? `${ic("coffee")}${esc(k.bebida)}` : ""}${k.notas ? `<span>${esc(k.notas)}</span>` : ""}</p>` : ""}
    <div class="lista">${c.items.map((i, n) => { const s = serv(i.servicio_id), e = est(i.estilista_id); return `<div class="row ci-it">${avatar(e, 34)}<div class="row-t"><b>${esc(s.nombre)}</b><small>${hora(i.ini)} · ${durTxt(s.dur)}${s.pose ? " · pose " + s.pose.min + " min" : ""}</small>
        ${c.estado === "pagada" ? "" : `<select class="inp ci-sel" id="ciEst${n}" data-i="ciEst" data-solo="change" data-n="${n}" aria-label="Estilista">${db.listar("estilistas", x => puede(x, s.id)).map(x => `<option value="${x.id}" ${x.id === i.estilista_id ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select>`}</div>
        <b class="num">${Q(i.precio + (i.arte || 0))}</b></div>`; }).join("")}
      ${(c.productos || []).map(p => { const pr = db.obtener("productos", p.producto_id) || {}; return `<div class="row">${ic("bag")}<div class="row-t"><b>${esc(pr.nombre)}</b><small>Producto · ${p.cant} u.</small></div><b class="num">${Q((pr.precio || 0) * p.cant)}</b></div>`; }).join("")}</div>
    ${c.diseno || tieneDis ? `<div class="card card-suave ci-dis">${c.diseno ? miniDiseno(c.diseno, 110) : `<span class="rc-mini rc-mini-v">${ic("hand")}</span>`}
      <div class="pila"><b>${c.diseno ? "Diseño de uñas" : "Sin diseño todavía"}</b>
      ${c.diseno && typeof materiales === "function" ? `<ul class="ci-mat">${materiales(c.diseno).slice(0, 5).map(x => `<li><span>${esc(x.t)}</span><b>${esc(String(x.n))}</b></li>`).join("")}</ul>` : ""}
      <a class="btn btn-s btn-ch" href="#/disenar/cita/${c.codigo}">${ic("palette")}${c.diseno ? "Abrir diseño" : "Diseñar"}</a></div></div>` : ""}
    ${c.anticipo ? `<div class="fila ci-ant">${chip(ic(c.anticipo.pagado ? "check" : "alert") + "Anticipo " + Q(c.anticipo.monto) + (c.anticipo.pagado ? " pagado" : " pendiente"), c.anticipo.pagado ? "ok" : "aviso")}<span class="esp"></span>
      ${c.anticipo.pagado ? "" : `<button class="btn btn-t btn-ch" data-a="ciAntPagado" data-id="${c.id}">Marcar pagado</button><button class="btn btn-s btn-ch" data-a="ciAntLink" data-id="${c.id}">${ic("link")}Link</button>`}</div>` : ""}
    ${c.notas ? `<p class="ci-notas">${ic("pen")}${esc(c.notas)}</p>` : ""}
    ${mover}
    <div class="ci-mas">
      ${activa(c) && c.estado !== "pagada" && !m.mover ? `<button class="btn btn-t btn-ch" data-a="ciMoverAbrir">${ic("move")}Mover</button>` : ""}
      <a class="btn btn-t btn-ch" href="${waLink(k.tel, textoPlantilla(cfg().msj_confirmacion, c, k))}" target="_blank" rel="noopener">${ic("send")}Enviar pase</a>
      <button class="btn btn-t btn-ch" data-a="ciCopiar" data-id="${c.id}">${ic("copy")}Copiar link</button>
      ${["reservada", "confirmada"].includes(c.estado) ? `<button class="btn btn-t btn-ch" data-a="rcFalta" data-id="${c.id}">No vino</button><button class="btn btn-t btn-ch ci-peligro" data-a="rcCancelar" data-id="${c.id}">Cancelar cita</button>` : ""}
    </div>
    <p class="tenue xs">Código ${c.codigo} · ${({ en_linea: "Reservó en línea", recepcion: "Agendada en recepción", whatsapp: "Por WhatsApp", sin_cita: "Llegó sin cita" })[c.origen] || ""}</p>
  </div>${acc ? `<div class="modal-p">${acc}</div>` : ""}`;
};
A.ciLlego = el => { marcarLlegada(citaDe(el)); toast("Llegada registrada", "in"); };
A.ciEmpezar = el => { empezar(citaDe(el)); toast("Servicio iniciado", "play"); };
A.ciTerminar = el => { terminar(citaDe(el)); toast("Listo para cobrar", "receipt"); };
A.ciRecibo = el => abrir("recibo", { id: el.dataset.id });
A.ciMoverAbrir = () => { mt().mover = true; renderModal(); };
A.ciMoverX = () => { mt().mover = false; renderModal(); };
A.ciMDia = el => { mt().mdia = +el.dataset.t; renderModal(); };
A.ciMover = el => {
  const m = mt(), c = db.obtener("citas", m.id), t = +el.dataset.t;
  const nuevo = planificar(c.items.map(i => i.servicio_id), t, c.items[0].estilista_id, c.id); if (!nuevo) return toast("Ese espacio ya no está libre", "alert", "malo");
  nuevo.forEach((n, i) => { const v = c.items[i]; if (v) { n.precio = v.precio; if (v.arte) n.arte = v.arte; } });
  m.mover = false; moverCita(c, nuevo); toast("Cita movida a " + diaRel(t).toLowerCase() + " " + hora(t), "move");
};
I.ciEst = el => {
  const m = mt(), c = db.obtener("citas", m.id), i = c.items[+el.dataset.n], e = est(el.value);
  if (!librePara(e, i.servicio_id, i.ini, c.id)) toast(e.nombre.split(" ")[0] + " tiene otra cita a esa hora", "alert");
  i.estilista_id = e.id; db.cambio(); toast("Ahora la atiende " + e.nombre.split(" ")[0], "user");
};
A.ciAntPagado = el => { const c = citaDe(el); c.anticipo.pagado = true; db.cambio(); toast("Anticipo registrado"); };
A.ciAntLink = el => { const c = citaDe(el); const l = db.listar("links_pago").find(x => x.ref === c.id && x.estado === "pendiente") || crearLink(c.anticipo.monto, "Anticipo · " + nombresServ(c), c.id); abrir("rcLink", { linkId: l.id, tel: cli(c.clienta_id).tel }); };
A.ciCopiar = el => { const c = citaDe(el); navigator.clipboard && navigator.clipboard.writeText(linkCita(c)).then(() => toast("Link copiado", "copy"), () => toast(linkCita(c), "link")); };
MODALES.rcLink = m => {
  const l = db.obtener("links_pago", m.linkId); if (!l) return cab("Link de pago");
  return `${cab("Link de pago", esc(l.concepto))}<div class="modal-c pila rc-link">
    <div class="nc-qr nc-qr-g" data-qr="${esc(urlLink(l))}"></div>
    <p class="h2 centro num">${Q(l.monto)}</p>
    <p class="centro">${l.estado === "pagado" ? chip(ic("check") + "Pagado", "ok") : chip(`<span class="punto"></span>Esperando el pago`, "aviso vivo")}</p>
    <div class="fila-w rc-link-acc"><a class="btn btn-s btn-ch" href="${waLink(m.tel || "", "Este es tu link de pago de " + MARCA.nombre + ": " + urlLink(l))}" target="_blank" rel="noopener">${ic("msg")}WhatsApp</a>
      <a class="btn btn-s btn-ch" href="${urlLink(l)}" target="_blank" rel="noopener">${ic("link")}Abrir</a></div></div>
    <div class="modal-p"><button class="btn btn-p" data-a="cerrar">Listo</button></div>`;
};

/* ---------- combos, paquetes y regalos: se arman y se venden aquí ---------- */
A.rcVender = () => abrir("vender", { modo: "combo" });
function venCombo(m) {
  const items = m.items.filter(x => x.cant > 0), normal = sum(items, x => serv(x.servicio_id).precio * x.cant);
  const fijo = m.precioV !== "" && m.precioV != null;
  const precio = fijo ? Math.max(0, Math.round(+m.precioV || 0)) : Math.round(normal * (1 - m.pct / 100) / 5) * 5;
  const auto = items.length === 1 ? `${serv(items[0].servicio_id).nombre}${items[0].cant > 1 ? " × " + items[0].cant : ""}` : "Combo " + items.map(x => serv(x.servicio_id).nombre.split(" ")[0].toLowerCase()).join(" + ");
  return { items, normal, precio, auto, nombre: (m.nombre || "").trim() || auto };
}
const venTotal = (m, x) => m.modo === "combo" ? x.precio : Math.round(+m.monto || 0);
const venGift = (m, x) => ({ diseno: m.diseno, monto: Math.round(+m.monto || 0), para: (m.rPara || "").trim() || "Para ti", de: (m.rDe || "").trim(), codigo: "", combo: m.modo === "combo" && x.items.length ? { nombre: x.nombre, items: x.items } : null });
function venResumen(m, x) {
  const t = venTotal(m, x), combo = m.modo === "combo";
  return `${combo && x.normal ? `<div class="fila"><span>Por separado</span><span class="esp"></span><span class="num ${x.normal > t ? "ven-tachado" : ""}">${Q(x.normal)}</span></div>` : ""}
    ${combo && x.normal > t ? `<div class="fila co-menos"><span>Se ahorra</span><span class="esp"></span><span class="num">${Q(x.normal - t)}</span></div>` : ""}
    <div class="fila co-total"><span>${combo ? "Precio del combo" : "Tarjeta de regalo"}</span><span class="esp"></span><b class="num">${Q(t)}</b></div>`;
}
function venPintar(m) {
  const x = venCombo(m);
  const r = $("#venRes"); if (r) r.innerHTML = venResumen(m, x);
  const b = $("#venBtn"); if (b) b.innerHTML = ic("check") + "Cobrar " + Q(venTotal(m, x));
  const p = $("#venPrev"); if (p) p.innerHTML = tarjetaRegaloSVG(venGift(m, x));
  const n = $("#venNombre"); if (n) n.placeholder = x.auto;
}
MODALES.vender = m => {
  if (!m._init) { m._init = true; m.ancho = "ancho"; m.items = []; m.cat = CATEGORIAS[0].id; m.pct = 10; m.precioV = ""; m.vig = 120; m.para = m.modo === "monto" ? "regalo" : "clienta"; m.diseno = "rosa"; m.monto = 500; m.metodo = "tarjeta"; m.entrega = "digital"; }
  const combo = m.modo === "combo", x = venCombo(m), regalo = !combo || m.para === "regalo", impresas = combo && m.entrega === "impresas";
  const pend = db.listar("pagos", p => p.entrega && p.entrega.slots.some(y => !y.codigo));
  const k = m.clienta_id ? cli(m.clienta_id) : null, tiene = id => m.items.some(i => i.servicio_id === id);
  const izq = combo ? `
      ${db.listar("paquetes").length ? `<div><p class="eyebrow">Listos para vender</p><div class="ven-listos">${db.listar("paquetes").map(q => `<button class="rc-tog ${m.base === q.id ? "on" : ""}" data-a="venBase" data-id="${q.id}" aria-pressed="${m.base === q.id}"><b>${esc(q.nombre)}</b><small>${Q(q.precio)} · ${paqSesiones(q)} ${paqSesiones(q) === 1 ? "sesión" : "sesiones"}</small></button>`).join("")}</div></div>` : ""}
      <div class="pila"><p class="eyebrow">${db.listar("paquetes").length ? "O ármalo aquí" : "Arma el combo"}</p>${seg("venCat", CATEGORIAS.map(c => [c.id, c.nombre]), m.cat, "venCat")}
        <div class="nc-servs">${db.listar("servicios", s => s.activo && s.cat === m.cat).map(s => `<button class="rc-tog ${tiene(s.id) ? "on" : ""}" data-a="venServ" data-id="${s.id}" aria-pressed="${tiene(s.id)}"><b>${esc(s.nombre)}</b><small>${Q(s.precio)}</small></button>`).join("")}</div></div>
      <div class="lista ven-items">${x.items.length ? x.items.map(it => { const s = serv(it.servicio_id); return `<div class="row"><span class="row-t"><b>${esc(s.nombre)}</b><small>${Q(s.precio)} c/u</small></span>
        <span class="ven-paso"><button class="btn btn-s btn-i" data-a="venMenos" data-id="${s.id}" aria-label="Una sesión menos de ${esc(s.nombre)}">${ic(it.cant > 1 ? "minus" : "x")}</button><b class="num" aria-live="polite">${it.cant}</b><button class="btn btn-s btn-i" data-a="venMas" data-id="${s.id}" aria-label="Una sesión más de ${esc(s.nombre)}">${ic("plus")}</button></span></div>`; }).join("")
        : `<div class="row"><span class="row-t tenue">Toca los servicios que lleva. Con + y − cambias las sesiones de cada uno.</span></div>`}</div>
      <div><p class="eyebrow">Precio</p><div class="fila-w">${[0, 10, 15, 20].map(p => `<button class="rc-tog rc-tog-s ${m.precioV === "" && m.pct === p ? "on" : ""}" data-a="venPct" data-v="${p}"><b>${p ? "−" + p + " %" : "Sin descuento"}</b></button>`).join("")}
        <input class="inp num co-mini" id="venPrecio" data-i="venTxt" data-k="precioV" inputmode="numeric" placeholder="Otro Q" value="${esc(m.precioV)}" aria-label="Precio exacto del combo"></div></div>
      <div class="g2">${campo("Nombre", `<input class="inp" id="venNombre" data-i="venTxt" data-k="nombre" placeholder="${esc(x.auto)}" value="${esc(m.nombre || "")}" autocomplete="off">`)}
        ${campo("Vence en", `<select class="inp" id="venVig" data-i="venTxt" data-k="vig" data-solo="change">${[60, 90, 120, 180, 365].map(d => `<option value="${d}" ${+m.vig === d ? "selected" : ""}>${d === 365 ? "Un año" : d + " días"}</option>`).join("")}</select>`)}</div>
      ${m.base ? "" : `<label class="check"><input type="checkbox" data-a="venGuardar" ${m.guardar ? "checked" : ""}> Guardarlo en los paquetes del salón para venderlo otra vez</label>`}`
    : `<div><p class="eyebrow">Monto</p><div class="fila-w">${[200, 300, 500, 1000].map(v => `<button class="rc-tog rc-tog-s ${+m.monto === v ? "on" : ""}" data-a="venMonto" data-v="${v}"><b>${Q(v)}</b></button>`).join("")}
        <input class="inp num co-mini" id="venMontoIn" data-i="venTxt" data-k="monto" inputmode="numeric" placeholder="Otro Q" value="${[200, 300, 500, 1000].includes(+m.monto) ? "" : esc(m.monto)}" aria-label="Otro monto"></div>
      <p class="tenue small mt">Se canjea en cualquier servicio o producto. El saldo que sobra se queda para la próxima.</p></div>`;
  const quien = !regalo ? (k ? `<div class="nc-cli">${avCli(k, 44)}<div class="row-t"><b>${esc(k.nombre)}</b><small>${telFmt(k.tel)}</small></div><button class="btn btn-t btn-ch" data-a="ncCambiarCli">Cambiar</button></div>`
      : `<div class="buscar">${ic("search")}<input class="inp" id="ncBuscar" data-i="ncBuscar" placeholder="Buscar por nombre o teléfono" autocomplete="off" value="${esc(m.q || "")}"></div>
        <div id="ncRes">${resultadosCli(m.q)}</div>
        <div class="g2">${campo("Nombre", `<input class="inp" id="venNNom" data-i="venTxt" data-k="nNombre" value="${esc(m.nNombre || "")}" autocomplete="off">`)}${campo("WhatsApp", `<input class="inp" id="venNTel" data-i="venTxt" data-k="nTel" inputmode="tel" value="${esc(m.nTel || "")}" autocomplete="off">`)}</div>`)
    : `${impresas ? "" : `<div class="ven-prev" id="venPrev">${tarjetaRegaloSVG(venGift(m, x))}</div>
      ${seg("venDis", [["rosa", "Rosa"], ["oro", "Oro"], ["noir", "Noir"]], m.diseno, "venDis")}`}
      <div class="g2">${campo("Para", `<input class="inp" id="venPara" data-i="venTxt" data-k="rPara" value="${esc(m.rPara || "")}" placeholder="Quien lo recibe" autocomplete="off">`)}${campo("De", `<input class="inp" id="venDe" data-i="venTxt" data-k="rDe" value="${esc(m.rDe || "")}" placeholder="Quien lo regala" autocomplete="off">`)}</div>
      ${campo("Mensaje", `<textarea class="inp" id="venMsj" data-i="venTxt" data-k="rMsj" rows="2" maxlength="140" placeholder="Opcional">${esc(m.rMsj || "")}</textarea>`)}
      ${campo("WhatsApp para mandarlo", `<input class="inp" id="venTel" data-i="venTxt" data-k="rTel" inputmode="tel" value="${esc(m.rTel || "")}" placeholder="De quien lo regala o lo recibe">`)}`;
  const nSes = sum(x.items, i => i.cant);
  const entrega = combo ? `<div class="pila">${seg("venEntrega", [["digital", "Por WhatsApp", "msg"], ["impresas", "Tarjetas impresas", "tag"]], m.entrega, "venEntrega")}
      ${impresas ? `<div class="ven-imp">${valeHTML({ codigo: "TI-·····" })}<p class="small"><b>${nSes ? nSes + (nSes === 1 ? " tarjeta" : " tarjetas") : "Una tarjeta por sesión"}</b>. Al cobrar escaneas cada una y se entregan en la mano. Se pueden regalar sueltas.</p></div>` : ""}</div>` : "";
  return `${cab("Combos y regalos", "Se cobran aquí mismo")}<div class="modal-c pila ven">
    ${pend.length ? `<div class="card card-suave fila-w ven-pend">${ic("tag")}<span class="esp">Tarjetas por entregar</span>${pend.map(p => `<button class="btn btn-s btn-ch" data-a="valeEntrega" data-id="${p.id}">${esc(p.entrega.combo)} · faltan ${p.entrega.slots.filter(y => !y.codigo).length}</button>`).join("")}</div>` : ""}
    ${seg("venModo", [["combo", "Combo o paquete", "box"], ["monto", "Tarjeta de regalo", "gift"]], m.modo, "venModo")}
    <div class="co">
      <div class="co-izq pila">${izq}</div>
      <div class="co-der pila">
        ${entrega}
        ${combo ? seg("venPara", [["clienta", impresas ? "Para quien compra" : "Para una clienta"], ["regalo", "Para regalar"]], m.para, "venPara") : ""}
        ${quien}
        <div><p class="eyebrow">Forma de pago</p><div class="co-mets">${["efectivo", "tarjeta", "transferencia"].map(t => `<button class="rc-tog rc-tog-s ${m.metodo === t ? "on" : ""}" data-a="venMetodo" data-v="${t}">${ic(METODOS[t][1])}<b>${METODOS[t][0]}</b></button>`).join("")}</div></div>
        <div class="co-res" id="venRes">${venResumen(m, x)}</div>
      </div>
    </div></div>
  <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p btn-g" id="venBtn" data-a="venCobrar">${ic("check")}Cobrar ${Q(venTotal(m, x))}</button></div>`;
};
I.venTxt = el => { const m = mt(); m[el.dataset.k] = el.value; venPintar(m); };
const venCambio = m => { if (m.base && m.nombre === db.obtener("paquetes", m.base).nombre) m.nombre = ""; m.base = null; m.precioV = ""; renderModal(); };
A.venModo = el => { const m = mt(); m.modo = el.dataset.v; if (m.modo === "monto") m.para = "regalo"; renderModal(); };
A.venCat = el => { mt().cat = el.dataset.v; renderModal(); };
A.venBase = el => {
  const m = mt(), q = db.obtener("paquetes", el.dataset.id);
  if (m.base === q.id) { m.base = null; m.items = []; m.nombre = ""; m.precioV = ""; }
  else { m.base = q.id; m.items = paqItems(q).map(i => ({ servicio_id: i.servicio_id, cant: i.cant })); m.nombre = q.nombre; m.precioV = String(q.precio); m.vig = q.vigencia || 120; }
  renderModal();
};
A.venServ = el => { const m = mt(), i = m.items.findIndex(x => x.servicio_id === el.dataset.id); if (i >= 0) m.items.splice(i, 1); else m.items.push({ servicio_id: el.dataset.id, cant: 1 }); venCambio(m); };
A.venMas = el => { const m = mt(), it = m.items.find(x => x.servicio_id === el.dataset.id); if (it) it.cant = Math.min(20, it.cant + 1); venCambio(m); };
A.venMenos = el => { const m = mt(), i = m.items.findIndex(x => x.servicio_id === el.dataset.id); if (i < 0) return; if (m.items[i].cant > 1) m.items[i].cant--; else m.items.splice(i, 1); venCambio(m); };
A.venPct = el => { const m = mt(); m.pct = +el.dataset.v; m.precioV = ""; renderModal(); };
A.venGuardar = el => { mt().guardar = el.checked; };
A.venPara = el => { mt().para = el.dataset.v; renderModal(); };
A.venDis = el => { mt().diseno = el.dataset.v; renderModal(); };
A.venMonto = el => { mt().monto = +el.dataset.v; renderModal(); };
A.venEntrega = el => { mt().entrega = el.dataset.v; renderModal(); };
A.venMetodo = el => { mt().metodo = el.dataset.v; renderModal(); };
A.venCobrar = () => {
  const m = mt(); if (!m || m.tipo !== "vender") return;
  const combo = m.modo === "combo", x = venCombo(m), regalo = !combo || m.para === "regalo", total = venTotal(m, x);
  if (combo && !x.items.length) return toast("Agrega al menos un servicio", "alert", "malo");
  if (combo && total <= 0) return toast("Revisa el precio del combo", "alert", "malo");
  if (!combo && total < 50) return toast("El monto mínimo es " + Q(50), "alert", "malo");
  const impresas = combo && m.entrega === "impresas";
  let k = m.clienta_id ? cli(m.clienta_id) : null;
  if (!regalo && !k && impresas && (m.nNombre || "").trim()) k = clientaPorTel(m.nNombre, m.nTel);
  if (!regalo && !k && !impresas) {
    if (!(m.nNombre || "").trim()) { toast("Busca a la clienta o escribe su nombre", "alert", "malo"); const b = $("#ncBuscar"); if (b) b.focus(); return; }
    k = clientaPorTel(m.nNombre, m.nTel);
  }
  if (regalo && !impresas && !(m.rPara || "").trim()) { toast("Escribe para quién es el regalo", "alert", "malo"); $("#venPara").focus(); return; }
  if (impresas) {
    const vence = Date.now() + (+m.vig || 120) * DIA, slots = x.items.flatMap(i => Array.from({ length: i.cant }, () => ({ servicio_id: i.servicio_id, codigo: null })));
    const pg = registrarCobro(null, { clienta_id: k ? k.id : null, lineas: [{ tipo: "paquete", ref: m.base || "combo", nombre: x.nombre + " · " + slots.length + " tarjetas", precio: total, cant: 1, estilista_id: null }], metodos: [{ metodo: m.metodo, monto: total }] });
    pg.entrega = { combo: x.nombre, vence, slots, regalo: regalo ? { para: (m.rPara || "").trim(), de: (m.rDe || "").trim(), mensaje: (m.rMsj || "").trim() } : null };
    db.cambio(); ui.pila.pop(); abrir("entregarVales", { pago_id: pg.id }); return;
  }
  const rg = regalo ? { codigo: codigoRegalo(), para: m.rPara.trim(), de: (m.rDe || "").trim(), mensaje: (m.rMsj || "").trim(), tel: String(m.rTel || "").replace(/\D/g, ""), diseno: m.diseno } : null;
  if (!combo) {
    const g = Object.assign({ id: uid(), monto: total, saldo: total, creado: Date.now() }, rg);
    db.d.tarjetas_regalo.push(g);
    registrarCobro(null, { lineas: [{ tipo: "regalo", ref: g.codigo, nombre: "Tarjeta de regalo " + g.codigo, precio: total, cant: 1, estilista_id: null }], metodos: [{ metodo: m.metodo, monto: total }] });
    ui.pila.pop(); abrir("admRegaloListo", { id: g.id }); return;
  }
  const cmb = { nombre: x.nombre, items: x.items.map(i => ({ servicio_id: i.servicio_id, cant: i.cant })), precio: total, vigencia: +m.vig || 120 };
  let pid = m.base || null;
  if (!pid && m.guardar) { pid = "q" + uid(); db.d.paquetes.push(Object.assign({ id: pid, desc: x.normal > total ? "Ahorra " + Q(x.normal - total) + "." : "" }, cmb)); }
  const pc = { id: uid(), clienta_id: k ? k.id : null, paquete_id: pid, combo: cmb, usos: {}, usadas: 0, comprado: Date.now(), regalo: rg };
  db.d.paquetes_clienta.push(pc);
  registrarCobro(null, { clienta_id: k ? k.id : null, lineas: [{ tipo: "paquete", ref: pid || pc.id, nombre: (regalo ? "Regalo · " : "") + cmb.nombre, precio: total, cant: 1, estilista_id: null }], metodos: [{ metodo: m.metodo, monto: total }] });
  ui.pila.pop(); abrir("venListo", { id: pc.id });
};
MODALES.venListo = m => {
  const p = db.obtener("paquetes_clienta", m.id); if (!p) return cab("Listo");
  const q = paqDe(p), vence = fechaCorta(p.comprado + q.vigencia * DIA);
  const lista = `<div class="lista ven-items">${paqItems(q).map(it => `<div class="row"><span class="row-t"><b>${esc(serv(it.servicio_id).nombre)}</b></span><b class="num">${it.cant} ${it.cant === 1 ? "sesión" : "sesiones"}</b></div>`).join("")}</div>`;
  if (p.regalo) {
    const g = Object.assign({ combo: q }, p.regalo), link = admLinkRegalo(g);
    const txt = `Para ${g.para}: ${q.nombre} en ${MARCA.nombre} (${paqResumen(q)}). ${g.mensaje ? "«" + g.mensaje + "» " : ""}Ábrelo aquí: ${link}`;
    return `${cab("Regalo listo", "Cobrado · vence el " + vence)}<div class="modal-c pila-l adm-listo">${tarjetaRegaloSVG(g)}
      <div class="fila adm-listo-qr"><div class="adm-qr" data-qr="${esc(link)}"></div><div class="pila"><b>Se canjea en recepción</b><span class="tenue small">Código <b class="num">${g.codigo}</b></span><button class="btn btn-s btn-ch" data-a="admCopiar" data-tx="${esc(link)}">${ic("copy")}<span>Copiar link</span></button></div></div>
      ${lista}</div>
    <div class="modal-p"><a class="btn btn-s" href="${link}" target="_blank" rel="noopener">${ic("eye")}<span>Ver</span></a><a class="btn btn-p" href="${waLink(g.tel || MARCA.whatsapp, txt)}" target="_blank" rel="noopener">${ic("msg")}<span>Enviar por WhatsApp</span></a></div>`;
  }
  const k = cli(p.clienta_id), txt = `Hola ${k.nombre.split(" ")[0]}, ya tienes tu ${q.nombre} en ${MARCA.nombre}: ${paqResumen(q)}. Vence el ${vence}. Agenda cuando quieras: ${reservarURL()}`;
  return `${cab("Combo vendido", esc(k.nombre))}<div class="modal-c pila-l">
      <div class="ven-ok"><span class="listo-ic">${ic("check")}</span><div><b class="serif">${esc(q.nombre)}</b><p class="tenue small">Vence el ${vence}. Al cobrar cada cita aparece «Usar ${esc(q.nombre)}».</p></div></div>${lista}</div>
    <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Listo</button><a class="btn btn-p" href="${waLink(k.tel, txt)}" target="_blank" rel="noopener">${ic("msg")}<span>Avisarle por WhatsApp</span></a></div>`;
};

/* ---------- tarjetas impresas: se activan al entregarlas y dan el paso al canjearlas ---------- */
MODALES.entregarVales = m => {
  const p = db.obtener("pagos", m.pago_id); if (!p || !p.entrega) return cab("Tarjetas");
  const e = p.entrega, listas = e.slots.filter(x => x.codigo).length, todo = listas === e.slots.length;
  return `${cab("Entrega las tarjetas", `${esc(e.combo)} · ${listas} de ${e.slots.length} listas`)}<div class="modal-c pila">
    ${todo ? `<div class="ven-ok"><span class="listo-ic">${ic("check")}</span><div><b class="serif">Listas para entregar</b><p class="tenue small">Cada una da el paso a un servicio. Se pueden regalar sueltas y vencen el ${fechaCorta(e.vence)}.</p></div></div>`
    : `<form class="pila" data-f="entregarVale" id="fVale"><div class="qr-box"><span class="qr-esq"></span>${ic("qr")}<input class="inp qr-inp" id="valeCod" name="codigo" placeholder="TI-XXXXX" autocomplete="off" autocapitalize="characters" autofocus aria-label="Código de la tarjeta"></div>
      <div class="g2"><button class="btn btn-p">Activar tarjeta</button><button type="button" class="btn btn-s" data-a="valeSimular">${ic("qr")}Simular escaneo</button></div></form>
      <p class="tenue small">Escanea cada tarjeta en blanco antes de darla. Queda activa con su servicio.</p>`}
    <div class="lista">${e.slots.map((x, i) => `<div class="row"><span class="vale-n num">${i + 1}</span><span class="row-t"><b>${esc(serv(x.servicio_id).nombre)}</b><small>${x.codigo ? "Activa" : "Falta escanear"}</small></span>${x.codigo ? chip(ic("tag") + x.codigo, "listo") : chip("Pendiente", "apagado")}</div>`).join("")}</div>
    ${!todo && listas ? `<p class="nc-ant">${ic("alert")}Si cierras ahora, las que faltan quedan pendientes en «Combos y regalos».</p>` : ""}
  </div>
  <div class="modal-p"><button class="btn ${todo ? "btn-p" : "btn-s"}" data-a="cerrar">${todo ? "Listo" : "Terminar después"}</button></div>`;
};
function activarVale(m, cod) {
  const p = db.obtener("pagos", m.pago_id), t = tarjetaImpresa(cod);
  if (!t) return toast("Esa tarjeta no es de este salón", "alert", "malo");
  if (t.estado !== "libre") return toast(`Esa tarjeta ya está ${t.estado === "usada" ? "usada" : "activa"}`, "alert", "malo");
  const x = p.entrega.slots.find(y => !y.codigo); if (!x) return;
  Object.assign(t, { estado: "activa", servicio_id: x.servicio_id, combo: p.entrega.combo, activada: Date.now(), vence: p.entrega.vence, pago_id: p.id, clienta_id: p.clienta_id || null, regalo: p.entrega.regalo || null });
  x.codigo = t.codigo; db.cambio(); toast(serv(x.servicio_id).nombre + " · " + t.codigo, "tag");
}
F.entregarVale = (f, d) => activarVale(mt(), d.codigo);
A.valeSimular = () => { const t = db.listar("tarjetas_impresas", y => y.estado === "libre")[0]; if (!t) return toast("Ya no quedan tarjetas en blanco: manda a imprimir otro lote", "alert", "malo"); activarVale(mt(), t.codigo); };
A.valeEntrega = el => abrir("entregarVales", { pago_id: el.dataset.id });

MODALES.vale = m => {
  const t = tarjetaImpresa(m.cod); if (!t) return cab("Tarjeta");
  const st = estadoVale(t), en = valeEnCita(t.codigo);
  const citas = st === "libre" || st === "usada" ? [] : citasDia(Date.now(), c => !["pagada", "terminada"].includes(c.estado) && c.items.some(i => i.servicio_id === t.servicio_id));
  const titulo = { libre: "Tarjeta en blanco", activa: "Da el paso a un servicio", vencida: "Tarjeta vencida", usada: "Ya se usó" }[st];
  return `${cab(titulo, t.codigo)}<div class="modal-c pila">
    <div class="vale-ver">${valeHTML(t)}</div>
    ${st === "libre" ? `<p class="tenue">Todavía no se ha vendido. Se activa al vender un combo y escanearla.</p>`
    : `<div class="card vale-info"><span class="vale-ic ${st}">${ic(st === "usada" ? "check" : "tag")}</span><div class="row-t"><b>${esc(serv(t.servicio_id).nombre)}</b><small>${esc(t.combo || "")}${t.regalo && t.regalo.para ? " · para " + esc(t.regalo.para) : ""}</small>
      <small>${st === "usada" ? "Se usó el " + fechaCorta(t.usada.fecha) + (t.usada.clienta_id ? " · " + esc(cli(t.usada.clienta_id).nombre) : "") : (st === "vencida" ? "Venció el " : "Vale hasta el ") + fechaCorta(t.vence)}</small></div>${chip({ activa: "Activa", vencida: "Vencida", usada: "Usada" }[st], { activa: "ok", vencida: "aviso", usada: "apagado" }[st])}</div>
      ${st === "vencida" ? `<p class="nc-ant">${ic("alert")}Ya venció, pero puedes darle el paso si el salón lo acepta.</p>` : ""}`}
    ${en ? `<div class="card card-suave fila">${ic("check")}<span class="esp">Ya tiene el paso en la cita de <b>${esc(cli(en.clienta_id).nombre)}</b> · ${hora(en.ini)}. Se descuenta al cobrar.</span><button class="btn btn-t btn-ch" data-a="valeSoltar" data-id="${en.id}">Quitar</button></div>`
    : st === "activa" || st === "vencida" ? `<div class="pila"><p class="eyebrow">Darle el paso</p>
      ${citas.map(c => `<button class="row click" data-a="valeCita" data-id="${c.id}">${avCli(cli(c.clienta_id), 34)}<span class="row-t"><b>${esc(cli(c.clienta_id).nombre)}</b><small>${hora(c.ini)} · ${esc(nombresServ(c))}</small></span>${ic("chev-r")}</button>`).join("")}
      <button class="btn btn-p btn-b" data-a="valeSinCita">${ic("door")}Atenderla ahora, sin cita</button></div>` : ""}
  </div>
  <div class="modal-p">${st === "libre" ? `<button class="btn btn-p" data-a="rcVender">${ic("box")}Vender un combo</button>` : `<a class="btn btn-s" href="${linkVale(t)}" target="_blank" rel="noopener">${ic("eye")}<span>Lo que ve la clienta</span></a>`}<button class="btn btn-s" data-a="cerrar">Cerrar</button></div>`;
};
A.valeCita = el => { const m = mt(), c = citaDe(el); c.vales = [...new Set((c.vales || []).concat(m.cod))]; if (["reservada", "confirmada"].includes(c.estado)) marcarLlegada(c); db.cambio(); cerrar(); toast("Paso otorgado: " + cli(c.clienta_id).nombre.split(" ")[0], "tag"); };
A.valeSoltar = el => { const m = mt(), c = citaDe(el); c.vales = (c.vales || []).filter(v => v !== m.cod); db.cambio(); renderModal(); };
A.valeSinCita = () => { const t = tarjetaImpresa(mt().cod); cerrar(); abrir("rcWalkin", { servicio_id: t.servicio_id, cat: serv(t.servicio_id).cat, vale: t.codigo }); };

/* ---------- cobro ---------- */
const CREDITOS = ["anticipo", "paquete", "membresia", "regalo", "vale"];
function lineasCobro(m) {
  const c = m.id ? db.obtener("citas", m.id) : null, L = [];
  if (c) c.items.forEach(i => {
    L.push({ tipo: "servicio", ref: i.servicio_id, nombre: serv(i.servicio_id).nombre, precio: i.precio, cant: 1, estilista_id: i.estilista_id });
    if (i.arte) L.push({ tipo: "servicio", ref: "arte", nombre: "Diseño de uñas", precio: i.arte, cant: 1, estilista_id: i.estilista_id });
  });
  if (c) (c.productos || []).forEach((p, n) => { const pr = db.obtener("productos", p.producto_id); if (pr) L.push({ tipo: "producto", ref: pr.id, nombre: pr.nombre, precio: pr.precio, cant: p.cant, estilista_id: p.estilista_id || (c.items[0] || {}).estilista_id || null, origen: "cita", n }); });
  m.extra.forEach((p, n) => { const pr = db.obtener("productos", p.producto_id); if (pr) L.push({ tipo: "producto", ref: pr.id, nombre: pr.nombre, precio: pr.precio, cant: p.cant, estilista_id: c ? (c.items[0] || {}).estilista_id : null, origen: "extra", n }); });
  return L;
}
function calcCobro(m) {
  const c = m.id ? db.obtener("citas", m.id) : null, L = lineasCobro(m);
  const kId = c ? c.clienta_id : m.clienta_id || null;
  const subServ = sum(L.filter(l => l.tipo === "servicio"), l => l.precio * l.cant), sub = sum(L, l => l.precio * l.cant);
  let desc = 0;
  if (m.desc === "cumple") desc = subServ * cfg().promo_cumple / 100;
  else if (m.desc === "memb" && kId && membresiaDe(kId)) desc = sub * membresiaDe(kId).descuento / 100;
  else if (m.desc === "pct") desc = subServ * (+m.descV || 0) / 100;
  else if (m.desc === "monto") desc = +m.descV || 0;
  desc = r2(clamp(desc, 0, sub));
  const total = r2(sub - desc), creditos = [];
  let queda = total;
  const cub = new Set();
  const add = (o) => { const v = r2(Math.min(o.monto, queda)); if (v > 0) { creditos.push(Object.assign({}, o, { monto: v })); queda = r2(queda - v); } };
  if (c && c.anticipo && c.anticipo.pagado) add({ metodo: "anticipo", monto: c.anticipo.monto });
  if (m.paquete) {
    const pc = db.obtener("paquetes_clienta", m.paquete), toma = {};
    if (pc) L.forEach((l, i) => { if (l.tipo === "servicio" && paqQuedan(pc, l.ref) - (toma[l.ref] || 0) > 0) { toma[l.ref] = (toma[l.ref] || 0) + 1; cub.add(i); add({ metodo: "paquete", monto: l.precio, ref: m.paquete, sid: l.ref }); } });
  }
  /* tarjetas impresas: cada una paga una sesión de su servicio */
  const vales = [...new Set(((c && c.vales) || []).concat(m.vales || []))];
  vales.forEach(cod => {
    const t = tarjetaImpresa(cod); if (!t || t.estado !== "activa") return;
    const i = L.findIndex((l, j) => l.tipo === "servicio" && l.ref === t.servicio_id && !cub.has(j)); if (i < 0) return;
    cub.add(i); add({ metodo: "vale", monto: L[i].precio, ref: t.codigo });
  });
  if (m.membresia) { const l = L.find(x => x.ref === m.membresia); if (l) add({ metodo: "membresia", monto: l.precio, ref: m.membresia }); }
  if (m.regalo) { const g = db.listar("tarjetas_regalo").find(x => x.codigo === m.regalo); if (g && g.saldo > 0) add({ metodo: "regalo", monto: g.saldo, ref: g.codigo }); }
  const propina = r2(sum(Object.values(m.propinas), v => +v || 0));
  return { c, L, kId, subServ, sub, desc, total, creditos, vales, resta: queda, propina, cobrar: r2(queda + propina) };
}
function metodosCobro(m, x) {
  if (x.cobrar <= 0) return [];
  if (!m.dividir) return [{ metodo: m.metodo, monto: x.resta, conPropina: x.cobrar }];
  const a = r2(clamp(+m.monto1 || 0, 0, x.cobrar)), b = r2(x.cobrar - a);
  return [{ metodo: m.metodo, monto: a, conPropina: a }, { metodo: m.metodo2, monto: b, conPropina: b }].filter(y => y.monto > 0);
}
function resumenCobro(m) {
  const x = calcCobro(m), ms = metodosCobro(m, x);
  const ef = sum(ms.filter(y => y.metodo === "efectivo"), y => y.conPropina);
  const rec = +m.recibido || 0;
  return `<div class="co-res">
    <div class="fila"><span>Subtotal</span><span class="esp"></span><span class="num">${Q(x.sub)}</span></div>
    ${x.desc ? `<div class="fila co-menos"><span>Descuento</span><span class="esp"></span><span class="num">−${Q(x.desc)}</span></div>` : ""}
    ${x.creditos.map(y => `<div class="fila co-menos"><span>${METODOS[y.metodo][0]}</span><span class="esp"></span><span class="num">−${Q(y.monto)}</span></div>`).join("")}
    ${x.propina ? `<div class="fila"><span>Propina</span><span class="esp"></span><span class="num">${Q(x.propina)}</span></div>` : ""}
    <div class="fila co-total"><span>A cobrar</span><span class="esp"></span><b class="num">${Q(x.cobrar)}</b></div>
    ${ef > 0 ? `<div class="fila co-cambio"><span>Cambio</span><span class="esp"></span><b class="num">${rec ? (rec >= ef ? Q(rec - ef) : `<span class="co-falta">faltan ${Q(ef - rec)}</span>`) : "—"}</b></div>` : ""}
  </div>`;
}
function pintarCobro(m) {
  const x = calcCobro(m);
  const r = $("#coResumen"); if (r) r.innerHTML = resumenCobro(m);
  const b = $("#coBtn"); if (b) b.innerHTML = ic("check") + (x.cobrar > 0 ? "Cobrar " + Q(x.cobrar) : "Registrar");
  const s = $("#coSplit"); if (s && m.dividir) s.textContent = Q(r2(x.cobrar - clamp(+m.monto1 || 0, 0, x.cobrar)));
}
MODALES.cobro = m => {
  if (!m._init) { m._init = true; m.ancho = "ancho"; m.extra = []; m.propinas = {}; m.desc = "ninguno"; m.metodo = "tarjeta"; m.metodo2 = "efectivo"; m.dividir = false; }
  const x = calcCobro(m), c = x.c, k = x.kId ? cli(x.kId) : null;
  const ests = c ? estilistasDe(c) : [];
  const pqs = k ? paquetesDe(k.id).filter(p => x.L.some(l => l.tipo === "servicio" && paqQuedan(p, l.ref) > 0)) : [];
  const membs = k ? x.L.filter(l => l.tipo === "servicio").map(l => ({ l, u: usosMembresia(k.id, l.ref) })).filter(y => y.u && y.u.quedan > 0) : [];
  const descs = [["ninguno", "Sin descuento"]];
  if (k && esCumpleMes(k.id)) descs.push(["cumple", "Cumpleaños " + cfg().promo_cumple + "%"]);
  if (k && membresiaDe(k.id)) descs.push(["memb", membresiaDe(k.id).nombre + " " + membresiaDe(k.id).descuento + "%"]);
  descs.push(["pct", "%"], ["monto", "Q"]);
  const l = m.linkId && db.obtener("links_pago", m.linkId);
  const metodoBtns = (clave, actual) => `<div class="co-mets">${["efectivo", "tarjeta", "transferencia", "link"].map(t => `<button class="rc-tog rc-tog-s ${actual === t ? "on" : ""}" data-a="coMetodo" data-k="${clave}" data-v="${t}">${ic(METODOS[t][1])}<b>${METODOS[t][0]}</b></button>`).join("")}</div>`;
  const usaEf = m.metodo === "efectivo" || (m.dividir && m.metodo2 === "efectivo");
  const usaTr = m.metodo === "transferencia" || (m.dividir && m.metodo2 === "transferencia");
  const usaLink = m.metodo === "link" || (m.dividir && m.metodo2 === "link");
  return `${cab(c ? "Cobrar" : "Venta de mostrador", k ? esc(k.nombre) : "")}<div class="modal-c co">
    <div class="co-izq pila">
      ${!c ? campo("Clienta (opcional)", `<select class="inp" id="coCli" data-i="coCli" data-solo="change"><option value="">Sin clienta</option>${buscarClientas("").map(z => `<option value="${z.id}" ${z.id === m.clienta_id ? "selected" : ""}>${esc(z.nombre)}</option>`).join("")}</select>`) : ""}
      <div class="lista co-lineas">${x.L.length ? x.L.map(li => `<div class="row">${li.tipo === "producto" ? ic("bag") : avatar(est(li.estilista_id), 30)}
        <div class="row-t"><b>${esc(li.nombre)}</b><small>${li.tipo === "producto" ? li.cant + " u. · " + Q(li.precio) : esc(est(li.estilista_id).nombre)}</small></div>
        <b class="num">${Q(li.precio * li.cant)}</b>${li.origen ? `<button class="btn btn-t btn-ch btn-i" data-a="coQuitar" data-o="${li.origen}" data-n="${li.n}" aria-label="Quitar">${ic("x")}</button>` : ""}</div>`).join("")
        : `<div class="row"><span class="row-t tenue">Agrega un producto para empezar</span></div>`}
        <button class="row click co-add" data-a="coPicker">${ic("plus")}<span class="row-t"><b>Agregar producto</b></span>${ic(m.picker ? "chev-d" : "chev-r")}</button>
        ${m.picker ? `<div class="co-picker">${db.listar("productos", p => p.tipo === "venta").map(p => `<button class="co-prod" data-a="coProd" data-id="${p.id}"><b>${esc(p.nombre)}</b><small>${Q(p.precio)}${p.stock <= 0 ? " · sin existencia" : p.stock <= p.minimo ? " · quedan " + p.stock : ""}</small></button>`).join("")}</div>` : ""}
      </div>
      ${pqs.length || membs.length ? `<div class="pila co-usos">${pqs.map(p => `<button class="rc-tog co-uso ${m.paquete === p.id ? "on" : ""}" data-a="coPaquete" data-id="${p.id}">${ic("box")}<b>Usar «${esc(p.paquete.nombre)}»</b><small>Quedan ${paqSesiones(p.paquete) - paqUsadas(p)} de ${paqSesiones(p.paquete)}</small></button>`).join("")}
        ${membs.map(y => `<button class="rc-tog co-uso ${m.membresia === y.l.ref ? "on" : ""}" data-a="coMemb" data-v="${y.l.ref}">${ic("crown")}<b>${esc(y.l.nombre)} incluido en ${esc(membresiaDe(k.id).nombre)}</b><small>Quedan ${y.u.quedan} este mes</small></button>`).join("")}</div>` : ""}
      <div><p class="eyebrow">Descuento</p><div class="fila-w">${descs.map(([v, t]) => `<button class="rc-tog rc-tog-s ${m.desc === v ? "on" : ""}" data-a="coDesc" data-v="${v}"><b>${esc(t)}</b></button>`).join("")}</div>
        ${m.desc === "pct" || m.desc === "monto" ? `<input class="inp num co-mini mt" id="coDescV" data-i="coVal" data-k="descV" inputmode="decimal" placeholder="${m.desc === "pct" ? "10" : "50"}" value="${esc(m.descV || "")}" aria-label="Valor del descuento">` : ""}</div>
      <div><p class="eyebrow">Regalo o tarjeta impresa</p><div class="fila"><input class="inp co-mini" id="coRegalo" placeholder="GR-XXXX o TI-XXXXX" autocomplete="off" autocapitalize="characters" value="${esc(m.regalo || "")}" aria-label="Código de la tarjeta de regalo"><button class="btn btn-s btn-ch" data-a="coRegalo">${m.regalo ? "Quitar" : "Aplicar"}</button></div>
        ${m.regalo ? (g => g ? `<p class="small tenue mt">${ic("gift")} ${esc(g.para)} · saldo ${Q(g.saldo)}</p>` : "")(db.listar("tarjetas_regalo").find(z => z.codigo === m.regalo)) : ""}
        ${x.vales.length ? `<div class="fila-w mt">${x.vales.map(cod => { const t = tarjetaImpresa(cod), ok = x.creditos.some(y => y.metodo === "vale" && y.ref === cod); return `<span class="chip ${ok ? "listo" : "apagado"}">${ic("tag")}${esc(cod)} · ${t && t.servicio_id ? esc(serv(t.servicio_id).nombre) : ""}${(m.vales || []).includes(cod) ? `<button class="chip-x" data-a="coValeQuitar" data-v="${esc(cod)}" aria-label="Quitar ${esc(cod)}">${ic("x")}</button>` : ""}</span>`; }).join("")}</div>` : ""}</div>
      ${ests.length ? `<div><p class="eyebrow">Propina</p>${ests.map(e => { const base = sum(x.L.filter(li => li.tipo === "servicio" && li.estilista_id === e.id), li => li.precio), v = +m.propinas[e.id] || 0; return `<div class="co-prop">${avatar(e, 30)}<b class="trunc">${esc(e.nombre.split(" ")[0])}</b><span class="esp"></span>
        <div class="fila-w">${[0, 5, 10, 15].map(p => { const val = Math.round(base * p / 100 / 5) * 5; return `<button class="rc-tog rc-tog-s ${(p ? v === val && val > 0 : !v) ? "on" : ""}" data-a="coProp" data-e="${e.id}" data-v="${val}"><b>${p ? p + "%" : "No"}</b></button>`; }).join("")}
        <input class="inp num co-mini co-pin" id="coProp_${e.id}" data-i="coPropIn" data-e="${e.id}" inputmode="decimal" placeholder="Q" value="${v || ""}" aria-label="Propina para ${esc(e.nombre)}"></div></div>`; }).join("")}</div>` : ""}
    </div>
    <div class="co-der pila">
      <div><p class="eyebrow">Forma de pago</p>${metodoBtns("metodo", m.metodo)}</div>
      <label class="check"><input type="checkbox" data-a="coDividir" ${m.dividir ? "checked" : ""}> Dividir en dos formas</label>
      ${m.dividir ? `<div class="pila co-split">${campo("Monto con " + METODOS[m.metodo][0].toLowerCase(), `<input class="inp num" id="coMonto1" data-i="coVal" data-k="monto1" inputmode="decimal" value="${esc(m.monto1 || "")}">`)}
        ${metodoBtns("metodo2", m.metodo2)}<p class="small tenue">Resto con ${METODOS[m.metodo2][0].toLowerCase()}: <b id="coSplit">${Q(r2(x.cobrar - clamp(+m.monto1 || 0, 0, x.cobrar)))}</b></p></div>` : ""}
      ${usaEf ? campo("Recibido en efectivo", `<input class="inp num" id="coRecibido" data-i="coVal" data-k="recibido" inputmode="decimal" placeholder="0" value="${esc(m.recibido || "")}">`) : ""}
      ${usaTr ? `<div class="card card-suave small">${ic("bank")} ${esc(cfg().banco)}${campo("No. de boleta", `<input class="inp" id="coBoleta" autocomplete="off">`)}</div>` : ""}
      ${usaLink ? `<div class="card card-suave co-linkbox">${l ? `<div class="nc-qr" data-qr="${esc(urlLink(l))}"></div><div class="pila"><b>${Q(l.monto)}</b>${l.estado === "pagado" ? chip(ic("check") + "Pagado", "ok") : chip(`<span class="punto"></span>Esperando`, "aviso vivo")}
        <a class="btn btn-s btn-ch" href="${waLink(k ? k.tel : "", "Tu link de pago de " + MARCA.nombre + ": " + urlLink(l))}" target="_blank" rel="noopener">${ic("msg")}Enviar</a></div>`
        : `<button class="btn btn-s btn-b" data-a="coLink">${ic("link")}Generar link de pago</button>`}</div>` : ""}
      <div id="coResumen">${resumenCobro(m)}</div>
    </div>
  </div>
  <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p btn-g" id="coBtn" data-a="coCobrar">${ic("check")}${x.cobrar > 0 ? "Cobrar " + Q(x.cobrar) : "Registrar"}</button></div>`;
};
I.coVal = el => { const m = mt(); m[el.dataset.k] = el.value; pintarCobro(m); };
I.coPropIn = el => { const m = mt(); m.propinas[el.dataset.e] = el.value; pintarCobro(m); };
I.coCli = el => { const m = mt(); m.clienta_id = el.value || null; renderModal(); };
A.coProp = el => { const m = mt(); m.propinas[el.dataset.e] = +el.dataset.v; renderModal(); };
A.coMetodo = el => { const m = mt(); m[el.dataset.k] = el.dataset.v; renderModal(); };
A.coDividir = el => { const m = mt(); m.dividir = el.checked; if (m.dividir && m.metodo2 === m.metodo) m.metodo2 = m.metodo === "efectivo" ? "tarjeta" : "efectivo"; setTimeout(renderModal, 0); };
A.coDesc = el => { const m = mt(); m.desc = el.dataset.v; renderModal(); };
A.coPaquete = el => { const m = mt(); m.paquete = m.paquete === el.dataset.id ? null : el.dataset.id; renderModal(); };
A.coMemb = el => { const m = mt(); m.membresia = m.membresia === el.dataset.v ? null : el.dataset.v; renderModal(); };
A.coPicker = () => { const m = mt(); m.picker = !m.picker; renderModal(); };
A.coProd = el => {
  const m = mt(), p = db.obtener("productos", el.dataset.id), y = m.extra.find(z => z.producto_id === p.id);
  if (y) y.cant++; else m.extra.push({ producto_id: p.id, cant: 1 });
  if (p.stock <= 0) toast("No hay existencia registrada de " + p.nombre, "alert"); else toast(p.nombre + " agregado", "bag");
  renderModal();
};
A.coQuitar = el => {
  const m = mt();
  if (el.dataset.o === "extra") m.extra.splice(+el.dataset.n, 1);
  else { const c = db.obtener("citas", m.id); c.productos.splice(+el.dataset.n, 1); db.cambio(); }
  renderModal();
};
A.coRegalo = () => {
  const m = mt();
  if (m.regalo) { m.regalo = null; renderModal(); return; }
  const cod = ($("#coRegalo").value || "").trim().toUpperCase(), g = db.listar("tarjetas_regalo").find(z => z.codigo === cod);
  const ti = !g && tarjetaImpresa(cod);
  if (ti) {
    const st = estadoVale(ti), x = calcCobro(m);
    if (st === "libre") return toast("Esa tarjeta está en blanco: todavía no se ha vendido", "alert", "malo");
    if (st === "usada") return toast("Esa tarjeta ya se usó el " + fechaCorta(ti.usada.fecha), "alert", "malo");
    if (!x.L.some(l => l.tipo === "servicio" && l.ref === ti.servicio_id)) return toast("Es para " + serv(ti.servicio_id).nombre + " y no está en esta cuenta", "alert", "malo");
    if (st === "vencida") toast("Ojo: venció el " + fechaCorta(ti.vence) + ". Se aplica igual.", "alert");
    m.vales = [...new Set((m.vales || []).concat(ti.codigo))]; $("#coRegalo").value = ""; renderModal(); toast("Tarjeta aplicada: " + serv(ti.servicio_id).nombre, "tag"); return;
  }
  const cb = !g && comboRegalo(cod);
  if (cb) {
    const kId = calcCobro(m).kId;
    if (cb.clienta_id && cb.clienta_id !== kId) return toast("Ese combo ya lo canjeó " + cli(cb.clienta_id).nombre.split(" ")[0], "alert", "malo");
    if (!kId) return toast("Escoge primero a la clienta que lo recibe", "alert");
    if (!cb.clienta_id) { cb.clienta_id = kId; db.cambio(); toast(`«${paqDe(cb).nombre}» ya es de ${cli(kId).nombre.split(" ")[0]}`, "gift"); }
    m.paquete = cb.id; renderModal(); return;
  }
  if (!g) return toast("No encontré esa tarjeta de regalo", "alert", "malo");
  if (g.saldo <= 0) return toast("Esa tarjeta ya no tiene saldo", "alert", "malo");
  m.regalo = g.codigo; renderModal(); toast("Saldo disponible " + Q(g.saldo), "gift");
};
A.coValeQuitar = el => { const m = mt(); m.vales = (m.vales || []).filter(v => v !== el.dataset.v); renderModal(); };
A.coLink = () => {
  const m = mt(), x = calcCobro(m), ms = metodosCobro(m, x), y = ms.find(z => z.metodo === "link");
  const monto = y ? y.conPropina : x.cobrar; if (monto <= 0) return toast("No hay monto para el link", "alert");
  const l = crearLink(monto, (x.c ? "Cuenta de " + cli(x.c.clienta_id).nombre.split(" ")[0] : "Compra") + " · " + MARCA.nombre, x.c ? x.c.id : null);
  m.linkId = l.id; renderModal();
};
A.coCobrar = async () => {
  const m = mt(); if (!m || m.tipo !== "cobro") return;
  const x = calcCobro(m);
  if (!x.L.length) return toast("Agrega algo para cobrar", "alert", "malo");
  const ms = metodosCobro(m, x);
  const l = m.linkId && db.obtener("links_pago", m.linkId);
  if (ms.some(y => y.metodo === "link") && (!l || l.estado !== "pagado")) {
    if (!(await confirmar({ titulo: "El link aún no aparece pagado", texto: "Puedes registrar el cobro de todos modos y revisarlo después.", si: "Registrar cobro" }))) return;
  }
  const ef = sum(ms.filter(y => y.metodo === "efectivo"), y => y.conPropina);
  if (ef && m.recibido && +m.recibido < ef) toast("Recibiste menos de lo que toca en efectivo", "alert");
  // la propina va con la forma de pago principal; los montos de métodos cubren solo el total
  const propina = x.propina; let porRepartir = propina;
  const metodos = x.creditos.concat(ms.map(y => { const sinProp = r2(Math.max(0, y.conPropina - porRepartir)); const usada = r2(y.conPropina - sinProp); porRepartir = r2(porRepartir - usada); return { metodo: y.metodo, monto: sinProp, ref: y.metodo === "link" && l ? l.codigo : y.metodo === "transferencia" ? (($("#coBoleta") || {}).value || "") : undefined }; }).filter(y => y.monto > 0));
  const propinas = {}; Object.entries(m.propinas).forEach(([e, v]) => { if (+v > 0) propinas[e] = r2(+v); });
  const lineas = x.L.map(({ origen, n, ...li }) => li);
  const pg = registrarCobro(x.c, { lineas, descuento: x.desc, metodos, propinas, clienta_id: x.kId });
  pg.propina_metodo = m.metodo; if (ef) { pg.recibido = +m.recibido || ef; pg.cambio = r2(Math.max(0, (+m.recibido || ef) - ef)); }
  if (x.c && x.c.anticipo && x.c.anticipo.pagado) x.c.anticipo.aplicado = true;
  db.guardar();
  cerrar(); abrir("recibo", { id: pg.id, nuevo: true });
};

/* ---------- recibo ---------- */
MODALES.recibo = m => {
  const p = db.obtener("pagos", m.id); if (!p) return cab("Recibo");
  const k = p.clienta_id ? cli(p.clienta_id) : null, prop = sum(Object.values(p.propinas || {})), pts = Math.floor(p.total / cfg().puntos_cada);
  return `${cab(m.nuevo ? "Cobro registrado" : "Recibo")}<div class="modal-c">
    ${m.nuevo ? `<div class="nc-ok">${ic("check")}</div>` : ""}
    <div class="recibo">
      <div class="recibo-h">${logo(46)}<b>${esc(MARCA.nombre)}</b><small>${esc(fechaLarga(p.fecha))} · ${hora(p.fecha)}</small></div>
      ${k ? `<p class="recibo-cli">${esc(k.nombre)}</p>` : ""}
      <div class="recibo-l">${p.lineas.map(l => `<div class="fila"><span>${esc(l.nombre)}${l.cant > 1 ? " ×" + l.cant : ""}</span><span class="esp"></span><span class="num">${Q(l.precio * l.cant)}</span></div>`).join("")}
        ${p.descuento ? `<div class="fila"><span>Descuento</span><span class="esp"></span><span class="num">−${Q(p.descuento)}</span></div>` : ""}</div>
      <div class="fila recibo-t"><span>Total</span><span class="esp"></span><b class="num">${Q(p.total)}</b></div>
      <div class="recibo-l">${p.metodos.map(x => `<div class="fila tenue"><span>${METODOS[x.metodo] ? METODOS[x.metodo][0] : x.metodo}</span><span class="esp"></span><span class="num">${Q(x.monto)}</span></div>`).join("")}
        ${prop ? `<div class="fila tenue"><span>Propina</span><span class="esp"></span><span class="num">${Q(prop)}</span></div>` : ""}
        ${p.cambio ? `<div class="fila tenue"><span>Cambio</span><span class="esp"></span><span class="num">${Q(p.cambio)}</span></div>` : ""}</div>
      ${k ? `<p class="recibo-pts">${ic("star")} +${pts} puntos · tienes ${k.puntos}</p>` : ""}
      ${k && p.sello ? `<p class="recibo-pts">${p.premio ? ic("gift") + " ¡Completó la tarjeta! Ganó " + esc(lealtad().premio.toLowerCase()) : ic("check") + " Sello " + p.sello + " de " + lealtad().sellos}</p>` : ""}
      <p class="recibo-gr">Gracias por venir</p>
    </div></div>
    <div class="modal-p">${p.entrega && p.entrega.slots.some(y => !y.codigo) ? `<button class="btn btn-p" data-a="valeEntrega" data-id="${p.id}">${ic("tag")}Entregar tarjetas</button>` : ""}${k ? `<a class="btn btn-s" href="${waLink(k.tel, reciboTexto(p))}" target="_blank" rel="noopener">${ic("msg")}WhatsApp</a>` : ""}<button class="btn btn-s" data-a="coReciboPNG" data-id="${p.id}">${ic("download")}Imagen</button><button class="btn btn-p" data-a="cerrar">Listo</button></div>`;
};
function reciboTexto(p) {
  return `${MARCA.nombre} · ${fechaCorta(p.fecha)} ${hora(p.fecha)}\n` + p.lineas.map(l => `${l.nombre}: ${Q(l.precio * l.cant)}`).join("\n") + (p.descuento ? `\nDescuento: −${Q(p.descuento)}` : "") + `\nTotal: ${Q(p.total)}\n¡Gracias por venir!`;
}
A.coReciboPNG = el => {
  const p = db.obtener("pagos", el.dataset.id); if (!p) return;
  const C = MARCA.colores, W = 720, k = p.clienta_id ? cli(p.clienta_id) : null;
  const filas = p.lineas.length + p.metodos.length + (p.descuento ? 1 : 0) + (Object.keys(p.propinas || {}).length ? 1 : 0);
  const H = 430 + filas * 46;
  const cv = document.createElement("canvas"); cv.width = W * 2; cv.height = H * 2; const g = cv.getContext("2d"); g.scale(2, 2);
  g.fillStyle = C.fondo; g.fillRect(0, 0, W, H);
  g.fillStyle = C.tarjeta; g.beginPath(); g.roundRect ? g.roundRect(32, 32, W - 64, H - 64, 28) : g.rect(32, 32, W - 64, H - 64); g.fill();
  g.strokeStyle = C.acento; g.lineWidth = 1.4; g.beginPath(); g.arc(W / 2, 96, 34, 0, Math.PI * 2); g.stroke();
  g.textAlign = "center"; g.fillStyle = C.tinta; g.font = `500 24px "${MARCA.fuentes.titulo}", Georgia, serif`; g.fillText(MARCA.monograma || "", W / 2, 105);
  g.font = `500 34px "${MARCA.fuentes.titulo}", Georgia, serif`; g.fillText(MARCA.nombre, W / 2, 172);
  g.font = `600 15px "${MARCA.fuentes.texto}", sans-serif`; g.fillStyle = C.tenue; g.fillText(fechaLarga(p.fecha) + " · " + hora(p.fecha) + (k ? " · " + k.nombre : ""), W / 2, 202);
  let y = 256; g.textAlign = "left";
  const fila = (a, b, col = C.tinta, peso = 500) => { g.fillStyle = col; g.font = `${peso} 18px "${MARCA.fuentes.texto}", sans-serif`; g.textAlign = "left"; g.fillText(a, 72, y); g.textAlign = "right"; g.fillText(b, W - 72, y); y += 46; };
  p.lineas.forEach(l => fila(l.nombre + (l.cant > 1 ? " ×" + l.cant : ""), Q(l.precio * l.cant)));
  if (p.descuento) fila("Descuento", "−" + Q(p.descuento));
  g.strokeStyle = C.linea; g.beginPath(); g.moveTo(72, y - 26); g.lineTo(W - 72, y - 26); g.stroke(); y += 8;
  g.fillStyle = C.tinta; g.font = `500 30px "${MARCA.fuentes.titulo}", Georgia, serif`; g.textAlign = "left"; g.fillText("Total", 72, y); g.textAlign = "right"; g.fillText(Q(p.total), W - 72, y); y += 50;
  p.metodos.forEach(x => fila(METODOS[x.metodo] ? METODOS[x.metodo][0] : x.metodo, Q(x.monto), C.tenue));
  const prop = sum(Object.values(p.propinas || {})); if (prop) fila("Propina", Q(prop), C.tenue);
  g.textAlign = "center"; g.fillStyle = C.acentoTexto; g.font = `italic 500 22px "${MARCA.fuentes.titulo}", Georgia, serif`; g.fillText("Gracias por venir", W / 2, H - 70);
  const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "recibo-" + MARCA.corto.toLowerCase() + "-" + p.id + ".png";
  document.body.appendChild(a); a.click(); a.remove(); toast("Recibo descargado", "download");
};

/* ============================================================
   Ficha de belleza de la clienta
   ============================================================ */
const SECS_FICHA = [["perfil", "Perfil", "user"], ["historial", "Historial", "cal"], ["color", "Color", "drop"], ["pestanas", "Pestañas", "eye"], ["fotos", "Antes y después", "camera"], ["firmas", "Firmas", "pen"]];
const CONSENT = {
  "Alisado o keratina": "Entiendo que el tratamiento usa productos químicos, que debo esperar 72 horas para lavar y que el resultado depende del estado de mi cabello.",
  "Color y químicos": "Informé alergias y tratamientos previos. Acepto la prueba de sensibilidad y entiendo que el tono final puede variar según mi base.",
  "Depilación": "Confirmo que no uso retinoides ni tengo piel irritada en la zona. Entiendo que puede haber enrojecimiento temporal.",
  "Pestañas": "Entiendo los cuidados de las primeras 24 horas, que debo evitar aceites y que informé alergias o sensibilidad en los ojos."
};
const PEST_DEF = () => ({ curva: "C", grosor: "0.07", tipo: "Clásicas", largos: [8, 9, 10, 11, 12, 11, 10], notas: "" });

MODALES.ficha = m => {
  m.ancho = "ancho"; m.sec = m.sec || "perfil";
  const k = db.obtener("clientas", m.id); if (!k) return `${cab("Ficha")}<div class="modal-c">${vacio("No encontré a la clienta")}</div>`;
  const mb = membresiaDe(k.id), visitas = citasDe(k.id).filter(c => c.estado === "pagada").length;
  const cuerpo = { perfil: fiPerfil, historial: fiHistorial, color: fiColor, pestanas: fiPestanas, fotos: fiFotos, firmas: fiFirmas }[m.sec] || fiPerfil;
  return `${cab("Ficha de belleza", esc(k.nombre))}<div class="modal-c fi">
    <div class="fi-cab">${avCli(k, 64)}<div class="row-t"><h3 class="h3">${esc(k.nombre)}</h3><small class="tenue">${telFmt(k.tel)} · ${visitas} visita${visitas === 1 ? "" : "s"}${k.creado ? " · desde " + MESES_C[new Date(k.creado).getMonth()] + " " + new Date(k.creado).getFullYear() : ""}</small>
      <div class="fila-w">${k.vip ? chip(ic("crown") + "VIP", "oro") : ""}${mb ? chip(ic("crown") + esc(mb.nombre), "listo") : ""}${esCumpleMes(k.id) ? chip(ic("cake") + "Cumple " + k.cumple.split("-").reverse().join("/"), "listo") : ""}${chip(ic("star") + k.puntos + " pts")}</div></div>
      <a class="btn btn-s btn-ch btn-i" href="${waLink(k.tel, "Hola " + k.nombre.split(" ")[0] + ", ")}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic("msg")}</a></div>
    ${k.alergias ? `<div class="fi-alerta">${ic("alert")}<div><b>Atención</b><span>${esc(k.alergias)}</span></div></div>` : ""}
    <div class="fi-tarjeta"><span class="fi-t-sellos">${Array.from({ length: lealtad().sellos }, (_, i) => `<i class="${i < (k.sellos || 0) ? "on" : ""}"></i>`).join("")}</span>
      <span class="esp small"><b>${k.sellos || 0} de ${lealtad().sellos} sellos</b>${k.premios ? ` · <b class="oro-t">${k.premios} premio${k.premios === 1 ? "" : "s"}</b>` : ""}${k.wallet && (k.wallet.apple || k.wallet.google) ? ` · en ${k.wallet.apple ? "Apple" : "Google"} Wallet` : ""}</span>
      ${k.premios ? `<button class="btn btn-a btn-ch" data-a="fiCanjear" data-id="${k.id}">${ic("gift")}Canjear</button>` : ""}
      <a class="btn btn-s btn-ch" target="_blank" rel="noopener" href="${waLink(k.tel, "Hola " + k.nombre.split(" ")[0] + ", esta es tu tarjeta de puntos de " + MARCA.nombre + ": " + linkTarjeta(k))}">${ic("send")}Enviar tarjeta</a></div>
    <div class="fi-secs">${seg("fiSec", SECS_FICHA, m.sec, "fiSec")}</div>
    <div class="fi-cuerpo">${cuerpo(k, m)}</div>
  </div>`;
};
A.fiSec = el => { const m = mt(); m.sec = el.dataset.v; m.editar = false; m.editPest = false; m.nuevaFormula = false; m.firmando = false; renderModal(); };

/* perfil */
function fiPerfil(k, m) {
  const mb = membresiaDe(k.id), pqs = paquetesDe(k.id), regalos = db.listar("tarjetas_regalo", g => g.para.toLowerCase() === k.nombre.toLowerCase() && g.saldo > 0);
  const ult = ultimaVisita(k.id), gasto = gastoDe(k.id), ret = retoques().filter(r => r.clienta.id === k.id);
  if (m.editar) {
    const [cm, cd] = (k.cumple || "-").split("-");
    return `<form class="pila fi-form" data-f="fiPerfil" id="fPerfil">
      <div class="g2">${campo("Nombre", `<input class="inp" id="fiNom" name="nombre" value="${esc(k.nombre)}" required>`)}${campo("WhatsApp", `<input class="inp" id="fiTel" name="tel" inputmode="tel" value="${esc(k.tel)}">`)}</div>
      <div class="g2">${campo("Cumpleaños", `<div class="fila"><select class="inp" id="fiCumD" name="cd"><option value="">Día</option>${Array.from({ length: 31 }, (_, i) => `<option ${+cd === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("")}</select><select class="inp" id="fiCumM" name="cm"><option value="">Mes</option>${MESES.map((x, i) => `<option value="${i + 1}" ${+cm === i + 1 ? "selected" : ""}>${x}</option>`).join("")}</select></div>`)}
        ${campo("Cómo nos conoció", `<input class="inp" id="fiOri" name="origen" value="${esc(k.origen)}">`)}</div>
      <div class="g2">${campo("Bebida favorita", `<input class="inp" id="fiBeb" name="bebida" value="${esc(k.bebida)}">`)}${campo("Alergias y avisos", `<input class="inp" id="fiAle" name="alergias" value="${esc(k.alergias)}" placeholder="Ninguna">`)}</div>
      ${campo("Notas y preferencias", `<textarea class="inp" id="fiNot" name="notas" rows="3">${esc(k.notas)}</textarea>`)}
      <label class="check"><input type="checkbox" name="vip" id="fiVip" ${k.vip ? "checked" : ""}> Clienta VIP</label>
      <div class="fila fi-btns"><span class="esp"></span><button type="button" class="btn btn-s" data-a="fiEditar" data-v="0">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
  }
  return `<div class="fi-stats">
      <div class="card kpi"><small>Visitas</small><b>${citasDe(k.id).filter(c => c.estado === "pagada").length}</b></div>
      <div class="card kpi"><small>Ha gastado</small><b>${Q(gasto)}</b></div>
      <div class="card kpi"><small>Última visita</small><b class="fi-kpi-s">${ult ? esc(diaRel(ult.ini)) : "—"}</b></div>
      <div class="card kpi"><small>Faltas</small><b>${k.faltas || 0}</b></div></div>
    <div class="g2">
      <div class="lista fi-datos">
        <div class="row"><span class="row-t"><small>Cumpleaños</small><b>${k.cumple ? +k.cumple.split("-")[1] + " de " + MESES[+k.cumple.split("-")[0] - 1] : "—"}</b></span></div>
        <div class="row"><span class="row-t"><small>Bebida</small><b>${esc(k.bebida || "—")}</b></span></div>
        <div class="row"><span class="row-t"><small>Cómo nos conoció</small><b>${esc(k.origen || "—")}</b></span></div>
        <div class="row"><span class="row-t"><small>Notas</small><b class="fi-wrap">${esc(k.notas || "—")}</b></span></div>
        <div class="row"><span class="esp"></span><button class="btn btn-s btn-ch" data-a="fiEditar" data-v="1">${ic("pen")}Editar</button></div>
      </div>
      <div class="pila">
        ${ret.map(r => `<div class="card fi-ret"><span class="fi-ret-ic">${ic(r.cat.icono)}</span><div class="row-t"><b>Retoque de ${r.cat.nombre.toLowerCase()}</b><small>${r.toca < Date.now() ? "Le tocaba " + esc(diaRel(r.toca).toLowerCase()) : "Le toca " + esc(diaRel(r.toca).toLowerCase())}</small></div>
          <button class="btn btn-p btn-ch" data-a="fiRetoque" data-id="${k.id}" data-s="${r.ultima.items[0].servicio_id}">Agendar retoque</button></div>`).join("")}
        ${mb ? `<div class="card fi-mb" style="--c:${mb.color}"><span>${ic("crown")}</span><div class="row-t"><b>${esc(mb.nombre)}</b><small>${esc(mb.desc)}</small></div><b class="num">${Q(mb.precio)}/mes</b></div>` : ""}
        ${pqs.map(p => `<div class="card fi-pq"><div class="fila">${ic("box")}<b class="trunc">${esc(p.paquete.nombre)}</b><span class="esp"></span><small class="tenue">${paqUsadas(p)}/${paqSesiones(p.paquete)}</small></div>${p.paquete.items ? `<small class="tenue">${esc(paqResumen(p.paquete))}</small>` : ""}<div class="barra"><i style="width:${paqUsadas(p) / paqSesiones(p.paquete) * 100}%"></i></div></div>`).join("")}
        ${regalos.map(g => `<div class="card fi-pq"><div class="fila">${ic("gift")}<b>Tarjeta ${esc(g.codigo)}</b><span class="esp"></span><b class="num">${Q(g.saldo)}</b></div></div>`).join("")}
        ${!ret.length && !mb && !pqs.length && !regalos.length ? `<div class="card card-suave">${vacio("Sin paquetes ni retoques pendientes", `<button class="btn btn-s btn-ch" data-a="fiRetoque" data-id="${k.id}">${ic("cal")}Nueva cita</button>`)}</div>` : ""}
      </div></div>`;
}
A.fiEditar = el => { mt().editar = el.dataset.v === "1"; renderModal(); };
F.fiPerfil = (f, d) => {
  const m = mt(), k = db.obtener("clientas", m.id);
  Object.assign(k, { nombre: d.nombre.trim() || k.nombre, tel: String(d.tel).replace(/\D/g, "").replace(/^502/, ""), origen: d.origen, bebida: d.bebida, alergias: d.alergias.trim(), notas: d.notas, vip: !!d.vip, cumple: d.cm && d.cd ? String(d.cm).padStart(2, "0") + "-" + String(d.cd).padStart(2, "0") : k.cumple });
  m.editar = false; db.cambio(); toast("Ficha guardada");
};
A.fiRetoque = el => abrir("nuevaCita", { clienta_id: el.dataset.id, servicio_id: el.dataset.s || undefined });

/* historial */
function fiHistorial(k) {
  const l = citasDe(k.id).slice(0, 30);
  if (!l.length) return vacio("Todavía no tiene citas");
  return `<div class="lista">${l.map(c => { const st = ESTADOS[c.estado]; return `<div class="row fi-h">
    ${c.diseno ? miniDiseno(c.diseno, 52) : `<span class="fi-h-ic">${ic(catDe(serv(c.items[0].servicio_id).cat).icono)}</span>`}
    <div class="row-t"><b>${esc(nombresServ(c))}</b><small>${esc(fechaCorta(c.ini))} ${new Date(c.ini).getFullYear() !== new Date().getFullYear() ? new Date(c.ini).getFullYear() : ""} · ${esc(estilistasDe(c).map(e => e.nombre.split(" ")[0]).join(", "))}</small></div>
    ${c.estado !== "pagada" ? chip(st.t, st.c) : `<b class="num small">${Q(totalConArte(c))}</b>`}
    ${c.diseno ? `<button class="btn btn-s btn-ch" data-a="fiRepetir" data-id="${c.id}">${ic("refresh")}Repetir</button>` : ""}</div>`; }).join("")}</div>`;
}
A.fiRepetir = el => {
  const c = citaDe(el), it = c.items.find(i => serv(i.servicio_id).diseno) || c.items[0];
  abrir("nuevaCita", { clienta_id: c.clienta_id, servicio_id: it.servicio_id, diseno: JSON.parse(JSON.stringify(c.diseno)) });
};

/* color */
function fiColor(k, m) {
  const l = (k.color || []).slice().sort((a, b) => b.fecha - a.fecha);
  return `${m.nuevaFormula ? `<form class="card pila fi-nf" data-f="fiFormula" id="fFormula">
      <div class="g2">${campo("Marca", `<input class="inp" id="fcMarca" name="marca" placeholder="Wella Koleston" value="${esc(l[0] ? l[0].marca : "")}">`)}${campo("Fórmula", `<input class="inp" id="fcForm" name="formula" placeholder="7/1 + 8/81 (1:1)" required>`)}</div>
      <div class="g3">${campo("Oxidante", `<input class="inp" id="fcOx" name="oxidante" placeholder="20 vol · 1:1.5">`)}${campo("Tiempo (min)", `<input class="inp num" id="fcTiempo" name="tiempo" inputmode="numeric" placeholder="35">`)}${campo("Tono final", `<input class="inp fi-color-inp" type="color" id="fcHex" name="hex" value="${l[0] ? l[0].hex : "#8A6A4E"}">`)}</div>
      ${campo("Resultado", `<input class="inp" id="fcRes" name="resultado" placeholder="Cómo quedó, qué ajustar la próxima">`)}
      <div class="fila"><span class="esp"></span><button type="button" class="btn btn-s" data-a="fiNF" data-v="0">Cancelar</button><button class="btn btn-p">Guardar fórmula</button></div></form>`
    : `<div class="fila mb"><p class="tx2">Fórmulas de color de cada visita.</p><span class="esp"></span><button class="btn btn-p btn-ch" data-a="fiNF" data-v="1">${ic("plus")}Nueva fórmula</button></div>`}
    ${l.length ? `<div class="pila">${l.map((f, i) => `<div class="card fi-f ${i === 0 ? "fi-f-ult" : ""}"><span class="fi-sw" style="background:${esc(f.hex)}"></span>
      <div class="row-t"><div class="fila"><b>${esc(f.formula)}</b>${i === 0 ? chip("Última", "listo") : ""}</div><small>${esc(f.marca)} · ${esc(f.oxidante || "")}${f.tiempo ? " · " + f.tiempo + " min" : ""}</small>${f.resultado ? `<p class="small fi-res">${esc(f.resultado)}</p>` : ""}</div>
      <small class="tenue">${esc(fechaCorta(f.fecha))}</small></div>`).join("")}</div>`
    : vacio("Sin fórmulas guardadas")}`;
}
A.fiNF = el => { mt().nuevaFormula = el.dataset.v === "1"; renderModal(); };
F.fiFormula = (f, d) => {
  const m = mt(), k = db.obtener("clientas", m.id); k.color = k.color || [];
  k.color.push({ id: uid(), fecha: Date.now(), marca: d.marca, formula: d.formula, oxidante: d.oxidante, tiempo: +d.tiempo || null, resultado: d.resultado, hex: d.hex });
  m.nuevaFormula = false; db.cambio(); toast("Fórmula guardada", "drop");
};

/* pestañas */
function ojoSVG(p) {
  const P0 = [36, 122], C = [160, 18], P2 = [284, 122];
  const pt = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1]];
  const der = t => [2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0]), 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1])];
  const curl = { J: .12, B: .25, C: .4, CC: .52, D: .65 }[p.curva] || .4, ancho = { "0.05": 1, "0.07": 1.3, "0.10": 1.75, "0.15": 2.3 }[p.grosor] || 1.3;
  const n = p.tipo === "Volumen" ? 9 : p.tipo === "Híbridas" ? 7 : 5;
  let pest = "", etq = "";
  p.largos.forEach((L, z) => {
    const tc = .1 + z * (.8 / 6);
    for (let j = 0; j < n; j++) {
      const t = tc + (j - (n - 1) / 2) * (.11 / n);
      const [x, y] = pt(t), [dx, dy] = der(t); let nx = dy, ny = -dx; const h = Math.hypot(nx, ny); nx /= h; ny /= h; if (ny > 0) { nx = -nx; ny = -ny; }
      const len = L * 5.1 * (j % 2 ? .94 : 1), sx = (t - .5) * len * .7;
      const ex = x + nx * len + sx, ey = y + ny * len - curl * len * .25;
      const cx = x + nx * len * .55 + sx * .3, cy = y + ny * len * .55 + curl * len * .18;
      pest += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke-width="${ancho}"/>`;
    }
    const [x, y] = pt(tc), [dx, dy] = der(tc); let nx = dy, ny = -dx; const h = Math.hypot(nx, ny); nx /= h; ny /= h; if (ny > 0) { nx = -nx; ny = -ny; }
    const len = L * 5.1 + 18, sx = (tc - .5) * (L * 5.1) * .7;
    etq += `<text x="${(x + nx * len + sx).toFixed(1)}" y="${(y + ny * len - curl * 6).toFixed(1)}">${L}</text>`;
  });
  return `<svg class="fi-ojo" viewBox="0 -44 320 220" role="img" aria-label="Mapa de pestañas ${esc(p.tipo)} curva ${esc(p.curva)}">
    <defs><clipPath id="ojoClip"><path d="M36 122 Q160 18 284 122 Q160 186 36 122Z"/></clipPath>
      <radialGradient id="iris" cx=".45" cy=".4"><stop offset="0" stop-color="#9C7A55"/><stop offset=".7" stop-color="#5A3E28"/><stop offset="1" stop-color="#2E2016"/></radialGradient></defs>
    <path d="M36 122 Q160 18 284 122 Q160 186 36 122Z" fill="#FBF8F4"/>
    <g clip-path="url(#ojoClip)"><circle cx="160" cy="112" r="38" fill="url(#iris)"/><circle cx="160" cy="112" r="15" fill="#140E0A"/><circle cx="148" cy="100" r="6" fill="#fff" opacity=".85"/></g>
    <path d="M36 122 Q160 18 284 122" fill="none" stroke="var(--tinta)" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 122 Q160 186 284 122" fill="none" stroke="var(--tenue)" stroke-width="1.2" opacity=".6"/>
    <g class="fi-pest" fill="none" stroke="var(--tinta)" stroke-linecap="round">${pest}</g>
    <g class="fi-etq">${etq}</g></svg>`;
}
function fiPestanas(k, m) {
  const p = m.editPest ? m.pd : (k.pestanas || null);
  if (!p) return `<div class="card card-suave centro fi-pv">${ojoSVG(PEST_DEF())}<p class="tx2 mt">Todavía no tiene mapa de pestañas.</p><button class="btn btn-p mt" data-a="fiPest" data-v="1">${ic("plus")}Crear mapa</button></div>`;
  const opt = (clave, ops) => `<div class="fila-w">${ops.map(o => `<button class="rc-tog rc-tog-s ${String(p[clave]) === o ? "on" : ""}" data-a="fiPestSet" data-k="${clave}" data-v="${o}"><b>${o}</b></button>`).join("")}</div>`;
  return `<div class="fi-pest-l">
    <div class="card fi-pv">${ojoSVG(p)}<p class="tenue xs centro">Largos en milímetros, del lagrimal a la esquina exterior</p></div>
    <div class="pila">${m.editPest ? `
      <div><p class="eyebrow">Técnica</p>${opt("tipo", ["Clásicas", "Híbridas", "Volumen"])}</div>
      <div><p class="eyebrow">Curva</p>${opt("curva", ["J", "B", "C", "CC", "D"])}</div>
      <div><p class="eyebrow">Grosor</p>${opt("grosor", ["0.05", "0.07", "0.10", "0.15"])}</div>
      <div><p class="eyebrow">Largos por zona</p><div class="fi-largos">${p.largos.map((L, z) => `<div class="fi-lz"><button class="btn btn-s btn-ch btn-i" data-a="fiLargo" data-z="${z}" data-d="1" aria-label="Más largo zona ${z + 1}">${ic("plus")}</button><b class="num">${L}</b><button class="btn btn-s btn-ch btn-i" data-a="fiLargo" data-z="${z}" data-d="-1" aria-label="Más corto zona ${z + 1}">${ic("minus")}</button></div>`).join("")}</div></div>
      ${campo("Notas", `<input class="inp" id="fpNotas" value="${esc(p.notas || "")}" placeholder="Forma del ojo, efecto…">`)}
      <div class="fila"><span class="esp"></span><button class="btn btn-s" data-a="fiPest" data-v="0">Cancelar</button><button class="btn btn-p" data-a="fiPestGuardar">Guardar</button></div>`
    : `<div class="lista"><div class="row"><span class="row-t"><small>Técnica</small><b>${esc(p.tipo)}</b></span><span class="row-t"><small>Curva</small><b>${esc(p.curva)}</b></span><span class="row-t"><small>Grosor</small><b>${esc(p.grosor)}</b></span></div>
        ${p.notas ? `<div class="row"><span class="row-t"><small>Notas</small><b class="fi-wrap">${esc(p.notas)}</b></span></div>` : ""}
        <div class="row"><small class="tenue">${p.fecha ? "Actualizado " + esc(diaRel(p.fecha).toLowerCase()) : ""}</small><span class="esp"></span><button class="btn btn-s btn-ch" data-a="fiPest" data-v="1">${ic("pen")}Editar</button></div></div>`}
    </div></div>`;
}
A.fiPest = el => { const m = mt(), k = db.obtener("clientas", m.id); m.editPest = el.dataset.v === "1"; if (m.editPest) m.pd = JSON.parse(JSON.stringify(k.pestanas || PEST_DEF())); renderModal(); };
A.fiPestSet = el => { const m = mt(); m.pd[el.dataset.k] = el.dataset.v; renderModal(); };
A.fiLargo = el => { const m = mt(), z = +el.dataset.z; m.pd.largos[z] = clamp(m.pd.largos[z] + +el.dataset.d, 5, 16); renderModal(); };
A.fiPestGuardar = () => { const m = mt(), k = db.obtener("clientas", m.id); m.pd.notas = ($("#fpNotas") || {}).value || ""; m.pd.fecha = Date.now(); k.pestanas = m.pd; m.editPest = false; db.cambio(); toast("Mapa de pestañas guardado", "eye"); };

/* antes y después */
function ejemploPelo(despues) {
  const pelo = despues ? "url(#gDesp)" : "#6E6157";
  return `<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3122"/><stop offset=".45" stop-color="#8A5A34"/><stop offset="1" stop-color="#D9AE74"/></linearGradient></defs>
    <rect width="300" height="300" fill="${despues ? "#F3E7D8" : "#E7E2DC"}"/>
    <path d="M70 300 C52 200 62 70 150 58 C238 70 248 200 230 300Z" fill="${pelo}"/>
    <ellipse cx="150" cy="142" rx="50" ry="60" fill="#E9C9AC"/>
    <path d="M100 126 C104 74 196 70 202 128 C178 100 128 98 100 126Z" fill="${pelo}"/>
    <rect x="128" y="196" width="44" height="40" fill="#E9C9AC"/>
    ${despues ? `<path d="M92 120 C90 170 92 230 104 290" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M212 130 C214 180 210 240 200 292" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<g stroke="#8D8178" stroke-width="2" fill="none" opacity=".8"><path d="M64 200 q-10 -8 -2 -18 q-8 -10 2 -18"/><path d="M236 200 q10 -8 2 -18 q8 -10 -2 -18"/><path d="M70 250 q-12 -6 -4 -16"/><path d="M232 252 q12 -6 4 -16"/><path d="M120 66 q-6 -12 6 -16"/><path d="M180 64 q6 -12 -6 -16"/></g>`}
  </svg>`;
}
function comparador(antes, despues, id = "fiComp") {
  const capa = src => src ? `<img src="${src}" alt="">` : "";
  return `<div class="fi-comp" style="--p:50%">
    <div class="fi-ca">${antes ? capa(antes) : ejemploPelo(false)}<span class="fi-tag">Antes</span></div>
    <div class="fi-cb">${despues ? capa(despues) : ejemploPelo(true)}<span class="fi-tag fi-tag-r">Después</span></div>
    <span class="fi-linea" aria-hidden="true"><i>${ic("move")}</i></span>
    <input type="range" id="${id}" data-i="fiComp" min="0" max="100" value="50" aria-label="Deslizar para comparar antes y después"></div>`;
}
function fiFotos(k, m) {
  const l = (k.fotos || []).slice().sort((a, b) => b.fecha - a.fecha);
  const sel = l.find(f => f.id === m.fotoSel) || l[0];
  const d = m.fotoNueva || {};
  return `<div class="fi-fotos">
    <div class="pila">${sel ? comparador(sel.antes, sel.despues) : comparador(null, null)}
      <p class="tenue xs centro">${sel ? esc(sel.nota || "") + " · " + esc(fechaCorta(sel.fecha)) : "Ejemplo: así se verán sus fotos"}</p></div>
    <div class="pila">
      <div class="card pila"><b>Nueva comparación</b>
        <div class="g2 fi-sub">
          <label class="fi-up ${d.antes ? "lleno" : ""}">${d.antes ? `<img src="${d.antes}" alt="Foto antes">` : `${ic("camera")}<span>Antes</span>`}<input type="file" accept="image/*" data-i="fiFoto" data-solo="change" data-lado="antes" class="sr"></label>
          <label class="fi-up ${d.despues ? "lleno" : ""}">${d.despues ? `<img src="${d.despues}" alt="Foto después">` : `${ic("camera")}<span>Después</span>`}<input type="file" accept="image/*" data-i="fiFoto" data-solo="change" data-lado="despues" class="sr"></label>
        </div>
        <input class="inp" id="fiFotoNota" placeholder="Nota (ej. balayage miel)" autocomplete="off">
        <button class="btn btn-p" data-a="fiFotoGuardar" ${d.antes || d.despues ? "" : "disabled"}>Guardar</button></div>
      ${l.length ? `<div class="fi-galeria">${l.map(f => `<button class="fi-mini ${sel && f.id === sel.id ? "on" : ""}" data-a="fiFotoSel" data-id="${f.id}" aria-label="Ver comparación">${f.despues || f.antes ? `<img src="${f.despues || f.antes}" alt="">` : ""}</button>`).join("")}</div>` : ""}
    </div></div>`;
}
I.fiComp = el => el.closest(".fi-comp").style.setProperty("--p", el.value + "%");
I.fiFoto = el => {
  const f = el.files && el.files[0]; if (!f) return;
  const m = mt(), lado = el.dataset.lado, r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 600, s = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement("canvas");
      cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const url = cv.toDataURL("image/jpeg", .78);
      if (url.length > 350000) toast("La foto quedó pesada; en la demo se guarda en este navegador", "alert");
      m.fotoNueva = m.fotoNueva || {}; m.fotoNueva[lado] = url; renderModal();
    };
    img.onerror = () => toast("No pude leer esa imagen", "alert", "malo");
    img.src = r.result;
  };
  r.readAsDataURL(f);
};
A.fiFotoGuardar = () => {
  const m = mt(), k = db.obtener("clientas", m.id), d = m.fotoNueva; if (!d) return;
  k.fotos = k.fotos || []; const f = { id: uid(), fecha: Date.now(), antes: d.antes || null, despues: d.despues || null, nota: ($("#fiFotoNota") || {}).value || "" };
  k.fotos.push(f); m.fotoNueva = null; m.fotoSel = f.id;
  const peso = JSON.stringify(db.d).length; if (peso > 4200000) toast("El almacenamiento del navegador está casi lleno", "alert");
  db.cambio(); toast("Comparación guardada", "camera");
};
A.fiFotoSel = el => { mt().fotoSel = el.dataset.id; renderModal(); };

/* firmas */
function fiFirmas(k, m) {
  const l = (k.consentimientos || []).slice().sort((a, b) => b.fecha - a.fecha);
  if (m.firmando) {
    m.ctipo = m.ctipo || Object.keys(CONSENT)[0];
    return `<div class="pila fi-firmar">
      <div class="fila-w">${Object.keys(CONSENT).map(t => `<button class="rc-tog rc-tog-s ${m.ctipo === t ? "on" : ""}" data-a="fiCTipo" data-v="${esc(t)}"><b>${esc(t)}</b></button>`).join("")}</div>
      <div class="card card-suave fi-ctexto"><p>${esc(CONSENT[m.ctipo])}</p><small class="tenue">${esc(k.nombre)} · ${esc(fechaLarga(Date.now()))}</small></div>
      <div class="fi-firma-box"><canvas id="fiFirma" aria-label="Firma con el dedo"></canvas><span class="fi-firma-l">Firme aquí</span></div>
      <div class="fila"><button class="btn btn-t" data-a="fiFirmaBorrar">${ic("eraser")}Borrar</button><span class="esp"></span><button class="btn btn-s" data-a="fiFirmar" data-v="0">Cancelar</button><button class="btn btn-p" data-a="fiFirmaGuardar">Guardar firma</button></div></div>`;
  }
  return `<div class="fila mb"><p class="tx2">Consentimientos firmados.</p><span class="esp"></span><button class="btn btn-p btn-ch" data-a="fiFirmar" data-v="1">${ic("pen")}Nuevo consentimiento</button></div>
    ${l.length ? `<div class="lista">${l.map(c => `<div class="row">${c.firma ? `<img class="fi-firma-img" src="${c.firma}" alt="Firma">` : `<span class="fi-h-ic">${ic("file")}</span>`}<div class="row-t"><b>${esc(c.tipo)}</b><small>${esc(fechaCorta(c.fecha))} ${new Date(c.fecha).getFullYear()}${c.firma ? "" : " · firmado en papel"}</small></div>${chip(ic("check") + "Firmado", "ok")}</div>`).join("")}</div>` : vacio("Sin consentimientos firmados")}`;
}
A.fiFirmar = el => { const m = mt(); m.firmando = el.dataset.v === "1"; m.trazos = []; renderModal(); };
A.fiCTipo = el => { mt().ctipo = el.dataset.v; renderModal(); };
A.fiFirmaBorrar = () => { const m = mt(); m.trazos = []; renderModal(); };
A.fiFirmaGuardar = () => {
  const m = mt(), cv = $("#fiFirma"); if (!m.trazos || !m.trazos.length) return toast("Falta la firma", "alert", "malo");
  const k = db.obtener("clientas", m.id); k.consentimientos = k.consentimientos || [];
  k.consentimientos.push({ id: uid(), tipo: m.ctipo, fecha: Date.now(), firma: cv.toDataURL("image/png") });
  m.firmando = false; m.trazos = []; db.cambio(); toast("Consentimiento firmado", "pen");
};
MODAL_DESPUES.ficha = m => {
  if (m.sec !== "firmas" || !m.firmando) return;
  const cv = $("#fiFirma"); if (!cv) return;
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const g = cv.getContext("2d"); g.scale(dpr, dpr); g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = 2.4; g.strokeStyle = MARCA.colores.tinta;
  const dibujar = tr => { if (tr.length < 2) { const [x, y] = tr[0]; g.beginPath(); g.arc(x, y, 1.2, 0, Math.PI * 2); g.fillStyle = g.strokeStyle; g.fill(); return; } g.beginPath(); g.moveTo(tr[0][0], tr[0][1]); for (let i = 1; i < tr.length; i++) g.lineTo(tr[i][0], tr[i][1]); g.stroke(); };
  (m.trazos || []).forEach(dibujar);
  let actual = null;
  const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); actual = [pos(e)]; m.trazos.push(actual); cv.parentElement.classList.add("firmado"); dibujar(actual); };
  cv.onpointermove = e => { if (!actual) return; const p = pos(e), u = actual[actual.length - 1]; actual.push(p); g.beginPath(); g.moveTo(u[0], u[1]); g.lineTo(p[0], p[1]); g.stroke(); };
  cv.onpointerup = cv.onpointercancel = () => { actual = null; };
  if (m.trazos && m.trazos.length) cv.parentElement.classList.add("firmado");
};

A.fiCanjear = async el => {
  const k = cli(el.dataset.id);
  if (await confirmar({ titulo: "¿Canjear el premio?", texto: esc(k.nombre.split(" ")[0]) + " recibe " + esc(lealtad().premio.toLowerCase()) + ".", si: "Canjear" })) { canjearPremio(k); toast("Premio canjeado", "gift"); }
};
