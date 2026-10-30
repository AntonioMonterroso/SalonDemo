"use strict";
/* ============================================================
   Datos locales (localStorage) con la forma de las tablas que
   tendría Supabase, datos de ejemplo y reglas del negocio.
   ============================================================ */
const CLAVE = MARCA.clave + ".datos";
const VERSION = 5;

const CATEGORIAS = (MARCA.datos && MARCA.datos.categorias) || [
  { id: "unas", nombre: "Uñas", sub: "Manos y pies", icono: "hand", retoque: 21 },
  { id: "cabello", nombre: "Cabello", sub: "Corte, color y tratamientos", icono: "scissors", retoque: 42 },
  { id: "mirada", nombre: "Mirada", sub: "Pestañas, cejas y maquillaje", icono: "eye", retoque: 18 },
  { id: "spa", nombre: "Spa", sub: "Faciales, depilación y masajes", icono: "leaf", retoque: 30 }
];
const TIPOS_ESTACION = { silla: "Silla", lavacabezas: "Lavacabezas", unas: "Mesa de uñas", pedicure: "Sillón de pedicure", cabina: "Cabina" };
const ESTADOS = {
  reservada: { t: "Por confirmar", c: "neutro" }, confirmada: { t: "Confirmada", c: "ok" }, llego: { t: "En espera", c: "aviso" },
  en_servicio: { t: "En servicio", c: "activo" }, terminada: { t: "Por cobrar", c: "cobro" }, pagada: { t: "Pagada", c: "listo" },
  cancelada: { t: "Cancelada", c: "apagado" }, falta: { t: "No vino", c: "malo" }
};
const METODOS = { efectivo: ["Efectivo", "cash"], tarjeta: ["Tarjeta", "card"], transferencia: ["Transferencia", "bank"], link: ["Link de pago", "link"], regalo: ["Tarjeta de regalo", "gift"], paquete: ["Paquete", "box"], membresia: ["Membresía", "crown"], anticipo: ["Anticipo", "check"] };

