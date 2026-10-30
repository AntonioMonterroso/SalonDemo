"use strict";
/* ============================================================
   Lado de la clienta: página del salón, reservar, mi cita,
   pago simulado, tarjeta de regalo y encuesta.
   ============================================================ */

/* ---------- página principal #/ ---------- */
function topPublico() {
  return `<header class="top top-pub"><div class="top-in">${marcaBloque("#/")}<span class="esp"></span>
    <nav class="pub-nav" aria-label="Secciones"><a href="#servicios" data-a="irA" data-v="servicios">Servicios</a><a href="#disenos" data-a="irA" data-v="disenos">Diseños</a><a href="#equipo" data-a="irA" data-v="equipo">Equipo</a><a href="#regalos" data-a="irA" data-v="regalos">Regalos</a></nav>
    <a class="btn btn-p btn-ch" href="#/reservar">Reservar</a></div></header>`;
}
A.irA = el => { const t = document.getElementById(el.dataset.v); t && t.scrollIntoView({ behavior: reducido() ? "auto" : "smooth", block: "start" }); };
function estadoAbierto() {
  const h = horarioDia(Date.now()); if (!h) return `<span class="chip">${ic("clock")} Hoy cerramos</span>`;
  if (abiertoAhora()) return `<span class="chip ok vivo"><i class="punto"></i>Abierto · cierra ${horaMin(h[1])}</span>`;
  const m = (Date.now() - dia0()) / MIN, man = horarioDia(Date.now() + DIA);
  return m < h[0] ? `<span class="chip">${ic("clock")} Abrimos hoy ${horaMin(h[0])}</span>` : `<span class="chip">${ic("clock")} Cerrado · ${man ? "abrimos mañana " + horaMin(man[0]) : "nos vemos pronto"}</span>`;
}

