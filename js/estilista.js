"use strict";
/* ============================================================
   Vista de la estilista (celular primero): su día, la clienta
   que sigue con su ficha y diseño, venta de productos y sus números.
   ============================================================ */
ROL_DE.estilista = "estilista"; CLASE_RUTA.estilista = "staff";

const misItems = (c, id) => c.items.filter(i => i.estilista_id === id);
VISTAS.estilista = () => {
  const yo = ui.tabs.yo && db.obtener("estilistas", ui.tabs.yo);
  if (!yo) return vElegirEstilista();
  const t = tab("esTab", "hoy");
  return `${barraStaff("estilista")}<main class="cont es">
    <div class="es-head rev">${avatar(yo, 52)}<div class="row-t"><p class="eyebrow">${esc(fechaLarga(Date.now()))}</p><h1 class="h2">Hola, ${esc(yo.nombre.split(" ")[0])}</h1></div>
      <button class="btn btn-t btn-ch" data-a="esCambiar">Cambiar</button></div>
    <div class="es-tabs rev" style="--i:1">${seg("esTab", [["hoy", "Mi día", "cal"], ["numeros", "Mis números", "chart"]], t)}</div>
    ${t === "numeros" ? vMisNumeros(yo) : vMiDia(yo)}
  </main>`;
};
DESPUES.estilista = (p, cambio) => { arrancarReloj(); if (cambio) contarArriba($("#app")); };

function vElegirEstilista() {
  return `${barraStaff("estilista")}<main class="cont es">
    <div class="rev"><p class="eyebrow">Equipo</p><h1 class="h2">¿Quién eres?</h1></div>
    <div class="es-yo">${db.listar("estilistas").map((e, i) => { const n = citasDia(Date.now(), c => c.items.some(x => x.estilista_id === e.id)).length; return `<button class="card click es-yo-b rev" style="--i:${i + 1}" data-a="esYo" data-id="${e.id}">
      ${avatar(e, 68)}<b>${esc(e.nombre)}</b><small class="tenue">${esc(e.rol)}</small>${chip(n + " cita" + (n === 1 ? "" : "s") + " hoy", n ? "listo" : "")}</button>`; }).join("")}</div></main>`;
}
A.esYo = el => { ui.tabs.yo = el.dataset.id; guardarUI(); render(); };
A.esCambiar = () => { delete ui.tabs.yo; guardarUI(); render(); };

function vMiDia(yo) {
  const ahora = Date.now();
  const mis = citasDia(ahora, c => c.items.some(i => i.estilista_id === yo.id));
  const actual = mis.find(c => c.estado === "en_servicio") || mis.find(c => c.estado === "llego") || mis.find(c => ["reservada", "confirmada"].includes(c.estado) && c.fin > ahora);
  const manana = citasDia(ahora + DIA, c => c.items.some(i => i.estilista_id === yo.id));
  const hechas = mis.filter(c => ["terminada", "pagada"].includes(c.estado)).length;
  return `${actual ? tarjetaAhora(actual, yo) : `<div class="card es-libre rev" style="--i:2">${vacio(mis.length ? "Terminaste tus citas de hoy" : "Hoy no tienes citas")}</div>`}
    <section class="es-tl-sec rev" style="--i:3">
      <div class="fila"><h2 class="rc-sub">Hoy</h2><span class="esp"></span><span class="tenue small">${hechas} de ${mis.length} listas</span></div>
      ${mis.length ? `<ol class="es-tl">${mis.map(c => { const k = cli(c.clienta_id), it = misItems(c, yo.id), st = ESTADOS[c.estado]; return `<li class="es-tl-i est-${c.estado} ${actual && c.id === actual.id ? "on" : ""}">
        <span class="es-tl-h num">${hora(it[0].ini)}</span><span class="es-tl-p" aria-hidden="true"></span>
        <button class="es-tl-c click" data-a="rcAbrirCita" data-id="${c.id}"><span class="row-t"><b>${esc(k.nombre)}</b><small>${esc(it.map(i => serv(i.servicio_id).nombre).join(" + "))} · ${durTxt((it[it.length - 1].fin - it[0].ini) / MIN)}</small></span>
          ${c.diseno ? miniDiseno(c.diseno, 40) : ""}${chip(st.t, st.c)}</button></li>`; }).join("")}</ol>` : ""}
    </section>
    ${manana.length ? `<p class="tenue small es-man rev" style="--i:4">${ic("cal")} Mañana: ${manana.length} cita${manana.length === 1 ? "" : "s"}, la primera a las ${hora(misItems(manana[0], yo.id)[0].ini)}</p>` : ""}`;
}