function semilla() {
  const D = MARCA.datos || {};
  const rnd = azar(20261029), pick = a => a[Math.floor(rnd() * a.length)];
  const ahora = Date.now(), hoy = dia0(ahora);
  const redondo = t => Math.round(t / (5 * MIN)) * 5 * MIN;

  const config = {
    horario: { 0: [9 * 60, 15 * 60], 1: [8 * 60, 19 * 60], 2: [8 * 60, 19 * 60], 3: [8 * 60, 19 * 60], 4: [8 * 60, 19 * 60], 5: [8 * 60, 20 * 60], 6: [8 * 60, 18 * 60] },
    horas_cancelar: 4, puntos_cada: 10, valor_punto: 0.5, intervalo: 30,
    pins: { recepcion: "1111", estilista: "2222", admin: "0000" },
    banco: "Banco Industrial · Monetaria 000-123456-7 · a nombre de " + MARCA.nombre,
    msj_confirmacion: "Hola {nombre}, tu cita en {salon} quedó para el {fecha} a las {hora}. Tu pase: {link}",
    msj_recordatorio: "Hola {nombre}, te esperamos mañana a las {hora} en {salon}. ¿Nos confirmas? {link}",
    msj_cumple: "¡Feliz cumpleaños, {nombre}! Este mes tienes 15% en cualquier servicio de {salon}.",
    msj_retoque: "Hola {nombre}, ya toca tu retoque de {categoria}. ¿Te apartamos un espacio? {reservar}",
    msj_extranamos: "Hola {nombre}, te extrañamos en {salon}. Esta semana tienes 10% en tu próximo servicio. {reservar}",
    promo_cumple: 15,
    lealtad: { sellos: 8, premio: "Un manicure en gel de regalo", wallet: true }
  };

  if (D.horario) config.horario = D.horario;
  if (D.lealtad) Object.assign(config.lealtad, D.lealtad);
  const estilistas = D.estilistas || [
    { id: "e1", nombre: "Andrea Solís", rol: "Colorista senior", cats: ["cabello"], color: "#C9A27E", com_serv: 40, com_prod: 10, meta: 32000, dias: [1, 2, 3, 4, 5, 6], entra: 8 * 60, sale: 18 * 60 },
    { id: "e2", nombre: "Daniela Ruiz", rol: "Estilista y maquillaje", cats: ["cabello", "mirada"], color: "#B9A3C8", com_serv: 35, com_prod: 10, meta: 26000, dias: [0, 2, 3, 4, 5, 6], entra: 9 * 60, sale: 19 * 60 },
    { id: "e3", nombre: "Mónica Pérez", rol: "Nail artist", cats: ["unas"], color: "#D7A6AE", com_serv: 40, com_prod: 10, meta: 24000, dias: [1, 2, 3, 4, 5, 6], entra: 8 * 60, sale: 18 * 60 },
    { id: "e4", nombre: "Karla Méndez", rol: "Manicure y pedicure", cats: ["unas"], color: "#E3BE8F", com_serv: 35, com_prod: 10, meta: 20000, dias: [0, 1, 2, 3, 4, 5], entra: 9 * 60, sale: 19 * 60 },
    { id: "e5", nombre: "Sofía Herrera", rol: "Lash & brow artist", cats: ["mirada"], color: "#9FB7C9", com_serv: 40, com_prod: 10, meta: 22000, dias: [1, 2, 3, 4, 5, 6], entra: 8 * 60, sale: 17 * 60 },
    { id: "e6", nombre: "Valeria Castillo", rol: "Cosmetóloga y masajista", cats: ["spa", "mirada"], color: "#A9BFA4", com_serv: 38, com_prod: 12, meta: 24000, dias: [0, 1, 2, 3, 4, 5, 6], entra: 9 * 60, sale: 19 * 60 }
  ];

  const estaciones = D.estaciones || [
    { id: "x1", nombre: "Silla 1", tipo: "silla" }, { id: "x2", nombre: "Silla 2", tipo: "silla" }, { id: "x3", nombre: "Silla 3", tipo: "silla" },
    { id: "x4", nombre: "Lavacabezas", tipo: "lavacabezas" },
    { id: "x5", nombre: "Mesa de uñas 1", tipo: "unas" }, { id: "x6", nombre: "Mesa de uñas 2", tipo: "unas" },
    { id: "x7", nombre: "Pedicure 1", tipo: "pedicure" }, { id: "x8", nombre: "Pedicure 2", tipo: "pedicure" },
    { id: "x9", nombre: "Cabina 1", tipo: "cabina" }, { id: "x10", nombre: "Cabina 2", tipo: "cabina" }
  ];

  const S = (id, cat, nombre, precio, dur, est, o = {}) => Object.assign({ id, cat, nombre, precio, dur, est, desde: false, pose: null, anticipo: 0, activo: true, desc: "", consumo: [] }, o);
  const servicios = D.servicios ? D.servicios.map(o => S(o.id, o.cat, o.nombre, o.precio, o.dur, o.est, Object.assign({}, o, { consumo: o.consumo || [] }))) : [
    S("s01", "unas", "Manicure clásico", 90, 40, "unas", { desc: "Limado, cutícula, masaje y esmalte tradicional.", consumo: [["u1", 1]] }),
    S("s02", "unas", "Manicure en gel", 150, 60, "unas", { desc: "Brillo de espejo que dura tres semanas.", consumo: [["u2", 1], ["u3", 1]], diseno: true }),
    S("s03", "unas", "Uñas acrílicas", 275, 105, "unas", { desc: "Set completo con la forma y el largo que quieras.", consumo: [["u4", 1]], diseno: true }),
    S("s04", "unas", "Polygel", 250, 90, "unas", { desc: "Ligero y resistente, sin olor.", diseno: true }),
    S("s05", "unas", "Retoque de acrílico", 180, 75, "unas", { diseno: true }),
    S("s06", "unas", "Pedicure spa", 160, 60, "pedicure", { desc: "Exfoliación, mascarilla y masaje de piernas." }),
    S("s07", "unas", "Pedicure en gel", 200, 75, "pedicure", { diseno: true, pies: true }),
    S("s08", "unas", "Retiro de gel o acrílico", 50, 20, "unas"),
    S("s10", "cabello", "Corte y secado", 175, 60, "silla", { desc: "Diagnóstico, lavado, corte y blower." }),
    S("s11", "cabello", "Lavado y blower", 120, 45, "silla"),
    S("s12", "cabello", "Tinte de raíz", 350, 105, "silla", { desde: true, pose: { ini: 30, min: 35 }, consumo: [["u6", 1], ["u7", 1]] }),
    S("s13", "cabello", "Color completo", 550, 150, "silla", { desde: true, pose: { ini: 40, min: 40 }, consumo: [["u6", 2], ["u7", 1]] }),
    S("s14", "cabello", "Balayage", 1200, 210, "silla", { desde: true, pose: { ini: 75, min: 45 }, anticipo: 300, desc: "Iluminación a mano alzada, natural y luminosa." }),
    S("s15", "cabello", "Keratina", 900, 180, "silla", { desde: true, pose: { ini: 60, min: 30 }, anticipo: 250, consumo: [["u10", 1]] }),
    S("s16", "cabello", "Tratamiento hidratante", 250, 45, "silla", { pose: { ini: 15, min: 15 } }),
    S("s17", "cabello", "Peinado de evento", 300, 60, "silla"),
    S("s20", "mirada", "Pestañas clásicas", 450, 120, "cabina", { anticipo: 100, consumo: [["u8", 1], ["u9", 1]], pestanas: true }),
    S("s21", "mirada", "Volumen ruso", 600, 150, "cabina", { anticipo: 150, pestanas: true }),
    S("s22", "mirada", "Lifting de pestañas", 275, 60, "cabina"),
    S("s23", "mirada", "Diseño de cejas con hilo", 90, 30, "cabina"),
    S("s24", "mirada", "Laminado de cejas", 250, 50, "cabina"),
    S("s25", "mirada", "Maquillaje social", 450, 60, "silla"),
    S("s26", "mirada", "Maquillaje de novia", 1500, 120, "silla", { anticipo: 500, desc: "Incluye prueba previa." }),
    S("s30", "spa", "Facial de limpieza profunda", 375, 75, "cabina"),
    S("s31", "spa", "Facial glow", 550, 60, "cabina", { desc: "Hidratación intensa y luminosidad inmediata." }),
    S("s32", "spa", "Depilación de cejas con cera", 60, 15, "cabina", { consumo: [["u5", 1]] }),
    S("s33", "spa", "Depilación de piernas", 300, 50, "cabina", { consumo: [["u5", 3]] }),
    S("s34", "spa", "Depilación de bikini", 200, 30, "cabina", { consumo: [["u5", 2]] }),
    S("s35", "spa", "Masaje relajante", 400, 60, "cabina"),
    S("s36", "spa", "Masaje con piedras calientes", 500, 75, "cabina")
  ];
  servicios.forEach(s => s.consumo = s.consumo.map(([p, c]) => ({ producto_id: p, cant: c })));

  const productos = (D.productos || [
    ["p1", "Shampoo reparador 300 ml", "Kérastase", 285, 150, 12, 4], ["p2", "Acondicionador nutritivo", "Kérastase", 295, 155, 9, 4],
    ["p3", "Mascarilla de keratina", "Olaplex", 340, 190, 6, 3], ["p4", "Protector térmico", "Moroccanoil", 260, 140, 7, 3],
    ["p5", "Aceite de argán", "Moroccanoil", 320, 170, 2, 3], ["p6", "Aceite de cutícula", "CND", 95, 40, 18, 6],
    ["p7", "Crema de manos", "L'Occitane", 180, 90, 10, 4], ["p8", "Sérum de pestañas", "RevitaLash", 650, 380, 4, 2],
    ["p9", "Sérum de vitamina C", "The Ordinary", 220, 110, 8, 3], ["p10", "Protector solar facial", "La Roche-Posay", 240, 130, 11, 4],
    ["p11", "Kit de limas y pulidor", "Casa", 75, 25, 20, 6], ["p12", "Esmalte para casa", "OPI", 120, 60, 3, 6]
  ]).map(([id, nombre, marca, precio, costo, stock, minimo]) => ({ id, nombre, marca, tipo: "venta", precio, costo, stock, minimo, unidad: "u" }));
  [
    ["u1", "Esmalte tradicional (uso)", 15, 4, "servicios"], ["u2", "Gel base", 8, 3, "servicios"], ["u3", "Top coat", 6, 3, "servicios"],
    ["u4", "Polvo acrílico", 5, 2, "servicios"], ["u5", "Cera tibia", 9, 4, "servicios"], ["u6", "Tinte profesional", 22, 10, "tubos"],
    ["u7", "Oxidante 20 vol", 7, 3, "litros"], ["u8", "Pestañas C 0.07", 6, 3, "bandejas"], ["u9", "Pegamento de pestañas", 2, 2, "frascos"],
    ["u10", "Keratina profesional", 3, 2, "litros"]
  ].forEach(([id, nombre, stock, minimo, unidad]) => productos.push({ id, nombre, marca: "", tipo: "uso", precio: 0, costo: 0, stock, minimo, unidad }));

  const esmaltes = [
    ["Porcelana", "#F3E9E2"], ["Nude rosado", "#E8C3B9"], ["Champán", "#D8C3A5"], ["Arena", "#CDB08E"], ["Malva", "#B68896"],
    ["Rosa ballet", "#F2C6CF"], ["Rosa chicle", "#EE8FB1"], ["Coral", "#EE7B66"], ["Rojo clásico", "#B3132C"], ["Cereza", "#7E1424"],
    ["Vino", "#5C1A2B"], ["Terracota", "#B5583C"], ["Caramelo", "#A86A3D"], ["Chocolate", "#4E3027"], ["Lila", "#C9B6E4"],
    ["Lavanda", "#A08CC8"], ["Azul cielo", "#A9C9E8"], ["Azul marino", "#1F2A4D"], ["Salvia", "#9CAF95"], ["Esmeralda", "#1F5E4B"],
    ["Negro", "#141414"], ["Blanco", "#FBFBF9"], ["Oro", "#C9A24A"], ["Plata", "#C0C3C8"]
  ].map(([nombre, hex], i) => ({ id: "c" + (i + 1), nombre, hex, codigo: "ML-" + String(101 + i), stock: nombre === "Cereza" ? 0 : nombre === "Lavanda" ? 1 : 2 + (i % 4) }));

  /* clientas */
  const NOM = ["María José", "Ana Lucía", "Gabriela", "Fernanda", "Andrea", "Lucía", "Paola", "Alejandra", "Isabel", "Valeria", "Camila", "Mariana", "Sofía", "Daniela", "Jimena", "Ximena", "Rocío", "Carmen", "Patricia", "Claudia", "Sandra", "Lorena", "Beatriz", "Natalia", "Regina", "Renata", "Melissa", "Karen", "Estefanía", "Pamela"];
  const APE = ["López", "García", "Castillo", "Morales", "Herrera", "Rodas", "Cifuentes", "Barrios", "Mejía", "Ordóñez", "Aguilar", "Juárez", "Samayoa", "Monzón", "Arriola", "Figueroa", "Sandoval", "Estrada", "Paiz", "Recinos"];
  const ORIGEN = ["Instagram", "Recomendación", "Google", "Pasaba por aquí", "Facebook", "TikTok"];
  const BEBIDA = ["Café americano", "Capuchino", "Té verde", "Agua mineral", "Té de manzanilla", "Prosecco", "Agua pura"];
  const clientas = [];
  for (let i = 0; i < 60; i++) {
    const n = NOM[i % NOM.length], a = APE[Math.floor(rnd() * APE.length)];
    const mes = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
    clientas.push({
      id: "k" + (i + 1), nombre: n + " " + a, tel: "5" + String(Math.floor(1000000 + rnd() * 8999999)),
      cumple: String(mes).padStart(2, "0") + "-" + String(d).padStart(2, "0"), origen: pick(ORIGEN), bebida: pick(BEBIDA),
      alergias: rnd() < .12 ? pick(["Alergia al látex", "Piel sensible a la cera", "Alergia a la PPD (tintes)", "Embarazo: sin químicos fuertes"]) : "",
      notas: rnd() < .25 ? pick(["Prefiere música suave.", "Le gusta platicar poco.", "Llega 10 minutos antes.", "Siempre pide la misma estación junto a la ventana."]) : "",
      vip: rnd() < .15, puntos: Math.floor(rnd() * 400), creado: ahora - Math.floor(30 + rnd() * 600) * DIA,
      membresia: null, color: [], pestanas: null, fotos: [], consentimientos: [], faltas: 0
    });
  }
  // cumpleañeras de este mes para que se vean en la demo
  const mesHoy = new Date(ahora).getMonth() + 1, diaHoy = new Date(ahora).getDate();
  clientas[3].cumple = String(mesHoy).padStart(2, "0") + "-" + String(diaHoy).padStart(2, "0");
  clientas[8].cumple = String(mesHoy).padStart(2, "0") + "-" + String(Math.min(28, diaHoy + 3)).padStart(2, "0");
  clientas[0].alergias = "Alergia al látex"; clientas[0].vip = true;

  // fichas de color y pestañas de ejemplo
  clientas[1].color.push({ id: uid(), fecha: ahora - 40 * DIA, marca: "Wella Koleston", formula: "7/1 + 8/81 (1:1)", oxidante: "20 vol · 1:1.5", tiempo: 35, resultado: "Rubio ceniza frío, cubrió canas al 100 %", hex: "#A08A6E" });
  clientas[1].color.push({ id: uid(), fecha: ahora - 85 * DIA, marca: "Wella Koleston", formula: "7/1 (60 g)", oxidante: "20 vol · 1:1.5", tiempo: 35, resultado: "Bien, un poco cálido en puntas", hex: "#9C845F" });
  clientas[5].color.push({ id: uid(), fecha: ahora - 30 * DIA, marca: "L'Oréal Majirel", formula: "5.35 + 6.34", oxidante: "20 vol · 1:1", tiempo: 30, resultado: "Chocolate dorado", hex: "#5E3B26" });
  clientas[2].pestanas = { curva: "C", grosor: "0.07", tipo: "Clásicas", largos: [8, 9, 10, 11, 12, 11, 10], fecha: ahora - 16 * DIA, notas: "Ojo almendrado, efecto gatita suave." };
  clientas[0].consentimientos.push({ id: uid(), tipo: "Pestañas", fecha: ahora - 60 * DIA, firma: "" });
  const membresias = D.membresias || [
    { id: "m1", nombre: "Club Uñas", precio: 275, incluye: [{ servicio_id: "s02", cant: 2 }], descuento: 10, color: "#D7A6AE", desc: "2 manicures en gel al mes y 10 % en productos." },
    { id: "m2", nombre: "Club Glow", precio: 650, incluye: [{ servicio_id: "s31", cant: 1 }, { servicio_id: "s35", cant: 1 }], descuento: 15, color: "#C8A97E", desc: "Un facial glow y un masaje al mes, y 15 % en servicios." }
  ];
  [[0, "m2"], [4, "m1"], [7, "m1"], [12, "m2"], [15, "m1"]].filter(([, m]) => membresias.some(x => x.id === m)).forEach(([i, m]) => clientas[i].membresia = { membresia_id: m, desde: ahora - (20 + i * 9) * DIA, usos: {} });

  const paquetes = D.paquetes || [
    { id: "q1", nombre: "5 pedicures spa", servicio_id: "s06", sesiones: 5, precio: 720, vigencia: 120, desc: "Ahorra Q80." },
    { id: "q2", nombre: "4 faciales glow", servicio_id: "s31", sesiones: 4, precio: 1900, vigencia: 150, desc: "Uno al mes, piel de evento." },
    { id: "q3", nombre: "Paquete novia", servicio_id: "s26", sesiones: 1, precio: 2300, vigencia: 180, desc: "Maquillaje y peinado con prueba, manicure en gel y pedicure spa.", extras: ["s17", "s02", "s06"] }
  ];
  const paquetes_clienta = D.paquetes ? [] : [
    { id: uid(), clienta_id: "k3", paquete_id: "q1", usadas: 2, comprado: ahora - 50 * DIA },
    { id: uid(), clienta_id: "k10", paquete_id: "q2", usadas: 1, comprado: ahora - 25 * DIA },
    { id: uid(), clienta_id: "k21", paquete_id: "q3", usadas: 0, comprado: ahora - 10 * DIA }
  ];
  const tarjetas_regalo = [
    { id: uid(), codigo: "GR-ROSA", de: "Luis", para: "Andrea Mejía", mensaje: "Para que te consientas. Te quiero.", monto: 500, saldo: 500, diseno: "rosa", creado: ahora - 6 * DIA },
    { id: uid(), codigo: "GR-ORO7", de: "Tus amigas", para: "Gabriela Rodas", mensaje: "¡Feliz cumple! Un día de spa completo.", monto: 1000, saldo: 625, diseno: "oro", creado: ahora - 40 * DIA },
    { id: uid(), codigo: "GR-NOIR", de: "Mamá", para: "Renata Paiz", mensaje: "Por tu graduación.", monto: 750, saldo: 750, diseno: "noir", creado: ahora - 2 * DIA }
  ];

  /* historial de citas y pagos */
  const citas = [], pagos = [];
  const pesos = D.servicios ? servicios.flatMap(x => x.precio < 120 ? [x.id, x.id, x.id] : [x.id]) : ["s02", "s02", "s02", "s01", "s06", "s06", "s07", "s03", "s04", "s05", "s10", "s10", "s11", "s12", "s13", "s16", "s17", "s14", "s15", "s20", "s22", "s23", "s23", "s24", "s25", "s30", "s31", "s32", "s33", "s35", "s35", "s36"];
  const quien = s => { const c = estilistas.filter(e => e.cats.includes(servicios.find(x => x.id === s).cat)); return c[Math.floor(rnd() * c.length)]; };
  const codigo = () => "C" + Math.floor(rnd() * 36 ** 5).toString(36).toUpperCase().padStart(5, "0");
  const metodo = () => { const r = rnd(); return r < .34 ? "efectivo" : r < .74 ? "tarjeta" : r < .9 ? "transferencia" : "link"; };
  const disenos = ["frances", "nude-glitter", "aura-rosa", "cromado-perla", "rojo-clasico", "noir-piedras", "baby-boomer", "marmol", "flores", "carey"];
  const nuevaCita = (o) => {
    const sv = servicios.find(x => x.id === o.s), e = o.e ? estilistas.find(x => x.id === o.e) : quien(o.s);
    const ini = redondo(o.t), c = {
      id: uid(), codigo: codigo(), clienta_id: o.k || clientas[Math.floor(Math.pow(rnd(), 1.6) * clientas.length)].id,
      items: [{ id: uid(), servicio_id: sv.id, estilista_id: e.id, ini, fin: ini + sv.dur * MIN, precio: sv.precio + (sv.desde ? Math.round(rnd() * 4) * 50 : 0) }],
      estado: o.estado, origen: o.origen || (rnd() < .45 ? "en_linea" : rnd() < .7 ? "recepcion" : "whatsapp"), estacion_id: null,
      diseno: o.diseno !== undefined ? o.diseno : (sv.diseno && rnd() < .5 ? { preset: pick(disenos) } : null),
      anticipo: sv.anticipo ? { monto: sv.anticipo, pagado: true } : null, notas: o.notas || "", t: { creada: ini - Math.floor(1 + rnd() * 10) * DIA }, confirmo: o.estado !== "reservada"
    };
    c.ini = ini; c.fin = c.items[c.items.length - 1].fin;
    citas.push(c); return c;
  };
  const pagar = (c, t) => {
    const total = sum(c.items, i => i.precio), m = metodo(), prop = rnd() < .45 ? Math.round(total * pick([.05, .1, .1, .15]) / 5) * 5 : 0;
    const lineas = c.items.map(i => ({ tipo: "servicio", ref: i.servicio_id, nombre: servicios.find(s => s.id === i.servicio_id).nombre, precio: i.precio, cant: 1, estilista_id: i.estilista_id }));
    if (rnd() < .2) { const p = pick(productos.filter(x => x.tipo === "venta")); lineas.push({ tipo: "producto", ref: p.id, nombre: p.nombre, precio: p.precio, cant: 1, estilista_id: c.items[0].estilista_id }); }
    const tot = sum(lineas, l => l.precio * l.cant), anticipo = c.anticipo && c.anticipo.pagado ? c.anticipo.monto : 0;
    const metodos = [{ metodo: m, monto: tot - anticipo }]; if (anticipo) metodos.unshift({ metodo: "anticipo", monto: anticipo });
    const pg = { id: uid(), cita_id: c.id, clienta_id: c.clienta_id, fecha: t, lineas, descuento: 0, metodos, propinas: prop ? { [c.items[0].estilista_id]: prop } : {}, total: tot, turno_id: null };
    pagos.push(pg); c.pago_id = pg.id; c.t.pagada = t;
  };
  for (let d = 75; d >= 1; d--) {
    const d0 = hoy - d * DIA, dow = new Date(d0).getDay(), h = config.horario[dow]; if (!h) continue;
    const n = (dow === 5 || dow === 6 ? 10 : 7) + Math.floor(rnd() * 5);
    for (let j = 0; j < n; j++) {
      const s = pick(pesos), t = d0 + (h[0] + Math.floor(rnd() * ((h[1] - h[0] - 60) / 15)) * 15) * MIN;
      const r = rnd(), estado = r < .03 ? "falta" : r < .05 ? "cancelada" : "pagada";
      const c = nuevaCita({ s, t, estado });
      c.t.llego = c.ini - 5 * MIN; c.t.empezo = c.ini; c.t.termino = c.fin;
      if (estado === "pagada") pagar(c, c.fin + 5 * MIN); else { delete c.t.llego; delete c.t.empezo; delete c.t.termino; }
    }
  }
  /* hoy, alrededor de la hora actual */
  const T = m => redondo(ahora + m * MIN);
  const hoyL = D.servicios ? hoyGenerado(estilistas, servicios) : [
    { s: "s02", e: "e3", m: -230, estado: "pagada", diseno: { preset: "nude-glitter" }, k: "k12" }, { s: "s10", e: "e1", m: -205, estado: "pagada", k: "k6" },
    { s: "s30", e: "e6", m: -185, estado: "pagada", k: "k9" }, { s: "s06", e: "e4", m: -150, estado: "pagada", k: "k3" },
    { s: "s11", e: "e2", m: -55, estado: "terminada", k: "k14" },
    { s: "s13", e: "e1", m: -50, estado: "en_servicio", k: "k2" }, { s: "s04", e: "e3", m: -35, estado: "en_servicio", diseno: { preset: "aura-rosa" }, k: "k5" },
    { s: "s20", e: "e5", m: -60, estado: "en_servicio", k: "k3" },
    { s: "s07", e: "e4", m: 5, estado: "llego", k: "k1", diseno: { preset: "rojo-clasico", pies: true } }, { s: "s17", e: "e2", m: 10, estado: "llego", k: "k18" },
    { s: "s35", e: "e6", m: 20, estado: "confirmada", k: "k11" }, { s: "s16", e: "e1", m: 35, estado: "confirmada", k: "k22" },
    { s: "s02", e: "e3", m: 60, estado: "reservada", origen: "en_linea", diseno: { preset: "frances" }, k: "k8" },
    { s: "s22", e: "e5", m: 75, estado: "confirmada", k: "k24" }, { s: "s01", e: "e4", m: 90, estado: "reservada", origen: "en_linea", k: "k27" },
    { s: "s14", e: "e1", m: 100, estado: "confirmada", k: "k16", notas: "Quiere un rubio miel, trae foto de referencia." },
    { s: "s33", e: "e6", m: 110, estado: "reservada", k: "k30" }, { s: "s25", e: "e2", m: 120, estado: "confirmada", k: "k19" },
    { s: "s03", e: "e3", m: 170, estado: "reservada", origen: "en_linea", diseno: { preset: "noir-piedras" }, k: "k26" }
  ];
  hoyL.forEach(o => {
    const c = nuevaCita({ s: o.s, e: o.e, t: T(o.m), estado: o.estado, diseno: o.diseno || null, k: o.k, origen: o.origen, notas: o.notas });
    c.t.creada = ahora - (2 + Math.floor(rnd() * 6)) * DIA;
    if (["llego", "en_servicio", "terminada", "pagada"].includes(o.estado)) c.t.llego = Math.min(ahora - (o.estado === "llego" ? (o.m === 5 ? 6 : 2) : 15) * MIN, c.ini - 3 * MIN);
    if (["en_servicio", "terminada", "pagada"].includes(o.estado)) c.t.empezo = c.ini;
    if (["terminada", "pagada"].includes(o.estado)) c.t.termino = Math.min(c.fin, ahora - 8 * MIN);
    if (o.estado === "pagada") pagar(c, c.fin + 5 * MIN);
  });
  /* próximos días */
  for (let d = 1; d <= 7; d++) {
    const d0 = hoy + d * DIA, dow = new Date(d0).getDay(), h = config.horario[dow]; if (!h) continue;
    const n = 6 + Math.floor(rnd() * 5);
    for (let j = 0; j < n; j++) {
      const s = pick(pesos), t = d0 + (h[0] + 60 + Math.floor(rnd() * ((h[1] - h[0] - 180) / 30)) * 30) * MIN;
      nuevaCita({ s, t, estado: rnd() < .55 ? "confirmada" : "reservada" });
    }
  }
  if (!D.servicios) nuevaCita({ s: "s26", e: "e2", t: hoy + 3 * DIA + 9 * 60 * MIN, estado: "confirmada", k: "k21", notas: "Boda 4:00 p. m. Prueba ya hecha.", origen: "en_linea" });

  /* tarjeta de puntos: sellos según visitas */
  const meta = config.lealtad.sellos;
  clientas.forEach((k, i) => {
    const v = citas.filter(c => c.clienta_id === k.id && c.estado === "pagada").length;
    k.sellos = v % meta; k.premios = Math.floor(v / meta) % 2; k.tarjeta = "T" + Math.floor(rnd() * 36 ** 5).toString(36).toUpperCase().padStart(5, "0");
    k.wallet = { apple: rnd() < .3, google: rnd() < .18 };
  });
  /* estaciones de las citas activas de hoy */
  const usadas = {};
  citas.filter(c => ["en_servicio", "llego"].includes(c.estado)).forEach(c => {
    const tipo = servicios.find(s => s.id === c.items[0].servicio_id).est;
    const x = estaciones.find(e => e.tipo === tipo && !usadas[e.id]); if (x && c.estado === "en_servicio") { usadas[x.id] = 1; c.estacion_id = x.id; }
  });

  const abre = hoy + (config.horario[new Date(hoy).getDay()] || [8 * 60])[0] * MIN;
  const turnos_caja = [{ id: "t1", abierto: Math.min(abre, ahora - 4 * HORA), fondo: 500, cerrado: null, contado: null }];
  pagos.filter(p => p.fecha >= hoy).forEach(p => p.turno_id = "t1");

  const lista_espera = [
    { id: uid(), nombre: "Mariela Ortiz", tel: "55123344", servicio_id: "s02", nota: "Cualquier hora después de las 3", creado: ahora - 40 * MIN },
    { id: uid(), nombre: "Jennifer Rosales", tel: "54889911", servicio_id: "s23", nota: "", creado: ahora - 12 * MIN }
  ];
  const TXT = ["Me encantó, las uñas me duraron tres semanas perfectas.", "El mejor balayage que me han hecho. Andrea es una artista.", "Súper puntuales y el lugar es precioso.", "El facial glow vale cada quetzal.", "Me atendieron con mucho cariño. Volveré.", "Mis pestañas quedaron naturales, justo como las quería.", "Reservé en un minuto y me llegó el recordatorio.", "Ambiente tranquilo, café rico y trabajo impecable."];
  const resenas = TXT.map((texto, i) => ({ id: uid(), clienta_id: "k" + (i * 3 + 2), estrellas: i === 4 ? 4 : 5, texto, fecha: ahora - (i * 4 + 1) * DIA }));

  return {
    version: VERSION, creado: ahora, config, estilistas, estaciones, servicios, productos, esmaltes, clientas, citas, pagos,
    paquetes, paquetes_clienta, membresias, tarjetas_regalo, links_pago: [], movimientos_inventario: [], turnos_caja, lista_espera, resenas, mensajes: [], disenos: []
  };
}