VISTAS[""] = () => {
  const cat = tab("pubCat", "unas"), servs = db.listar("servicios", s => s.cat === cat && s.activo);
  const res = db.listar("resenas"), prom = res.length ? sum(res, r => r.estrellas) / res.length : 5;
  const h = cfg().horario, hoyD = new Date().getDay();
  return `${topPublico()}
  <main class="pub">
    <section class="hero">
      <div class="hero-tx">
        <div class="rev">${estadoAbierto()}</div>
        <p class="eyebrow rev" style="--i:1">${CATEGORIAS.map(c => esc(c.nombre)).join(" · ")}</p>
        <h1 class="h1 rev" style="--i:2">Tu hora favorita <em>de la semana.</em></h1>
        <p class="hero-sub rev" style="--i:3">Reserva en un minuto, diseña tus uñas antes de llegar y déjate consentir por manos que saben lo que hacen.</p>
        <div class="fila-w rev" style="--i:4"><a class="btn btn-p btn-g" href="#/reservar">Reservar cita${ic("arrow-r")}</a><a class="btn btn-s btn-g" href="#/disenar">${ic("wand")}Diseñar mis uñas</a></div>
        ${MARCA.ejemplo ? "" : `<div class="hero-prueba rev" style="--i:5"><span class="estrellas">${"★★★★★"}</span><span><b>${prom.toFixed(1)}</b> de ${res.length} reseñas</span></div>`}
      </div>
      <div class="hero-arte rev-f" style="--i:2">
        <div class="hero-sello">${logo(120, true)}</div>
        <div class="hero-mano card"><div id="heroMano" class="hero-mano-in">${manoSVG({ preset: LOOKBOOK[0].id }, { tam: 300 })}</div><div class="hero-mano-pie"><b id="heroNombre">${esc(LOOKBOOK[0].nombre)}</b><a href="#/disenar/preset/${LOOKBOOK[0].id}" id="heroLink" class="btn btn-t btn-ch">Lo quiero${ic("chev-r")}</a></div></div>
      </div>
    </section>

    <section class="seccion" id="servicios">
      <div class="sec-cab scroll-rev"><p class="eyebrow">La carta</p><h2 class="h2">Servicios</h2></div>
      <div class="scroll-rev">${seg("pubCat", CATEGORIAS.map(c => [c.id, c.nombre, c.icono]), cat, "tab", "seg-cat")}</div>
      <div class="carta scroll-rev">${servs.map(s => `<a class="carta-row" href="#/reservar" data-a="pubServ" data-v="${s.id}" data-prev>
          <div class="carta-n"><b>${esc(s.nombre)}</b>${s.desc ? `<small>${esc(s.desc)}</small>` : ""}</div><span class="carta-pts" aria-hidden="true"></span>
          <div class="carta-p"><b class="num">${s.desde ? "desde " : ""}${Q(s.precio)}</b><small>${durTxt(s.dur)}</small></div></a>`).join("")}</div>
    </section>

    ${(MARCA.trabajos || []).length ? `<section class="seccion" id="trabajos">
      <div class="sec-cab scroll-rev"><p class="eyebrow">Hecho aquí</p><h2 class="h2">Nuestros trabajos</h2></div>
      <div class="trabajos">${MARCA.trabajos.map((t, i) => `<figure class="trabajo scroll-rev" style="--i:${i % 4}"><img src="${t.src}" alt="${esc(t.alt)}" loading="lazy"><figcaption>${esc(t.alt)}</figcaption></figure>`).join("")}</div>
    </section>` : ""}

    <section class="seccion" id="disenos">
      <div class="sec-cab scroll-rev"><p class="eyebrow">Lookbook</p><h2 class="h2">Diseños de la casa</h2><p class="tx2">Toca uno, cámbiale lo que quieras y llévalo a tu cita.</p></div>
      <div class="look">${LOOKBOOK.map((l, i) => `<a class="look-it scroll-rev" style="--i:${i % 4}" href="#/disenar/preset/${l.id}">${manoSVG({ preset: l.id }, { tam: 180 })}<b>${esc(l.nombre)}</b><small>${esc(l.desc)}</small></a>`).join("")}</div>
      <div class="estudio-cta card-osc card scroll-rev">
        <div><p class="eyebrow" style="color:var(--acento)">Estudio de uñas</p><h3 class="h2">Diséñalas tú.<br>Nosotras las hacemos realidad.</h3><p class="tx2 mt">Forma, largo, color por uña, francés, aura, cristales. Ves el precio al momento y tu manicurista recibe el diseño exacto.</p>
        <a class="btn btn-a btn-g mt" href="#/disenar">Abrir el estudio${ic("arrow-r")}</a></div>
        <div class="estudio-cta-arte">${manoSVG({ preset: "noir-piedras" }, { tam: 260 })}</div>
      </div>
    </section>

    <section class="seccion" id="equipo">
      <div class="sec-cab scroll-rev"><p class="eyebrow">Las manos detrás</p><h2 class="h2">Nuestro equipo</h2></div>
      <div class="equipo">${db.listar("estilistas").map((e, i) => `<a class="persona scroll-rev" style="--i:${i % 3}" href="#/reservar" data-a="pubEst" data-v="${e.id}" data-prev>${avatar(e, 84)}<b>${esc(e.nombre)}</b><small>${esc(e.rol)}</small></a>`).join("")}</div>
    </section>

    <section class="seccion" id="regalos">
      <div class="sec-cab scroll-rev"><p class="eyebrow">Para consentir</p><h2 class="h2">Regalos, paquetes y clubes</h2></div>
      <div class="regalo-banda scroll-rev">
        <div class="regalo-arte">${tarjetaRegaloSVG({ diseno: "oro", monto: 500, para: "Para ti", de: MARCA.nombre, codigo: "GR-DEMO" })}</div>
        <div><h3 class="h3">Tarjeta de regalo</h3><p class="tx2">Llega por WhatsApp, se abre con un sobre y se canjea en cualquier servicio.</p><button class="btn btn-p mt" data-a="pubRegalo">${ic("gift")}Regalar</button></div>
      </div>
      <div class="g3 mt">${db.listar("membresias").map((m, i) => `<div class="card club scroll-rev" style="--i:${i};--c:${m.color}"><span class="chip oro">${ic("crown")} Club</span><h3 class="h3">${esc(m.nombre)}</h3><p class="tx2">${esc(m.desc)}</p><p class="club-p"><b class="num">${Q(m.precio)}</b><span class="tenue"> / mes</span></p></div>`).join("")}
        ${db.listar("paquetes").map((p, i) => `<div class="card club scroll-rev" style="--i:${i + 2}"><span class="chip">${ic("box")} Paquete</span><h3 class="h3">${esc(p.nombre)}</h3><p class="tx2">${esc(p.desc)}</p><p class="club-p"><b class="num">${Q(p.precio)}</b></p></div>`).join("")}</div>
    </section>

    <section class="seccion" id="puntos">
      <div class="puntos-banda scroll-rev">
        <div class="puntos-arte">${tarjetaPuntosHTML({ nombre: "Tu nombre", sellos: 5, puntos: 420, tarjeta: "T0DEMO" })}</div>
        <div><p class="eyebrow">Tarjeta de puntos</p><h2 class="h2">Cada visita suma.</h2>
          <p class="tx2 mt">Junta ${lealtad().sellos} sellos y te regalamos ${esc(lealtad().premio.toLowerCase())}. Además, cada quetzal te da puntos para tu siguiente servicio. Guárdala en tu Apple Wallet o Google Wallet.</p>
          <div class="fila-w mt"><button class="btn btn-p" data-a="pubMiTarjeta">${ic("star")}Ver mi tarjeta</button>${walletBotones(null)}</div></div>
      </div>
    </section>

    <section class="seccion">
      <div class="sec-cab scroll-rev"><p class="eyebrow">${MARCA.ejemplo ? "Así se verán las opiniones de tus clientas" : "Lo que dicen"}</p><h2 class="h2">${prom.toFixed(1)} <span class="estrellas grande">★★★★★</span></h2></div>
      <div class="resenas">${res.slice(0, 6).map((r, i) => `<figure class="resena scroll-rev" style="--i:${i % 3}"><span class="estrellas">${"★".repeat(r.estrellas)}</span><blockquote>${esc(r.texto)}</blockquote><figcaption>${esc(cli(r.clienta_id).nombre.split(" ")[0])} · ${diaRel(r.fecha).toLowerCase()}</figcaption></figure>`).join("")}</div>
    </section>

    <section class="seccion" id="visitanos">
      <div class="visita scroll-rev">
        <div><p class="eyebrow">Visítanos</p><h2 class="h2">${esc(MARCA.ciudad)}</h2><p class="tx2 mt">${esc(MARCA.direccion)}</p>
          <div class="fila-w mt"><a class="btn btn-s" href="${MARCA.mapa}" target="_blank" rel="noopener">${ic("pin")}Cómo llegar</a><a class="btn btn-s" href="${waLink(MARCA.whatsapp, "Hola, quiero información")}" target="_blank" rel="noopener">${ic("msg")}WhatsApp</a>${MARCA.telefono ? `<a class="btn btn-s" href="tel:+502${MARCA.telefono}">${ic("phone")}${telFmt(MARCA.telefono)}</a>` : ""}${MARCA.facebook ? `<a class="btn btn-s" href="${MARCA.facebook}" target="_blank" rel="noopener">${ic("users")}Facebook</a>` : ""}${MARCA.instagram ? `<a class="btn btn-s" href="https://instagram.com/${MARCA.instagram}" target="_blank" rel="noopener">${ic("insta")}@${esc(MARCA.instagram)}</a>` : ""}</div></div>
        <div class="horario">${[1, 2, 3, 4, 5, 6, 0].map(d => `<div class="${d === hoyD ? "hoy" : ""}"><span>${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)}</span><b>${h[d] ? horaMin(h[d][0]) + " – " + horaMin(h[d][1]) : "Cerrado"}</b></div>`).join("")}</div>
      </div>
    </section>
  </main>
  <footer class="pie"><div class="pie-in">${logo(44)}<div><b>${esc(MARCA.nombre)}</b><small class="tenue">${esc(MARCA.lema)}</small></div><span class="esp"></span>
    <a class="btn btn-t btn-ch" href="#/demo">${ic("lock")}Entrada del personal</a></div></footer>`;
};
DESPUES[""] = (p, cambio) => {
  if (cambio) observarScroll(); else $$(".scroll-rev").forEach(e => e.classList.add("visto"));
  if (cambio) {
    clearInterval(DESPUES._hero); let k = 0;
    if (!reducido()) DESPUES._hero = setInterval(() => {
      if (ruta().r !== "") { clearInterval(DESPUES._hero); return; }
      const box = $("#heroMano"); if (!box || document.hidden) return;
      k = (k + 1) % LOOKBOOK.length; const l = LOOKBOOK[k];
      box.classList.add("cambia");
      setTimeout(() => { if (!box.isConnected) return; box.innerHTML = manoSVG({ preset: l.id }, { tam: 300 }); $("#heroNombre").textContent = l.nombre; $("#heroLink").href = "#/disenar/preset/" + l.id; box.classList.remove("cambia"); }, 260);
    }, 3400);
  }
};
function observarScroll() {
  const els = $$(".scroll-rev:not(.visto)"); if (!els.length) return;
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("visto")); return; }
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("visto"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach(e => io.observe(e));
}
A.pubServ = el => { ui.borrador.reserva = { servs: [el.dataset.v], paso: 1, est: "" }; guardarUI(); location.hash = "#/reservar"; };
A.pubEst = el => { ui.borrador.reserva = { servs: [], paso: 1, est: el.dataset.v }; ui.tabs.resCat = est(el.dataset.v).cats[0]; guardarUI(); location.hash = "#/reservar"; };

