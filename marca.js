/* Marca del salón — lo único que cambia entre la demo genérica y la versión de cada prospecto. */
window.MARCA = {
  clave: "maison.demo",
  nombre: "Maison Lumière",
  corto: "Maison",
  lema: "beauty atelier",
  ciudad: "Guatemala",
  direccion: "Diagonal 6, 12-42, zona 10 · Ciudad de Guatemala",
  mapa: "https://maps.google.com/?q=zona+10+Guatemala",
  whatsapp: "50255550000",
  instagram: "maisonlumiere.gt",
  resena: "https://g.page/r/maison-lumiere/review",
  colores: {
    fondo: "#FAF7F2",
    fondo2: "#F2ECE3",
    tarjeta: "#FFFFFF",
    tinta: "#1C1A17",
    tinta2: "#5E574F",
    tenue: "#8C847A",
    linea: "#E7DFD3",
    acento: "#C8A97E",
    acentoTexto: "#8A6A3E",
    acentoSuave: "#F1E6D6",
    acentoSobre: "#1C1A17",
    nude: "#E9D6C5",
    oscuro: "#1C1A17"
  },
  fuentes: {
    titulo: "Bodoni Moda",
    texto: "Jost",
    url: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Jost:wght@300..800&display=swap"
  },
  /* Logo: monograma dibujado. Si se define logoImg, se usa la imagen. */
  logoImg: "",
  monograma: "ML"
};

(function () {
  const m = window.MARCA, r = document.documentElement.style, c = m.colores;
  Object.entries(c).forEach(([k, v]) => r.setProperty("--" + k.replace(/[A-Z]/g, x => "-" + x.toLowerCase()), v));
  r.setProperty("--f-titulo", `"${m.fuentes.titulo}", Georgia, serif`);
  r.setProperty("--f-texto", `"${m.fuentes.texto}", "Helvetica Neue", sans-serif`);
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = m.fuentes.url; document.head.appendChild(l);
  document.title = m.nombre;
})();