/* citas de hoy para marcas con datos propios: cada estilista con algo hecho, algo en curso y algo por venir */
function hoyGenerado(estilistas, servicios) {
  const out = [], dur = id => (servicios.find(x => x.id === id) || { dur: 45 }).dur;
  const PRE = ["frances", "rojo-clasico", "flores", "nude-glitter", "aura-rosa", "carey"];
  estilistas.forEach((e, i) => {
    const ss = servicios.filter(s => e.cats.includes(s.cat)); if (!ss.length) return;
    const busca = f => ss.find(f) || ss[0];
    const conDis = busca(s => s.diseno), conPose = busca(s => s.pose), corto = ss.slice().sort((a, b) => a.dur - b.dur)[0];
    const dis = (s, n) => s.diseno ? { preset: PRE[(i + n) % PRE.length], pies: !!s.pies } : null;
    const k = n => "k" + (1 + ((i * 11 + n * 5) % 45));
    const a = ss[(i + 1) % ss.length];
    out.push({ s: a.id, e: e.id, m: -230 + i * 25, estado: "pagada", k: k(1), diseno: dis(a, 0) });
    const actual = i % 3 === 0 ? { s: conPose.id, m: -45, estado: "en_servicio" } : i % 3 === 1 ? { s: conDis.id, m: -30, estado: "en_servicio", diseno: dis(conDis, 1) } : { s: corto.id, m: -45, estado: "terminada" };
    out.push(Object.assign({ e: e.id, k: k(2) }, actual));
    out.push({ s: corto.id, e: e.id, m: actual.m + dur(actual.s) + 5, estado: "llego", k: k(3) });
    out.push({ s: conDis.id, e: e.id, m: 75 + i * 20, estado: "reservada", origen: "en_linea", k: k(4), diseno: dis(conDis, 2) });
    const b = ss[(i + 2) % ss.length];
    out.push({ s: b.id, e: e.id, m: 150 + i * 15, estado: "confirmada", k: k(5), diseno: dis(b, 3) });
  });
  return out;
}