/* tarjeta de regalo dibujada */
function tarjetaRegaloSVG(g) {
  const t = { rosa: ["#F4D3D7", "#E7A9B3", "#5C1A2B"], oro: ["#EBD9B4", "#C8A262", "#3B2A12"], noir: ["#2B2725", "#111", "#E8D3A6"] }[g.diseno || "oro"];
  const id = "gr" + (++svgN);
  return `<svg class="gift-svg" viewBox="0 0 340 214" role="img" aria-label="Tarjeta de regalo de ${Q(g.monto)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t[0]}"/><stop offset="1" stop-color="${t[1]}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <rect width="340" height="214" rx="20" fill="url(#${id})"/><rect class="brillo" x="-120" y="0" width="90" height="214" fill="url(#${id}b)" transform="skewX(-18)"/>
    <circle cx="300" cy="40" r="70" fill="none" stroke="${t[2]}" stroke-opacity=".18"/><circle cx="306" cy="36" r="62" fill="none" stroke="${t[2]}" stroke-opacity=".12"/>
    <text x="24" y="42" font-family="var(--f-titulo)" font-size="20" fill="${t[2]}">${esc(MARCA.nombre)}</text>
    <text x="24" y="64" font-family="var(--f-texto)" font-size="9" letter-spacing="2.5" fill="${t[2]}" opacity=".7">TARJETA DE REGALO</text>
    <text x="24" y="150" font-family="var(--f-titulo)" font-size="46" fill="${t[2]}">${Q(g.monto)}</text>
    <text x="24" y="186" font-family="var(--f-texto)" font-size="11" fill="${t[2]}" opacity=".8">${esc(g.para || "")}${g.de ? " · de " + esc(g.de) : ""}</text>
    <text x="316" y="186" text-anchor="end" font-family="var(--f-texto)" font-size="10" letter-spacing="1.5" fill="${t[2]}" opacity=".7">${esc(g.codigo || "")}</text></svg>`;
}
A.pubRegalo = () => abrir("comprarRegalo", { monto: 500, diseno: "oro" });
MODALES.comprarRegalo = m => `${cab("Regalar una tarjeta", "Se paga en línea y llega por WhatsApp")}
  <form class="modal-c pila" data-f="comprarRegalo" id="fRegalo">
    <div class="regalo-prev">${tarjetaRegaloSVG({ diseno: m.diseno, monto: m.monto, para: "Para ti", de: "" , codigo: "" })}</div>
    ${seg("rgDis", [["oro", "Oro"], ["rosa", "Rosa"], ["noir", "Noir"]], m.diseno, "rgDiseno")}
    <div class="fila-w">${[300, 500, 750, 1000].map(v => `<button type="button" class="btn ${m.monto === v ? "btn-p" : "btn-s"} btn-ch" data-a="rgMonto" data-v="${v}">${Q(v)}</button>`).join("")}</div>
    <div class="g2">${campo("Para", `<input class="inp" id="rgPara" name="para" required placeholder="Nombre de quien la recibe">`)}${campo("De", `<input class="inp" id="rgDe" name="de" required placeholder="Tu nombre">`)}</div>
    ${campo("Mensaje", `<textarea class="inp" id="rgMsj" name="mensaje" maxlength="140" placeholder="Unas palabras bonitas (opcional)"></textarea>`)}
    ${campo("WhatsApp de quien la recibe", `<input class="inp" id="rgTel" name="tel" inputmode="tel" placeholder="5555 5555">`)}
  </form>
  <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p" type="submit" form="fRegalo">Pagar ${Q(m.monto)}</button></div>`;
A.rgDiseno = el => { modalTop().diseno = el.dataset.v; renderModal(); };
A.rgMonto = el => { modalTop().monto = +el.dataset.v; renderModal(); };
F.comprarRegalo = (f, d) => {
  const m = modalTop();
  const g = { id: uid(), codigo: "GR-" + Math.random().toString(36).slice(2, 6).toUpperCase(), de: d.de.trim(), para: d.para.trim(), mensaje: d.mensaje.trim(), tel: d.tel, monto: m.monto, saldo: 0, diseno: m.diseno, creado: Date.now(), pendiente: true };
  db.d.tarjetas_regalo.push(g);
  const l = crearLink(m.monto, "Tarjeta de regalo para " + g.para, { tipo: "regalo", id: g.id });
  cerrarTodo(); location.hash = "#/pago/" + l.codigo;
};