function tarjetaAhora(c, yo) {
  const k = cli(c.clienta_id), it = misItems(c, yo.id), ahora = Date.now();
  const sv = it.map(i => serv(i.servicio_id)), cats = sv.map(s => s.cat);
  const etiqueta = c.estado === "en_servicio" ? "Ahora" : c.estado === "llego" ? "Te espera · " + minTxt(c.t.llego || ahora) : "Sigue · " + hora(it[0].ini) + (it[0].ini > ahora ? " (en " + durTxt((it[0].ini - ahora) / MIN) + ")" : "");
  const pose = poseDe(c), formula = (k.color || []).slice().sort((a, b) => b.fecha - a.fecha)[0];
  const accion = c.estado === "en_servicio"
    ? `<button class="btn btn-a btn-g" data-a="rcTerminar" data-id="${c.id}">${ic("check")}Terminar</button>`
    : `<button class="btn btn-a btn-g" data-a="rcEmpezar" data-id="${c.id}">${ic("play")}Empezar</button>`;
  return `<article class="card card-osc es-now rev" style="--i:2">
    <div class="fila"><span class="chip ${c.estado === "en_servicio" ? "activo vivo" : c.estado === "llego" ? "aviso" : ""}">${c.estado === "en_servicio" || c.estado === "llego" ? '<span class="punto"></span>' : ""}${esc(etiqueta)}</span>
      ${pose ? chip(`<span class="punto"></span>En pose · ${Math.max(1, Math.round((pose.fin - ahora) / MIN))} min`, "activo vivo") : ""}<span class="esp"></span>${k.vip ? chip(ic("crown") + "VIP", "oro") : ""}</div>
    <h2 class="es-now-n">${esc(k.nombre)}</h2>
    <p class="es-now-s">${esc(sv.map(s => s.nombre).join(" + "))}</p>
    ${k.alergias ? `<div class="fi-alerta es-alerta">${ic("alert")}<div><b>Atención</b><span>${esc(k.alergias)}</span></div></div>` : ""}
    <div class="es-prefs">${k.bebida ? `<span>${ic("coffee")}${esc(k.bebida)}</span>` : ""}${k.notas ? `<span>${ic("heart")}${esc(k.notas)}</span>` : ""}${c.notas ? `<span>${ic("pen")}${esc(c.notas)}</span>` : ""}
      ${esCumpleMes(k.id) ? `<span>${ic("cake")}Cumple este mes</span>` : ""}</div>
    ${c.diseno && typeof manoSVG === "function" ? `<div class="es-dis"><div class="es-mano">${manoSVG(c.diseno, { tam: 260, pies: c.diseno.pies })}</div>
      ${typeof materiales === "function" ? `<div class="pila"><p class="eyebrow">Materiales</p><ul class="es-mat">${materiales(c.diseno).map(x => `<li><span>${esc(x.t)}</span><b>${esc(String(x.n))}</b></li>`).join("")}</ul>
      <a class="btn btn-s btn-ch" href="#/disenar/cita/${c.codigo}">${ic("palette")}Abrir en el estudio</a></div>` : ""}</div>` : ""}
    ${cats.includes("cabello") && formula ? `<div class="es-form"><span class="fi-sw" style="background:${esc(formula.hex)}"></span><div class="row-t"><small>Última fórmula · ${esc(fechaCorta(formula.fecha))}</small><b>${esc(formula.formula)}</b><small>${esc(formula.marca)} · ${esc(formula.oxidante || "")}${formula.tiempo ? " · " + formula.tiempo + " min" : ""}</small></div></div>` : ""}
    ${cats.includes("mirada") && k.pestanas && sv.some(s => s.pestanas) ? `<div class="es-ojo">${ojoSVG(k.pestanas)}<small>${esc(k.pestanas.tipo)} · curva ${esc(k.pestanas.curva)} · ${esc(k.pestanas.grosor)}</small></div>` : ""}
    <div class="es-acc">${accion}
      <div class="es-acc-s">
        <button class="btn btn-s btn-ch" data-a="rcFicha" data-id="${k.id}">${ic("user")}Ficha</button>
        ${cats.includes("cabello") ? `<button class="btn btn-s btn-ch" data-a="rcFicha" data-id="${k.id}" data-sec="color">${ic("drop")}Fórmula</button>` : ""}
        ${cats.includes("mirada") ? `<button class="btn btn-s btn-ch" data-a="rcFicha" data-id="${k.id}" data-sec="pestanas">${ic("eye")}Pestañas</button>` : ""}
        <button class="btn btn-s btn-ch" data-a="rcFicha" data-id="${k.id}" data-sec="fotos">${ic("camera")}Fotos</button>
        <button class="btn btn-s btn-ch" data-a="esVender" data-id="${c.id}">${ic("bag")}Vender${(c.productos || []).length ? " · " + sum(c.productos, p => p.cant) : ""}</button>
      </div></div>
  </article>`;
}