/* ---------- capa de datos ---------- */
const canal = "BroadcastChannel" in window ? new BroadcastChannel(CLAVE) : null;
const db = {
  d: null,
  cargar() {
    try { this.d = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { this.d = null; }
    if (!this.d || this.d.version !== VERSION) { this.d = semilla(); this.guardar(); }
  },
  guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(this.d)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } },
  listar(t, f) { const l = this.d[t] || []; return f ? l.filter(f) : l.slice(); },
  obtener(t, id) { return (this.d[t] || []).find(x => x.id === id); },
  insertar(t, fila) { if (!fila.id) fila.id = uid(); (this.d[t] = this.d[t] || []).push(fila); this.cambio(); return fila; },
  actualizar(t, id, c) { const f = this.obtener(t, id); if (f) Object.assign(f, typeof c === "function" ? c(f) : c); this.cambio(); return f; },
  eliminar(t, id) { this.d[t] = this.d[t].filter(x => x.id !== id); this.cambio(); },
  cambio() { this.guardar(); canal && canal.postMessage("cambio"); pedirRender(true); },
  reiniciar() { this.d = semilla(); this.guardar(); canal && canal.postMessage("cambio"); }
};
const cfg = () => db.d.config;
canal && (canal.onmessage = () => { db.cargar(); pedirRender(false); });
window.addEventListener("storage", e => { if (e.key === CLAVE) { db.cargar(); pedirRender(false); } });