/* ---------- reservar #/reservar ---------- */
function borradorRes() { return ui.borrador.reserva = ui.borrador.reserva || { servs: [], paso: 1, est: "" }; }
VISTAS.reservar = () => {
  const r = borradorRes(), paso = r.paso || 1;
  const titulos = ["¿Qué te hacemos?", "¿Cuándo te esperamos?", "Tus datos"];
  return `<header class="top"><div class="top-in"><a class="btn btn-t btn-i" href="${paso > 1 ? "#/reservar" : "#/"}" ${paso > 1 ? 'data-a="resAtras"' : ""} aria-label="Atrás">${ic("chev-l")}</a>
      <div class="est-tit"><b>Reservar</b><small>${esc(MARCA.nombre)}</small></div><span class="esp"></span>
      <div class="pasos" aria-label="Paso ${paso} de 3">${[1, 2, 3].map(i => `<i class="${i <= paso ? "on" : ""}"></i>`).join("")}</div></div></header>
    <main class="cont res">
      <h1 class="h2 rev">${titulos[paso - 1]}</h1>
      ${paso === 1 ? resPaso1(r) : paso === 2 ? resPaso2(r) : resPaso3(r)}
    </main>`;
};
CLASE_RUTA.reservar = "con-bandeja";
function resumenServs(r) { const t = sum(r.servs, s => serv(s).precio) + (r.servs.some(s => serv(s).diseno) && ui.borrador.diseno ? precioDiseno(ui.borrador.diseno) : 0); return { total: t, dur: sum(r.servs, s => serv(s).dur), desde: r.servs.some(s => serv(s).desde) }; }
function resPaso1(r) {
  const cat = tab("resCat", r.servs.length ? serv(r.servs[0]).cat : "unas");
  const lista = db.listar("servicios", s => s.cat === cat && s.activo && (!r.est || puede(est(r.est), s.id)));
  const conUnas = r.servs.some(s => serv(s).diseno), dis = ui.borrador.diseno, rs = resumenServs(r);
  return `<div class="rev" style="--i:1">${seg("resCat", CATEGORIAS.map(c => [c.id, c.nombre, c.icono]), cat, "tab", "seg-cat seg-b")}</div>
    ${r.est ? `<p class="tx2 mt rev" style="--i:1">Con ${esc(est(r.est).nombre)} · <a href="#/reservar" data-a="resSinEst" class="subr">ver todo</a></p>` : ""}
    <div class="lista mt rev" style="--i:2">${lista.map(s => { const on = r.servs.includes(s.id); return `<button class="row click res-serv ${on ? "on" : ""}" data-a="resToggle" data-v="${s.id}" aria-pressed="${on}">
        <div class="row-t"><b>${esc(s.nombre)}</b><small>${durTxt(s.dur)}${s.anticipo ? " · anticipo " + Q(s.anticipo) : ""}${s.pose ? " · incluye tiempo de pose" : ""}</small></div>
        <b class="num">${s.desde ? "desde " : ""}${Q(s.precio)}</b><span class="res-check">${ic(on ? "check" : "plus")}</span></button>`; }).join("") || vacio("Nadie del equipo hace esto con esa estilista.")}</div>
    ${conUnas ? `<div class="card dis-card mt rev" style="--i:3">${dis ? `${manoSVG(dis, { tam: 84 })}<div class="esp"><b>Tu diseño</b><p class="tenue small">Arte ${Q(precioDiseno(dis))} · ${materiales(dis)[0].t}</p></div><a class="btn btn-s btn-ch" href="#/disenar/reserva">Editar</a><button class="btn btn-t btn-i btn-ch" data-a="resQuitarDis" aria-label="Quitar diseño">${ic("x")}</button>`
      : `<span class="dis-ic">${ic("wand")}</span><div class="esp"><b>¿Ya sabes qué diseño quieres?</b><p class="tenue small">Diséñalo aquí y tu manicurista lo recibe tal cual.</p></div><a class="btn btn-s btn-ch" href="#/disenar/reserva">Diseñar</a>`}</div>` : ""}
    <div class="bandeja ${r.servs.length ? "on" : ""}"><div class="bandeja-in">
      <div class="esp"><b>${r.servs.length} ${r.servs.length === 1 ? "servicio" : "servicios"} · ${rs.desde ? "desde " : ""}${Q(rs.total)}</b><small class="tenue">${durTxt(rs.dur)}</small></div>
      <button class="btn btn-p" data-a="resPaso" data-v="2" ${r.servs.length ? "" : "disabled"}>Continuar${ic("arrow-r")}</button></div></div>`;
}
A.resToggle = el => { const r = borradorRes(), s = el.dataset.v; r.servs = r.servs.includes(s) ? r.servs.filter(x => x !== s) : r.servs.concat(s); guardarUI(); render(); };
A.resSinEst = () => { borradorRes().est = ""; guardarUI(); render(); };
A.resQuitarDis = () => { delete ui.borrador.diseno; guardarUI(); render(); };
A.resPaso = el => { const r = borradorRes(); r.paso = +el.dataset.v; guardarUI(); render(); window.scrollTo({ top: 0, behavior: reducido() ? "auto" : "smooth" }); };
A.resAtras = () => { const r = borradorRes(); r.paso = Math.max(1, (r.paso || 1) - 1); guardarUI(); render(); };
function resPaso2(r) {
  const posibles = db.listar("estilistas", e => r.servs.some(s => puede(e, s)));
  const d0 = r.dia || (() => { for (let k = 0; k < 14; k++) { const d = dia0() + k * DIA; if (horasLibres(d, r.servs, r.est).length) return d; } return dia0(); })();
  r.dia = d0;
  const sem = r.sem || 0, ini = dia0() + sem * 7 * DIA;
  const libres = horasLibres(d0, r.servs, r.est);
  const grupos = [["Mañana", 0, 12], ["Tarde", 12, 17], ["Noche", 17, 24]].map(([t, a, b]) => [t, libres.filter(x => { const hh = new Date(x.t).getHours(); return hh >= a && hh < b; })]).filter(g => g[1].length);
  return `<div class="rev" style="--i:1"><p class="eyebrow">Con quién</p><div class="quien">
      <button class="quien-b ${!r.est ? "on" : ""}" data-a="resEst" data-v=""><span class="av av-cualq">${ic("sparkles")}</span><span>Quien esté libre</span></button>
      ${posibles.map(e => `<button class="quien-b ${r.est === e.id ? "on" : ""}" data-a="resEst" data-v="${e.id}">${avatar(e, 44)}<span>${esc(e.nombre.split(" ")[0])}</span></button>`).join("")}</div></div>
    <div class="rev" style="--i:2"><div class="fila mt"><p class="eyebrow esp" style="margin:0">${MESES[new Date(ini).getMonth()][0].toUpperCase() + MESES[new Date(ini).getMonth()].slice(1)}</p>
      <button class="btn btn-t btn-i btn-ch" data-a="resSem" data-v="-1" ${sem <= 0 ? "disabled" : ""} aria-label="Semana anterior">${ic("chev-l")}</button><button class="btn btn-t btn-i btn-ch" data-a="resSem" data-v="1" ${sem >= 3 ? "disabled" : ""} aria-label="Semana siguiente">${ic("chev-r")}</button></div>
      <div class="dias">${[0, 1, 2, 3, 4, 5, 6].map(k => { const d = ini + k * DIA, n = horasLibres(d, r.servs, r.est).length; return `<button class="dia ${d === d0 ? "on" : ""}" data-a="resDia" data-v="${d}" ${n ? "" : "disabled"}><small>${DIAS_C[new Date(d).getDay()]}</small><b>${new Date(d).getDate()}</b><i class="${n ? (n < 5 ? "pocos" : "si") : ""}"></i></button>`; }).join("")}</div></div>
    <div class="horas rev" style="--i:3">${grupos.length ? grupos.map(([t, l]) => `<p class="eyebrow mt">${t}</p><div class="horas-g">${l.map(x => `<button class="hora-b" data-a="resHora" data-v="${x.t}">${hora(x.t).replace(" a. m.", "").replace(" p. m.", "")}<small>${hora(x.t).includes("a. m.") ? "a. m." : "p. m."}</small></button>`).join("")}</div>`).join("") : vacio(`No hay espacio el ${fechaLarga(d0)}. Prueba otro día${r.est ? " o con otra estilista" : ""}.`)}</div>`;
}
A.resEst = el => { const r = borradorRes(); r.est = el.dataset.v; delete r.dia; guardarUI(); render(); };
A.resSem = el => { const r = borradorRes(); r.sem = clamp((r.sem || 0) + +el.dataset.v, 0, 3); r.dia = dia0() + r.sem * 7 * DIA; let k = 0; while (k < 7 && !horasLibres(r.dia, r.servs, r.est).length) { r.dia += DIA; k++; } guardarUI(); render(); };
A.resDia = el => { borradorRes().dia = +el.dataset.v; guardarUI(); render(); };
A.resHora = el => { const r = borradorRes(); r.t = +el.dataset.v; r.paso = 3; guardarUI(); render(); window.scrollTo(0, 0); };
function resPaso3(r) {
  const items = r.t ? planificar(r.servs, r.t, r.est) : null;
  if (!items) return `${vacio("Esa hora se acaba de ocupar. Escoge otra.", `<button class="btn btn-p" data-a="resPaso" data-v="2">Ver horarios</button>`)}`;
  const rs = resumenServs(r), anticipo = sum(r.servs, s => serv(s).anticipo), dis = r.servs.some(s => serv(s).diseno) ? ui.borrador.diseno : null;
  const datos = ui.borrador.datos || {};
  return `<div class="card res-resumen rev" style="--i:1">
      <div class="fila"><div class="res-fecha"><small>${DIAS_C[new Date(r.t).getDay()]}</small><b>${new Date(r.t).getDate()}</b><small>${MESES_C[new Date(r.t).getMonth()]}</small></div>
      <div class="esp"><b class="h3">${hora(r.t)}</b><p class="tenue small">${durTxt(rs.dur)} · termina ${hora(items[items.length - 1].fin)}</p></div>${dis ? manoSVG(dis, { tam: 64 }) : ""}</div>
      <div class="lista-s mt">${items.map(i => `<div class="fila"><span class="esp">${esc(serv(i.servicio_id).nombre)}</span><span class="tenue small">${esc(est(i.estilista_id).nombre.split(" ")[0])}</span><b class="num">${Q(i.precio)}</b></div>`).join("")}
        ${dis ? `<div class="fila"><span class="esp">Arte de uñas</span><b class="num">${Q(precioDiseno(dis))}</b></div>` : ""}</div>
      <div class="fila total-l"><span class="esp">Total ${rs.desde ? "aproximado" : ""}</span><b class="num">${Q(rs.total)}</b></div>
      ${anticipo ? `<div class="aviso-anticipo">${ic("lock")}<span>Para apartar este espacio pagas un anticipo de <b>${Q(anticipo)}</b>. Se descuenta del total.</span></div>` : ""}</div>
    <form class="pila mt rev" style="--i:2" data-f="reservar" id="fRes">
      ${campo("Tu nombre", `<input class="inp" id="resNom" name="nombre" required autocomplete="name" value="${esc(datos.nombre || "")}">`)}
      ${campo("WhatsApp", `<input class="inp" id="resTel" name="tel" required inputmode="tel" autocomplete="tel" placeholder="5555 5555" value="${esc(datos.tel || "")}">`, "Ahí te llega tu pase y el recordatorio")}
      ${campo("¿Algo que debamos saber?", `<textarea class="inp" id="resNota" name="notas" placeholder="Alergias, una foto de referencia, si vienes con prisa…"></textarea>`)}
      <button class="btn btn-p btn-g btn-b">${anticipo ? `Pagar ${Q(anticipo)} y reservar` : "Confirmar reserva"}</button>
      <p class="tenue xs centro">Puedes cambiar o cancelar hasta ${cfg().horas_cancelar} horas antes.</p>
    </form>`;
}
F.reservar = (f, d) => {
  const r = borradorRes();
  if (String(d.tel).replace(/\D/g, "").length < 8) { toast("Revisa tu número de WhatsApp", "alert", "malo"); $("#resTel").focus(); return; }
  const items = planificar(r.servs, r.t, r.est); if (!items) { toast("Esa hora se ocupó. Escoge otra.", "alert", "malo"); r.paso = 2; render(); return; }
  const k = clientaPorTel(d.nombre, d.tel), anticipo = sum(r.servs, s => serv(s).anticipo);
  const dis = r.servs.some(s => serv(s).diseno) && ui.borrador.diseno ? Object.assign({}, ui.borrador.diseno, { precio: precioDiseno(ui.borrador.diseno) }) : null;
  const c = crearCita({ clienta_id: k.id, items, origen: "en_linea", estado: "reservada", diseno: dis, notas: d.notas, anticipo: anticipo ? { monto: anticipo, pagado: false } : null });
  ui.borrador = { datos: { nombre: d.nombre, tel: d.tel } }; ui.recienCreada = c.codigo; guardarUI();
  if (anticipo) { const l = crearLink(anticipo, "Anticipo · " + nombresServ(c), { tipo: "cita", id: c.id }); c.anticipo.link = l.codigo; db.cambio(); location.hash = "#/pago/" + l.codigo; }
  else location.hash = "#/mi-cita/" + c.codigo;
};