/* vender producto desde la silla */
A.esVender = el => abrir("esVender", { id: el.dataset.id });
MODALES.esVender = m => {
  const c = db.obtener("citas", m.id); if (!c) return cab("Vender");
  const k = cli(c.clienta_id), ya = c.productos || [];
  return `${cab("Vender producto", "Se suma a la cuenta de " + esc(k.nombre.split(" ")[0]))}<div class="modal-c pila">
    ${ya.length ? `<div class="lista">${ya.map((p, n) => { const pr = db.obtener("productos", p.producto_id) || {}; return `<div class="row">${ic("bag")}<div class="row-t"><b>${esc(pr.nombre)}</b><small>${p.cant} × ${Q(pr.precio)}</small></div><b class="num">${Q(pr.precio * p.cant)}</b><button class="btn btn-t btn-ch btn-i" data-a="esQuitar" data-n="${n}" aria-label="Quitar">${ic("x")}</button></div>`; }).join("")}</div>` : ""}
    <div class="es-prods">${db.listar("productos", p => p.tipo === "venta").map(p => `<button class="es-prod click" data-a="esAgregar" data-id="${p.id}">
      <span class="es-prod-ic">${ic("bag")}</span><span class="row-t"><b>${esc(p.nombre)}</b><small>${esc(p.marca)}</small></span>
      <span class="es-prod-p"><b class="num">${Q(p.precio)}</b>${p.stock <= 0 ? chip("Sin existencia", "malo") : p.stock <= p.minimo ? chip("Quedan " + p.stock, "aviso") : ""}</span></button>`).join("")}</div>
  </div><div class="modal-p"><button class="btn btn-p" data-a="cerrar">Listo</button></div>`;
};
A.esAgregar = el => {
  const m = mt(), c = db.obtener("citas", m.id), p = db.obtener("productos", el.dataset.id);
  if (c.estado === "pagada") return toast("Esa cuenta ya se cobró; véndelo en recepción", "alert");
  c.productos = c.productos || [];
  const yo = ui.tabs.yo || c.items[0].estilista_id, y = c.productos.find(x => x.producto_id === p.id);
  if (y) y.cant++; else c.productos.push({ producto_id: p.id, cant: 1, estilista_id: yo });
  if (p.stock <= 0) toast("Sin existencia registrada de " + p.nombre, "alert"); else toast(p.nombre + " a la cuenta", "bag");
  db.cambio();
};
A.esQuitar = el => { const c = db.obtener("citas", mt().id); c.productos.splice(+el.dataset.n, 1); db.cambio(); };