/* ---------- consultas ---------- */
const serv = id => db.obtener("servicios", id) || { nombre: "Servicio", precio: 0, dur: 30, cat: "unas", est: "unas" };
const est = id => db.obtener("estilistas", id) || { nombre: "Por asignar", color: "#ddd", cats: [] };
const cli = id => db.obtener("clientas", id) || { nombre: "Clienta", tel: "" };
const catDe = id => CATEGORIAS.find(c => c.id === id) || CATEGORIAS[0];
const citaPorCodigo = cod => db.listar("citas").find(c => c.codigo === String(cod).toUpperCase());
const activa = c => !["cancelada", "falta"].includes(c.estado);
const citasDia = (t = Date.now(), f) => db.listar("citas", c => c.ini >= dia0(t) && c.ini < dia0(t) + DIA && activa(c) && (!f || f(c))).sort((a, b) => a.ini - b.ini);
const totalCita = c => sum(c.items, i => i.precio);
const nombresServ = c => c.items.map(i => serv(i.servicio_id).nombre).join(" + ");
const estilistasDe = c => [...new Set(c.items.map(i => i.estilista_id))].map(est);
const linkCita = c => urlBase() + "#/mi-cita/" + c.codigo;
const reservarURL = () => urlBase() + "#/reservar";
const puede = (e, s) => e.cats.includes(serv(s).cat) && (!serv(s).estilistas || !serv(s).estilistas.length || serv(s).estilistas.includes(e.id));
const horarioDia = t => cfg().horario[new Date(t).getDay()] || null;
const abiertoAhora = () => { const h = horarioDia(Date.now()); if (!h) return false; const m = (Date.now() - dia0()) / MIN; return m >= h[0] && m < h[1]; };
const ultimaVisita = k => { const l = db.listar("citas", c => c.clienta_id === k && c.estado === "pagada").sort((a, b) => b.ini - a.ini); return l[0] || null; };
const citasDe = k => db.listar("citas", c => c.clienta_id === k).sort((a, b) => b.ini - a.ini);
const gastoDe = k => sum(db.listar("pagos", p => p.clienta_id === k), p => p.total);
const membresiaDe = k => { const c = cli(k); return c.membresia ? db.obtener("membresias", c.membresia.membresia_id) : null; };
const paquetesDe = k => db.listar("paquetes_clienta", p => p.clienta_id === k).map(p => Object.assign({}, p, { paquete: db.obtener("paquetes", p.paquete_id) })).filter(p => p.paquete && p.usadas < p.paquete.sesiones);
const esmalte = id => db.obtener("esmaltes", id);
function cumpleEn(k, dias = 0) { const c = cli(k); if (!c.cumple) return false; const [m, d] = c.cumple.split("-").map(Number); const hoy = new Date(); const f = new Date(hoy.getFullYear(), m - 1, d); const delta = Math.round((dia0(+f) - dia0()) / DIA); return delta >= 0 && delta <= dias; }
const esCumpleMes = k => { const c = cli(k); return c.cumple && +c.cumple.split("-")[0] === new Date().getMonth() + 1; };
function buscarClientas(q) {
  q = String(q || "").toLowerCase().trim(); const dig = q.replace(/\D/g, "");
  if (!q) return db.listar("clientas").sort((a, b) => a.nombre.localeCompare(b.nombre));
  return db.listar("clientas", c => c.nombre.toLowerCase().includes(q) || (dig.length >= 3 && c.tel.includes(dig)));
}
function retoques() {
  const out = [];
  db.listar("clientas").forEach(k => {
    CATEGORIAS.forEach(cat => {
      const ult = db.listar("citas", c => c.clienta_id === k.id && c.estado === "pagada" && c.items.some(i => serv(i.servicio_id).cat === cat.id)).sort((a, b) => b.ini - a.ini)[0];
      if (!ult) return;
      const toca = ult.ini + cat.retoque * DIA, futura = db.listar("citas", c => c.clienta_id === k.id && c.ini > Date.now() && activa(c)).length;
      if (!futura && toca < Date.now() + 2 * DIA && toca > Date.now() - 40 * DIA) out.push({ clienta: k, cat, ultima: ult, toca });
    });
  });
  return out.sort((a, b) => a.toca - b.toca);
}