/* ---------- mi cita #/mi-cita/COD ---------- */
VISTAS["mi-cita"] = p => {
  const c = citaPorCodigo(p[0] || "");
  if (!c) return `${topPublico()}<main class="cont" style="max-width:520px">${vacio("No encontramos esa cita.", `<a class="btn btn-p" href="#/reservar">Reservar</a>`)}</main>`;
  const k = cli(c.clienta_id), st = ESTADOS[c.estado], nueva = ui.recienCreada === c.codigo;
  const futura = c.ini > Date.now() && ["reservada", "confirmada"].includes(c.estado);
  const dis = c.diseno, anticipoPend = c.anticipo && !c.anticipo.pagado;
  return `<header class="top"><div class="top-in"><a class="btn btn-t btn-i" href="#/" aria-label="Inicio">${ic("chev-l")}</a><div class="est-tit"><b>Mi cita</b><small>${esc(MARCA.nombre)}</small></div><span class="esp"></span></div></header>
  <main class="cont micita">
    ${nueva ? `<div class="listo-anim rev"><span class="listo-ic">${ic("check")}</span><h1 class="h2">¡Listo, ${esc(k.nombre.split(" ")[0])}!</h1><p class="tx2">${c.estado === "confirmada" ? "Tu cita está confirmada." : "Te esperamos. Guarda este pase."}</p></div>` : ""}
    <article class="pase rev" style="--i:1">
      <div class="pase-cab">${logo(36)}<div class="esp"><b>${esc(MARCA.nombre)}</b><small>Pase de cita</small></div>${chip(st.t, st.c)}</div>
      <div class="pase-fecha"><div><small>${diaRel(c.ini)}</small><b class="serif">${hora(c.ini)}</b><span>${cap(fechaLarga(c.ini))}</span></div>${dis ? `<a href="#/disenar/cita/${c.codigo}" class="pase-dis" aria-label="Ver diseño">${manoSVG(dis, { tam: 92 })}</a>` : ""}</div>
      <div class="pase-cuerpo">${c.items.map(i => `<div class="fila"><span class="esp"><b>${esc(serv(i.servicio_id).nombre)}</b><small class="tenue">con ${esc(est(i.estilista_id).nombre.split(" ")[0])} · ${durTxt((i.fin - i.ini) / MIN)}</small></span><span class="num">${Q(i.precio + (i.arte || 0))}</span></div>`).join("")}
        ${c.anticipo ? `<div class="fila"><span class="esp tenue">Anticipo</span>${c.anticipo.pagado ? chip("Pagado " + Q(c.anticipo.monto), "ok") : chip("Pendiente " + Q(c.anticipo.monto), "aviso")}</div>` : ""}</div>
      <div class="pase-corte" aria-hidden="true"></div>
      <div class="pase-qr"><div class="qr" data-qr="${esc(c.codigo)}"></div><div><small class="tenue">Muéstralo al llegar</small><b class="codigo">${c.codigo}</b></div></div>
    </article>
    <div class="pila mt rev" style="--i:2">
      ${anticipoPend ? `<button class="btn btn-p btn-g btn-b" data-a="mcAnticipo" data-v="${c.codigo}">${ic("lock")}Pagar anticipo de ${Q(c.anticipo.monto)}</button>` : ""}
      ${c.estado === "reservada" && futura && !anticipoPend ? `<button class="btn btn-p btn-g btn-b" data-a="mcConfirmar" data-v="${c.codigo}">${ic("check")}Confirmo que voy</button>` : ""}
      <a class="mc-tarjeta" href="${linkTarjeta(k).replace(urlBase(), "")}">${ic("star")}<span class="esp"><b>Mi tarjeta de puntos</b><small>${k.sellos || 0} de ${lealtad().sellos} sellos · ${k.puntos || 0} puntos</small></span>${ic("chev-r")}</a>
      ${c.estado === "pagada" ? `<a class="btn btn-p btn-g btn-b" href="#/encuesta/${c.codigo}">${ic("star")}Califica tu visita</a><a class="btn btn-s btn-b" href="#/reservar">Agendar otra cita</a>` : ""}
      ${futura ? `<div class="acciones">
        <button class="accion" data-a="mcCalendario" data-v="${c.codigo}">${ic("cal")}<span>Calendario</span></button>
        <a class="accion" href="${MARCA.mapa}" target="_blank" rel="noopener">${ic("pin")}<span>Cómo llegar</span></a>
        ${c.items.some(i => serv(i.servicio_id).diseno) ? `<a class="accion" href="#/disenar/cita/${c.codigo}">${ic("wand")}<span>${dis ? "Mi diseño" : "Diseñar uñas"}</span></a>` : `<a class="accion" href="${waLink(MARCA.whatsapp, "Hola, tengo la cita " + c.codigo)}" target="_blank" rel="noopener">${ic("msg")}<span>Escribir</span></a>`}
        <button class="accion" data-a="mcMover" data-v="${c.codigo}">${ic("clock")}<span>Cambiar hora</span></button>
      </div><button class="btn btn-t btn-b" data-a="mcCancelar" data-v="${c.codigo}">Cancelar cita</button>` : ""}
    </div>
  </main>`;
};
DESPUES["mi-cita"] = (p, cambio) => { if (cambio && ui.recienCreada) setTimeout(() => { ui.recienCreada = null; }, 4000); };
const dentroLimite = c => c.ini - Date.now() < cfg().horas_cancelar * HORA;
A.mcConfirmar = el => { const c = citaPorCodigo(el.dataset.v); c.estado = "confirmada"; c.confirmo = true; db.cambio(); toast("¡Gracias! Te esperamos"); };
A.mcAnticipo = el => { const c = citaPorCodigo(el.dataset.v); let l = c.anticipo.link && db.listar("links_pago").find(x => x.codigo === c.anticipo.link); if (!l || l.estado !== "pendiente") { l = crearLink(c.anticipo.monto, "Anticipo · " + nombresServ(c), { tipo: "cita", id: c.id }); c.anticipo.link = l.codigo; db.cambio(); } location.hash = "#/pago/" + l.codigo; };
A.mcCancelar = async el => {
  const c = citaPorCodigo(el.dataset.v);
  if (dentroLimite(c)) { abrir("mcLimite", { c: c.codigo, que: "cancelar" }); return; }
  const ok = await confirmar({ titulo: "¿Cancelar tu cita?", texto: `${nombresServ(c)} · ${fechaLarga(c.ini)} a las ${hora(c.ini)}.${c.anticipo && c.anticipo.pagado ? " Tu anticipo queda como saldo a favor." : ""}`, si: "Sí, cancelar", no: "No", peligro: true });
  if (ok) { cancelarCita(c); toast("Cita cancelada"); }
};
MODALES.mcLimite = m => `${cab("Escríbenos", "")}<div class="modal-c"><p class="tx2">Faltan menos de ${cfg().horas_cancelar} horas para tu cita. Para ${m.que === "mover" ? "cambiarla" : "cancelarla"} escríbenos y lo vemos contigo.</p></div>
  <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cerrar</button><a class="btn btn-p" target="_blank" rel="noopener" href="${waLink(MARCA.whatsapp, "Hola, necesito " + (m.que === "mover" ? "cambiar" : "cancelar") + " mi cita " + m.c)}">${ic("msg")}WhatsApp</a></div>`;