/* mis números */
function vMisNumeros(yo) {
  const hoy = comisiones(yo.id, dia0()), mes = comisiones(yo.id, inicioMes());
  const d = new Date(), q0 = d.getDate() <= 15 ? inicioMes() : +new Date(d.getFullYear(), d.getMonth(), 16), quin = comisiones(yo.id, q0);
  const pct = clamp(mes.servicios / yo.meta, 0, 1), finMes = +new Date(d.getFullYear(), d.getMonth() + 1, 1), diasRest = Math.max(0, Math.ceil((finMes - Date.now()) / DIA));
  const prom = mes.citas ? mes.servicios / mes.citas : 0, faltan = Math.max(0, yo.meta - mes.servicios);
  const dias = []; for (let i = 6; i >= 0; i--) { const d0 = dia0() - i * DIA; dias.push({ d0, v: comisiones(yo.id, d0, d0 + DIA).total }); }
  const max = Math.max(1, ...dias.map(x => x.v));
  return `<div class="es-kpis">
      <div class="card kpi rev" style="--i:2"><small>Mi comisión hoy</small><b data-cuenta="${hoy.com_serv + hoy.com_prod}" data-fmt="q">${Q(hoy.com_serv + hoy.com_prod)}</b></div>
      <div class="card kpi rev" style="--i:3"><small>Propinas hoy</small><b data-cuenta="${hoy.propinas}" data-fmt="q">${Q(hoy.propinas)}</b></div>
      <div class="card kpi rev" style="--i:4"><small>Clientas hoy</small><b data-cuenta="${hoy.citas}">${hoy.citas}</b></div>
    </div>
    <div class="card es-meta rev" style="--i:5">
      <div class="fila">${ic("target")}<b>Meta de ${MESES[d.getMonth()]}</b><span class="esp"></span><b class="num">${Math.round(pct * 100)}%</b></div>
      <div class="barra es-meta-b"><i style="width:${pct * 100}%"></i></div>
      <p class="small tenue">${Q(mes.servicios)} de ${Q(yo.meta)} en servicios${faltan ? ` · faltan ${Q(faltan)}${prom ? ` (≈ ${Math.ceil(faltan / prom)} servicios)` : ""} en ${diasRest} días` : " · ¡meta cumplida!"}</p>
    </div>
    <div class="g2">
      <div class="card rev" style="--i:6"><div class="card-t">${ic("chart")}<h3>Últimos 7 días</h3></div>
        <div class="es-barras">${dias.map(x => `<div class="es-bar"><span class="num">${x.v ? Q(x.v).replace(/\.\d+$/, "") : ""}</span><i style="height:${Math.max(3, x.v / max * 100)}%"></i><small>${DIAS_C[new Date(x.d0).getDay()]}</small></div>`).join("")}</div></div>
      <div class="lista rev" style="--i:7">
        <div class="row"><span class="row-t"><b>Servicios del mes</b><small>${Q(mes.servicios)} · ${yo.com_serv}%</small></span><b class="num">${Q(mes.com_serv)}</b></div>
        <div class="row"><span class="row-t"><b>Productos vendidos</b><small>${Q(mes.productos)} · ${yo.com_prod}%</small></span><b class="num">${Q(mes.com_prod)}</b></div>
        <div class="row"><span class="row-t"><b>Propinas</b><small>${mes.citas} clientas atendidas</small></span><b class="num">${Q(mes.propinas)}</b></div>
        <div class="row es-tot"><span class="row-t"><b>Llevas en el mes</b><small>Esta quincena: ${Q(quin.total)}</small></span><b class="num">${Q(mes.total)}</b></div>
      </div>
    </div>`;
}