/* ---------- disponibilidad ---------- */
function bloquesOcupados(estId, d0, ignorar) {
  const out = [];
  db.d.citas.forEach(c => {
    if (!activa(c) || c.id === ignorar) return;
    c.items.forEach(i => {
      if (i.estilista_id !== estId || i.ini < d0 || i.ini >= d0 + DIA) return;
      const s = serv(i.servicio_id);
      if (s.pose) { out.push([i.ini, i.ini + s.pose.ini * MIN]); out.push([i.ini + (s.pose.ini + s.pose.min) * MIN, i.fin]); }
      else out.push([i.ini, i.fin]);
    });
  });
  return out;
}
const choca = (bloques, a, b) => bloques.some(([x, y]) => a < y && b > x);
function trabaja(e, ini, fin) {
  const d = new Date(ini), h = horarioDia(ini); if (!h || !e.dias.includes(d.getDay())) return false;
  const a = (ini - dia0(ini)) / MIN, b = (fin - dia0(ini)) / MIN;
  return a >= Math.max(h[0], e.entra) && b <= Math.min(h[1], e.sale);
}
function estacionLibre(tipo, ini, fin, ignorar) {
  const cap = db.listar("estaciones", x => x.tipo === tipo).length; if (!cap) return true;
  const n = db.listar("citas", c => activa(c) && c.id !== ignorar).reduce((k, c) => k + c.items.filter(i => serv(i.servicio_id).est === tipo && i.ini < fin && i.fin > ini).length, 0);
  return n < cap;
}
function librePara(e, s, ini, ignorar, extra = []) {
  const sv = serv(s), fin = ini + sv.dur * MIN;
  if (!trabaja(e, ini, fin)) return false;
  const bl = bloquesOcupados(e.id, dia0(ini), ignorar).concat(extra.filter(x => x.e === e.id).map(x => [x.a, x.b]));
  const activos = sv.pose ? [[ini, ini + sv.pose.ini * MIN], [ini + (sv.pose.ini + sv.pose.min) * MIN, fin]] : [[ini, fin]];
  if (activos.some(([a, b]) => choca(bl, a, b))) return false;
  return estacionLibre(sv.est, ini, fin, ignorar);
}
/* arma los renglones de una cita (servicios seguidos); estPref = id o "" */
function planificar(servs, t, estPref, ignorar) {
  let cur = t; const items = [], extra = [];
  for (const s of servs) {
    const sv = serv(s);
    let cand = db.listar("estilistas", e => puede(e, s));
    if (estPref && cand.some(e => e.id === estPref)) cand = cand.filter(e => e.id === estPref);
    const e = cand.find(e => librePara(e, s, cur, ignorar, extra)); if (!e) return null;
    items.push({ id: uid(), servicio_id: s, estilista_id: e.id, ini: cur, fin: cur + sv.dur * MIN, precio: sv.precio });
    extra.push({ e: e.id, a: cur, b: cur + sv.dur * MIN });
    cur += sv.dur * MIN;
  }
  return items;
}
function horasLibres(d0, servs, estPref, ignorar) {
  const h = horarioDia(d0); if (!h || !servs.length) return [];
  const paso = cfg().intervalo, total = sum(servs, s => serv(s).dur), out = [], limite = Date.now() + 20 * MIN;
  for (let m = h[0]; m + total <= h[1]; m += paso) {
    const t = d0 + m * MIN; if (t < limite) continue;
    const items = planificar(servs, t, estPref, ignorar); if (items) out.push({ t, items });
  }
  return out;
}