A.mcMover = el => { const c = citaPorCodigo(el.dataset.v); if (dentroLimite(c)) { abrir("mcLimite", { c: c.codigo, que: "mover" }); return; } abrir("mcMover", { c: c.codigo, dia: dia0(c.ini) }); };
MODALES.mcMover = m => {
  const c = citaPorCodigo(m.c), servs = c.items.map(i => i.servicio_id), estPref = c.items.length === 1 ? c.items[0].estilista_id : "";
  const libres = horasLibres(m.dia, servs, estPref, c.id);
  return `${cab("Cambiar hora", nombresServ(c))}<div class="modal-c">
    <div class="dias">${[0, 1, 2, 3, 4, 5, 6].map(k => { const d = dia0() + k * DIA; return `<button class="dia ${d === m.dia ? "on" : ""}" data-a="mcDia" data-v="${d}" ${horarioDia(d) ? "" : "disabled"}><small>${DIAS_C[new Date(d).getDay()]}</small><b>${new Date(d).getDate()}</b></button>`; }).join("")}</div>
    <div class="horas-g mt">${libres.map(x => `<button class="hora-b" data-a="mcHora" data-v="${x.t}">${hora(x.t)}</button>`).join("") || `<p class="tenue">Sin espacios ese día con ${esc(est(estPref).nombre.split(" ")[0] || "el equipo")}.</p>`}</div></div>`;
};
A.mcDia = el => { modalTop().dia = +el.dataset.v; renderModal(); };
A.mcHora = el => {
  const m = modalTop(), c = citaPorCodigo(m.c), estPref = c.items.length === 1 ? c.items[0].estilista_id : "";
  const items = planificar(c.items.map(i => i.servicio_id), +el.dataset.v, estPref, c.id); if (!items) { toast("Esa hora ya no está libre", "alert", "malo"); return; }
  items.forEach((it, i) => { if (c.items[i] && c.items[i].arte) it.arte = c.items[i].arte; });
  moverCita(c, items); cerrar(); toast("Listo: " + diaRel(c.ini).toLowerCase() + " a las " + hora(c.ini));
};
A.mcCalendario = el => {
  const c = citaPorCodigo(el.dataset.v), f = t => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//" + MARCA.nombre + "//ES", "BEGIN:VEVENT", "UID:" + c.codigo + "@salon", "DTSTAMP:" + f(Date.now()), "DTSTART:" + f(c.ini), "DTEND:" + f(c.fin), "SUMMARY:" + nombresServ(c) + " · " + MARCA.nombre, "LOCATION:" + MARCA.direccion.replace(/,/g, "\\,"), "DESCRIPTION:Tu pase: " + linkCita(c), "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Cita en " + MARCA.nombre, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  descargar("cita-" + c.codigo + ".ics", ics, "text/calendar;charset=utf-8");
};

/* ---------- pago simulado #/pago/COD ---------- */
VISTAS.pago = p => {
  const l = db.listar("links_pago").find(x => x.codigo === p[0]);
  if (!l) return `<main class="cont" style="max-width:460px">${vacio("Este link de pago no existe.")}</main>`;
  const pagado = l.estado === "pagado", proc = ui.procesando === l.codigo;
  const refCita = typeof l.ref === "string" ? db.obtener("citas", l.ref) : l.ref && l.ref.tipo === "cita" ? db.obtener("citas", l.ref.id) : null;
  const volver = refCita ? refCita.codigo : null;
  const regalo = l.ref && l.ref.tipo === "regalo" ? db.obtener("tarjetas_regalo", l.ref.id) : null;
  return `<main class="pago">
    <div class="pago-card card rev">
      <div class="fila">${logo(40)}<div class="esp"><b>${esc(MARCA.nombre)}</b><small class="tenue">Pago seguro</small></div>${chip(ic("lock") + "Demo", "")}</div>
      <p class="tenue mt">${esc(l.concepto)}</p><p class="pago-monto serif num">${Q(l.monto)}</p>
      ${pagado ? `<div class="pago-ok"><span class="listo-ic">${ic("check")}</span><b>Pago aprobado</b><small class="tenue">${fechaLarga(l.pagado)} · ${hora(l.pagado)}</small></div>
        ${volver ? `<a class="btn btn-p btn-g btn-b mt" href="#/mi-cita/${volver}">Ver mi cita</a>` : ""}${regalo ? `<a class="btn btn-p btn-g btn-b mt" href="#/regalo/${regalo.codigo}">Ver la tarjeta</a>` : ""}`
      : proc ? `<div class="pago-proc"><span class="spinner"></span><span>Procesando…</span></div>`
      : `<div class="tarjeta-demo"><span>${ic("card")}</span><div class="esp"><b>•••• 4242</b><small class="tenue">Tarjeta de prueba · no se cobra nada</small></div></div>
        <button class="btn btn-p btn-g btn-b mt" data-a="pagoAprobar" data-v="${l.codigo}">Pagar ${Q(l.monto)}</button>
        <button class="btn btn-t btn-b" data-a="pagoRechazar" data-v="${l.codigo}">Simular rechazo</button>`}
      ${l.estado === "rechazado" && !proc ? `<p class="chip malo mt">El banco rechazó el pago de prueba. Puedes intentar otra vez.</p>` : ""}
    </div>
    <p class="tenue xs centro mt">Página de demostración: en producción se conecta con la pasarela del salón.</p>
  </main>`;
};
CLASE_RUTA.pago = "pago-body";
A.pagoAprobar = el => {
  ui.procesando = el.dataset.v; render();
  setTimeout(() => {
    ui.procesando = null; const l = db.listar("links_pago").find(x => x.codigo === el.dataset.v); if (!l) return;
    l.estado = "pagado"; l.pagado = Date.now();
    const c = typeof l.ref === "string" ? db.obtener("citas", l.ref) : l.ref && l.ref.tipo === "cita" ? db.obtener("citas", l.ref.id) : null;
    if (c && c.anticipo && !c.anticipo.pagado) { c.anticipo.pagado = true; if (c.estado === "reservada") { c.estado = "confirmada"; c.confirmo = true; } }
    else if (c) l.listo = true;
    if (l.ref && l.ref.tipo === "regalo") { const g = db.obtener("tarjetas_regalo", l.ref.id); if (g) { g.saldo = g.monto; g.pendiente = false; } }
    if (l.ref && l.ref.tipo === "cobro") l.listo = true;
    db.cambio(); toast("Pago aprobado");
  }, reducido() ? 300 : 1500);
};
A.pagoRechazar = el => { const l = db.listar("links_pago").find(x => x.codigo === el.dataset.v); l.estado = "rechazado"; db.cambio(); };