/* ---------- acciones del negocio ---------- */
function codigoNuevo() { let c; do { c = "C" + Math.floor(Math.random() * 36 ** 5).toString(36).toUpperCase().padStart(5, "0"); } while (citaPorCodigo(c)); return c; }
function clientaPorTel(nombre, tel) {
  const d = String(tel || "").replace(/\D/g, "").replace(/^502/, "");
  let k = d ? db.listar("clientas").find(c => c.tel === d) : null;
  if (!k) { k = { id: "k" + uid(), nombre: nombre.trim() || "Clienta", tel: d, cumple: "", origen: "Reserva en línea", bebida: "", alergias: "", notas: "", vip: false, puntos: 0, creado: Date.now(), membresia: null, color: [], pestanas: null, fotos: [], consentimientos: [], faltas: 0 }; db.d.clientas.push(k); }
  return k;
}
function crearCita(o) {
  const c = {
    id: uid(), codigo: codigoNuevo(), clienta_id: o.clienta_id, items: o.items, estado: o.estado || "reservada", origen: o.origen || "recepcion",
    estacion_id: null, diseno: o.diseno || null, anticipo: o.anticipo || null, notas: o.notas || "", t: { creada: Date.now() }, confirmo: o.estado === "confirmada"
  };
  c.ini = Math.min(...c.items.map(i => i.ini)); c.fin = Math.max(...c.items.map(i => i.fin));
  if (c.diseno && c.diseno.precio) { const it = c.items.find(i => serv(i.servicio_id).diseno); if (it) it.arte = c.diseno.precio; }
  db.d.citas.push(c); db.cambio(); return c;
}
const precioArte = c => sum(c.items, i => i.arte || 0);
const totalConArte = c => totalCita(c) + precioArte(c);
function moverCita(c, items) { c.items = items; c.ini = Math.min(...items.map(i => i.ini)); c.fin = Math.max(...items.map(i => i.fin)); db.cambio(); }
function asignarEstacion(c) {
  const tipo = serv(c.items[0].servicio_id).est;
  const ocupadas = new Set(db.listar("citas", x => x.estado === "en_servicio" && x.estacion_id).map(x => x.estacion_id));
  const x = db.listar("estaciones", e => e.tipo === tipo && !ocupadas.has(e.id))[0];
  return x ? x.id : null;
}
function marcarLlegada(c) { if (!c) return; c.estado = "llego"; c.t.llego = Date.now(); db.cambio(); }
function empezar(c) { if (!c) return; if (!c.t.llego) c.t.llego = Date.now(); c.estado = "en_servicio"; c.t.empezo = Date.now(); if (!c.estacion_id) c.estacion_id = asignarEstacion(c); db.cambio(); }
function terminar(c) {
  if (!c) return; c.estado = "terminada"; c.t.termino = Date.now(); c.estacion_id = null;
  c.items.forEach(i => (serv(i.servicio_id).consumo || []).forEach(x => {
    const p = db.obtener("productos", x.producto_id); if (!p) return;
    p.stock = Math.max(0, p.stock - x.cant);
    db.d.movimientos_inventario.push({ id: uid(), producto_id: p.id, tipo: "uso", cant: -x.cant, nota: serv(i.servicio_id).nombre + " · " + cli(c.clienta_id).nombre, fecha: Date.now() });
  }));
  db.cambio();
}
function cancelarCita(c, falta = false) { c.estado = falta ? "falta" : "cancelada"; c.t[falta ? "falta" : "cancelada"] = Date.now(); if (falta) cli(c.clienta_id).faltas = (cli(c.clienta_id).faltas || 0) + 1; db.cambio(); }
const turnoAbierto = () => db.listar("turnos_caja", t => !t.cerrado).pop();
/* cobro: o = {lineas, descuento, metodos:[{metodo,monto,ref}], propinas:{est:monto}, paquete_uso, regalo_codigo} */
function registrarCobro(c, o) {
  const total = r2(sum(o.lineas, l => l.precio * l.cant) - (o.descuento || 0));
  const turno = turnoAbierto();
  const pg = { id: uid(), cita_id: c ? c.id : null, clienta_id: c ? c.clienta_id : o.clienta_id || null, fecha: Date.now(), lineas: o.lineas, descuento: o.descuento || 0, metodos: o.metodos, propinas: o.propinas || {}, total, turno_id: turno ? turno.id : null };
  db.d.pagos.push(pg);
  o.lineas.filter(l => l.tipo === "producto").forEach(l => {
    const p = db.obtener("productos", l.ref); if (!p) return; p.stock = Math.max(0, p.stock - l.cant);
    db.d.movimientos_inventario.push({ id: uid(), producto_id: p.id, tipo: "venta", cant: -l.cant, nota: "Venta", fecha: Date.now() });
  });
  o.metodos.forEach(m => {
    if (m.metodo === "regalo") { const g = db.listar("tarjetas_regalo").find(x => x.codigo === m.ref); if (g) g.saldo = r2(Math.max(0, g.saldo - m.monto)); }
    if (m.metodo === "paquete") { const p = db.obtener("paquetes_clienta", m.ref); if (p) p.usadas++; }
    if (m.metodo === "membresia" && pg.clienta_id) { const k = cli(pg.clienta_id); if (k.membresia) { const mes = new Date().getMonth(); k.membresia.usos[mes + ":" + m.ref] = (k.membresia.usos[mes + ":" + m.ref] || 0) + 1; } }
  });
  if (pg.clienta_id) { const k = cli(pg.clienta_id); k.puntos = (k.puntos || 0) + Math.floor(total / cfg().puntos_cada); }
  if (c && pg.clienta_id) {
    const k = cli(pg.clienta_id), meta = lealtad().sellos;
    if (!k.tarjeta) k.tarjeta = codigoTarjeta();
    k.sellos = (k.sellos || 0) + 1; pg.sello = k.sellos;
    if (k.sellos >= meta) { k.sellos = 0; k.premios = (k.premios || 0) + 1; pg.premio = true; }
  }
  if (c) { c.estado = "pagada"; c.pago_id = pg.id; c.t.pagada = Date.now(); }
  db.cambio(); return pg;
}
function usosMembresia(k, servicio_id) {
  const c = cli(k), m = membresiaDe(k); if (!m) return null;
  const inc = m.incluye.find(x => x.servicio_id === servicio_id); if (!inc) return null;
  const usados = (c.membresia.usos || {})[new Date().getMonth() + ":" + servicio_id] || 0;
  return { quedan: inc.cant - usados, total: inc.cant };
}
/* tarjeta de puntos */
const lealtad = () => cfg().lealtad || { sellos: 8, premio: "Un servicio de regalo" };
function codigoTarjeta() { let c; do { c = "T" + Math.floor(Math.random() * 36 ** 5).toString(36).toUpperCase().padStart(5, "0"); } while (db.listar("clientas").some(k => k.tarjeta === c)); return c; }
const clientaPorTarjeta = cod => db.listar("clientas").find(k => k.tarjeta && k.tarjeta === String(cod).toUpperCase());
const linkTarjeta = k => { if (!k.tarjeta) { k.tarjeta = codigoTarjeta(); db.guardar(); } return urlBase() + "#/tarjeta/" + k.tarjeta; };
function nivelDe(k) { const g = gastoDe(k.id); return g >= 4000 ? { n: "Diamante", c: "#9FB7C9" } : g >= 1500 ? { n: "Oro", c: "#C9A24A" } : { n: "Clienta", c: "#D7A6AE" }; }
function canjearPremio(k) { if (!k.premios) return false; k.premios--; db.d.mensajes.push({ id: uid(), clienta_id: k.id, tipo: "premio", texto: "Canjeó: " + lealtad().premio, fecha: Date.now() }); db.cambio(); return true; }

function crearLink(monto, concepto, ref) {
  const l = { id: uid(), codigo: "PG-" + Math.random().toString(36).slice(2, 7).toUpperCase(), monto: r2(monto), concepto, ref: ref || null, estado: "pendiente", creado: Date.now() };
  db.d.links_pago.push(l); db.cambio(); return l;
}
const urlLink = l => urlBase() + "#/pago/" + l.codigo;
function comisiones(estId, desde, hasta = Date.now()) {
  const e = est(estId); let serv_v = 0, prod_v = 0, prop = 0, n = 0;
  db.listar("pagos", p => p.fecha >= desde && p.fecha < hasta).forEach(p => {
    p.lineas.forEach(l => { if (l.estilista_id !== estId) return; if (l.tipo === "servicio") { serv_v += l.precio * l.cant; n++; } else if (l.tipo === "producto") prod_v += l.precio * l.cant; });
    prop += (p.propinas || {})[estId] || 0;
  });
  return { servicios: serv_v, productos: prod_v, propinas: prop, citas: n, com_serv: r2(serv_v * e.com_serv / 100), com_prod: r2(prod_v * e.com_prod / 100), total: r2(serv_v * e.com_serv / 100 + prod_v * e.com_prod / 100 + prop) };
}
const inicioMes = (t = Date.now()) => { const d = new Date(t); return +new Date(d.getFullYear(), d.getMonth(), 1); };
function textoPlantilla(plantilla, c, k) {
  const it = c ? c.items[0] : null;
  return String(plantilla || "").replace(/\{(\w+)\}/g, (_, v) => ({
    nombre: (k || {}).nombre ? k.nombre.split(" ")[0] : "", salon: MARCA.nombre, fecha: c ? fechaLarga(c.ini) : "", hora: c ? hora(c.ini) : "",
    link: c ? linkCita(c) : "", reservar: reservarURL(), servicio: c ? nombresServ(c) : "", estilista: it ? est(it.estilista_id).nombre.split(" ")[0] : "", categoria: ""
  })[v] ?? "");
}
function registrarMensaje(k, tipo, texto) { db.d.mensajes.push({ id: uid(), clienta_id: k ? k.id : null, tipo, texto, fecha: Date.now() }); db.guardar(); }