/* ---------- tarjeta de regalo #/regalo/COD ---------- */
VISTAS.regalo = p => {
  const g = db.listar("tarjetas_regalo").find(x => x.codigo === String(p[0] || "").toUpperCase());
  if (!g) return `<main class="cont" style="max-width:460px">${vacio("No encontramos esta tarjeta.")}</main>`;
  const abierta = ui.regaloAbierto === g.codigo;
  return `<main class="regalo-pag ${abierta ? "abierta" : ""}">
    <div class="sobre rev">
      <div class="sobre-carta">${tarjetaRegaloSVG(g)}</div>
      <div class="sobre-cuerpo" aria-hidden="true"></div><div class="sobre-tapa" aria-hidden="true"></div>
      ${abierta ? "" : `<button class="btn btn-p btn-g sobre-btn" data-a="regaloAbrir" data-v="${g.codigo}">${ic("gift")}Abrir</button>`}
    </div>
    <div class="regalo-tx ${abierta ? "" : "oculto"}">
      <p class="eyebrow">Para ${esc(g.para)}</p>
      ${g.mensaje ? `<p class="regalo-msj serif">“${esc(g.mensaje)}”</p>` : ""}<p class="tenue">— ${esc(g.de)}</p>
      <div class="card mt regalo-saldo"><div class="esp"><small class="tenue">Saldo disponible</small><b class="serif num">${Q(g.saldo)}</b>${g.pendiente ? chip("Pago pendiente", "aviso") : ""}</div><div class="qr qr-s" data-qr="${esc(g.codigo)}"></div></div>
      <a class="btn btn-p btn-g btn-b mt" href="#/reservar">Reservar con mi regalo${ic("arrow-r")}</a>
      <p class="tenue xs centro mt">Código ${g.codigo} · se canjea en recepción</p>
    </div></main>`;
};
CLASE_RUTA.regalo = "regalo-body";
A.regaloAbrir = el => { ui.regaloAbierto = el.dataset.v; render(); };

/* ---------- encuesta #/encuesta/COD ---------- */
VISTAS.encuesta = p => {
  const c = citaPorCodigo(p[0] || ""); if (!c) return `<main class="cont">${vacio("No encontramos la cita.")}</main>`;
  const hecha = db.listar("resenas").find(r => r.cita_id === c.id), n = ui.estrellas || 0;
  return `<main class="cont encuesta">
    <div class="card card-l centro rev">${logo(56)}
      ${hecha ? `<h1 class="h2 mt">¡Gracias!</h1><p class="tx2 mt">Nos ayuda muchísimo.</p>${hecha.estrellas === 5 ? `<a class="btn btn-p btn-g mt" href="${MARCA.resena}" target="_blank" rel="noopener">${ic("star")}Dejar reseña en Google</a>` : ""}<a class="btn btn-t mt" href="#/">Volver</a>`
      : `<h1 class="h2 mt">¿Cómo te fue?</h1><p class="tx2">${esc(nombresServ(c))} con ${esc(estilistasDe(c).map(e => e.nombre.split(" ")[0]).join(" y "))}</p>
      <div class="estrellas-in" role="radiogroup" aria-label="Calificación">${[1, 2, 3, 4, 5].map(i => `<button role="radio" aria-checked="${n === i}" class="${i <= n ? "on" : ""}" data-a="encEstrella" data-v="${i}" aria-label="${i} estrellas">${ic("star")}</button>`).join("")}</div>
      <form data-f="encuesta" data-c="${c.codigo}" class="pila mt" id="fEnc"><textarea class="inp" id="encTx" name="texto" placeholder="Cuéntanos (opcional)"></textarea><button class="btn btn-p btn-g" ${n ? "" : "disabled"}>Enviar</button></form>`}
    </div></main>`;
};
A.encEstrella = el => { ui.estrellas = +el.dataset.v; render(); };
F.encuesta = (f, d) => { const c = citaPorCodigo(f.dataset.c); db.insertar("resenas", { cita_id: c.id, clienta_id: c.clienta_id, estrellas: ui.estrellas || 5, texto: d.texto.trim() || "Excelente servicio.", fecha: Date.now() }); ui.estrellas = 0; };

/* ---------- arranque ---------- */
function arrancar() {
  db.cargar();
  if (!location.hash) location.replace("#/");
  render();
  setInterval(() => { if (document.hidden) return; const r = ruta().r; if (["recepcion", "estilista", "admin", "demo"].includes(r)) pedirRender(false); }, 30000);
}

/* ============================================================
   Tarjeta de puntos (portal web + Apple Wallet / Google Wallet simulados)
   ============================================================ */
function tarjetaPuntosHTML(k, o = {}) {
  /* como un pase de Apple Wallet: logo y puntos arriba, franja de sellos, datos y (en Wallet) el QR */
  const L = lealtad(), n = Math.min(k.sellos || 0, L.sellos), ini = esc(MARCA.inicial || (MARCA.corto || MARCA.nombre).charAt(0));
  const giro = [-8, 5, -3, 7, -6, 4, -2, 6];
  const sello = i => {
    const on = i < n, premio = i === L.sellos - 1;
    return `<i class="${on ? "on" : ""} ${premio ? "premio" : ""}" style="--i:${i};--r:${giro[i % 8]}deg">${premio ? ic("gift") : on ? `<span>${ini}</span>` : ""}</i>`;
  };
  const campo = (t, v, cls = "") => `<div class="${cls}"><small>${t}</small><b>${v}</b></div>`;
  return `<div class="tpuntos ${o.grande ? "grande" : ""} ${o.qr ? "con-qr" : ""}">
    <div class="tp-cab">${logo(o.grande ? 38 : 34)}<b class="esp">${esc(MARCA.nombre)}</b><div class="tp-pts"><small>Puntos</small><b class="num">${(k.puntos || 0).toLocaleString("en-US")}</b></div></div>
    <div class="tp-banda"><div class="tp-sellos" style="--n:${L.sellos}">${Array.from({ length: L.sellos }, (_, i) => sello(i)).join("")}</div></div>
    <div class="tp-campos">${campo("Clienta", esc(k.nombre))}${campo("Sellos", `${n} de ${L.sellos}`)}${o.qr ? campo("Nivel", nivelDe(k).n, "derecha") : campo("Código", esc(k.tarjeta || ""), "derecha num")}</div>
    ${o.qr ? `<div class="tp-qr-w"><div class="qr" data-qr="${esc(k.tarjeta)}"></div><small>${esc(k.tarjeta)}</small></div>` : ""}
  </div>`;
}
function walletBotones(k) {
  const w = (k && k.wallet) || {};
  const b = (t, txt) => w[t] ? `<span class="wallet-b listo">${ic("check")}En tu ${txt}</span>` : `<button class="wallet-b ${t}" data-a="walletAbrir" data-v="${t}" data-k="${k ? k.tarjeta : ""}">${ic("card")}<span>Agregar a <b>${txt}</b></span></button>`;
  return `<span class="wallets">${b("apple", "Apple Wallet")}${b("google", "Google Wallet")}</span>`;
}
A.pubMiTarjeta = () => abrir("buscarTarjeta", {});
A.walletAbrir = el => { if (!el.dataset.k) { abrir("buscarTarjeta", { wallet: el.dataset.v }); return; } abrir("wallet", { w: el.dataset.v, cod: el.dataset.k }); };
MODALES.buscarTarjeta = m => `${cab("Mi tarjeta de puntos", "Con el número de WhatsApp que usas para reservar")}
  <form class="modal-c pila" data-f="buscarTarjeta" id="fBT">
    ${campo("WhatsApp", `<input class="inp" id="btTel" name="tel" inputmode="tel" required placeholder="5555 5555" autofocus>`)}
    ${campo("Tu nombre", `<input class="inp" id="btNom" name="nombre" placeholder="Solo si es tu primera vez">`)}
  </form>
  <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p" type="submit" form="fBT">Ver mi tarjeta</button></div>`;
F.buscarTarjeta = (f, d) => {
  const tel = String(d.tel).replace(/\D/g, "").replace(/^502/, "");
  if (tel.length < 8) { toast("Revisa el número", "alert", "malo"); return; }
  let k = db.listar("clientas").find(x => x.tel === tel);
  if (!k) { if (!String(d.nombre || "").trim()) { toast("Escribe tu nombre para crearla", "alert"); $("#btNom").focus(); return; } k = clientaPorTel(d.nombre, tel); toast("¡Bienvenida! Tu tarjeta está lista", "star"); }
  if (!k.tarjeta) k.tarjeta = codigoTarjeta();
  k.sellos = k.sellos || 0; k.wallet = k.wallet || {};
  db.cambio(); const w = modalTop().wallet; cerrarTodo(); location.hash = "#/tarjeta/" + k.tarjeta;
  if (w) setTimeout(() => abrir("wallet", { w, cod: k.tarjeta }), 400);
};

VISTAS.tarjeta = p => {
  const k = clientaPorTarjeta(p[0] || "");
  if (!k) return `${topPublico()}<main class="cont" style="max-width:520px">${vacio("No encontramos esa tarjeta.", `<button class="btn btn-p" data-a="pubMiTarjeta">Buscar con mi número</button>`)}</main>`;
  const L = lealtad(), faltan = L.sellos - (k.sellos || 0), niv = nivelDe(k);
  const visitas = citasDe(k.id).filter(c => c.estado === "pagada").slice(0, 5);
  return `<header class="top"><div class="top-in"><a class="btn btn-t btn-i" href="#/" aria-label="Inicio">${ic("chev-l")}</a><div class="est-tit"><b>Mi tarjeta</b><small>${esc(MARCA.nombre)}</small></div><span class="esp"></span><a class="btn btn-p btn-ch" href="#/reservar">Reservar</a></div></header>
  <main class="cont tarjeta-pag">
    <div class="rev"><p class="eyebrow">Hola, ${esc(k.nombre.split(" ")[0])}</p><div class="fila"><h1 class="h2 esp">Tu tarjeta</h1><span class="chip" style="background:${niv.c};color:#fff">${ic("crown")}${niv.n}</span></div></div>
    <div class="rev" style="--i:1">${tarjetaPuntosHTML(k, { grande: true })}</div>
    <div class="rev centro" style="--i:2">${walletBotones(k)}</div>
    ${k.premios ? `<div class="card tp-premio rev" style="--i:3"><span class="listo-ic">${ic("gift")}</span><div><b>Tienes ${k.premios === 1 ? "un premio listo" : k.premios + " premios listos"}</b><p class="tenue small">${esc(L.premio)}. Muéstrale tu código a recepción.</p></div></div>` : ""}
    <div class="g2 rev" style="--i:3">
      <div class="card"><p class="eyebrow">Tu próximo premio</p><p class="h3">${faltan === 1 ? "¡Te falta un sello!" : "Te faltan " + faltan + " sellos"}</p><p class="tenue small mt">${esc(L.premio)}</p><div class="barra mt"><i style="width:${(k.sellos || 0) / L.sellos * 100}%"></i></div></div>
      <div class="card"><p class="eyebrow">Tus puntos</p><p class="h3 num">${(k.puntos || 0).toLocaleString("en-US")} = ${Q((k.puntos || 0) * cfg().valor_punto)}</p><p class="tenue small mt">Ganas 1 punto por cada ${Q(cfg().puntos_cada)}. Úsalos en cualquier servicio.</p></div>
    </div>
    <div class="card centro tp-qr rev" style="--i:4"><div class="qr" data-qr="${esc(k.tarjeta)}"></div><div><b class="codigo">${esc(k.tarjeta)}</b><p class="tenue small">Recepción lo escanea al cobrar y te suma el sello</p></div></div>
    ${visitas.length ? `<div class="rev" style="--i:5"><p class="eyebrow mt">Tus últimas visitas</p><div class="lista">${visitas.map(c => `<div class="row"><span class="row-t"><b>${esc(nombresServ(c))}</b><small>${cap(fechaLarga(c.ini))}</small></span>${chip(ic("check") + "1 sello", "listo")}</div>`).join("")}</div></div>` : ""}
    <p class="tenue xs centro mt">También puedes guardar esta página en tu pantalla de inicio: Compartir → Agregar a inicio.</p>
  </main>`;
};
CLASE_RUTA.tarjeta = "tarjeta-body";

MODALES.wallet = m => {
  const k = clientaPorTarjeta(m.cod); if (!k) return cab("Wallet");
  const L = lealtad(), ap = m.w === "apple", faltan = L.sellos - (k.sellos || 0);
  const pase = ap
    ? tarjetaPuntosHTML(k, { qr: true })
    : `<div class="wpass google"><div class="wp-top">${logo(34)}<b class="esp">${esc(MARCA.nombre)}</b></div>
        <p class="wp-g-n">${esc(k.nombre)}</p><div class="wp-campos"><div><small>Puntos</small><b class="num">${k.puntos || 0}</b></div><div><small>Sellos</small><b>${k.sellos || 0} de ${L.sellos}</b></div></div>
        <div class="wp-qr"><div class="qr" data-qr="${esc(k.tarjeta)}"></div><small>${esc(k.tarjeta)}</small></div></div>`;
  if (m.listo) return `${cab(ap ? "Apple Wallet" : "Google Wallet", "Vista previa de la demo")}<div class="modal-c wallet-ok">
      <span class="listo-ic">${ic("check")}</span><h3 class="h3">Lista en tu ${ap ? "Apple" : "Google"} Wallet</h3>
      <p class="tenue small">Así le llega el aviso cuando sume un sello:</p>
      <div class="noti"><span class="noti-ic">${logo(30)}</span><div class="esp"><div class="fila"><b>${esc(MARCA.nombre)}</b><span class="esp"></span><small class="tenue">ahora</small></div><p>${faltan <= 1 ? "¡Ya casi! Un sello más y " + esc(L.premio.toLowerCase()) + " es tuyo." : "Sumaste un sello. " + (faltan - 1 === 1 ? "Te falta uno" : "Te faltan " + (faltan - 1)) + " para " + esc(L.premio.toLowerCase()) + "."}</p></div></div></div>
    <div class="modal-p"><button class="btn btn-p" data-a="cerrar">Listo</button></div>`;
  return `${cab(ap ? "Agregar a Apple Wallet" : "Guardar en Google Wallet", "Vista previa de la demo")}<div class="modal-c">${pase}</div>
    <div class="modal-p"><button class="btn btn-s" data-a="cerrar">Cancelar</button><button class="btn btn-p" data-a="walletAgregar">${ap ? "Agregar" : "Guardar"}</button></div>`;
};
A.walletAgregar = () => { const m = modalTop(), k = clientaPorTarjeta(m.cod); if (!k) return; k.wallet = k.wallet || {}; k.wallet[m.w] = true; m.listo = true; db.cambio(); };
