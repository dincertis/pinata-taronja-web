// PIÑATA TARONJA · comportamiento básico de la web.
// Ambos formularios envían a un único webhook de n8n (campo "tipo" los distingue):
// guarda la fila en Google Sheets y avisa por correo a hola@pinatataronja.com.
const WEBHOOK = "https://n8n.davidincertis.com/webhook/pinata-taronja-contacto";
const WEBHOOK_PRESUPUESTO = WEBHOOK;
const WEBHOOK_NEWSLETTER = WEBHOOK;

async function enviar(url, datos) {
  if (!url) return true; // modo diseño: sin destino configurado
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return respuesta.ok;
}

function conectarFormulario(formulario, url) {
  const aviso = formulario.querySelector(".mensaje-ok");
  const textoOk = aviso.textContent;
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!formulario.reportValidity()) return;
    const datos = Object.fromEntries(new FormData(formulario).entries());
    const boton = formulario.querySelector("button[type=submit]");
    boton.disabled = true;
    try {
      const ok = await enviar(url, datos);
      if (!ok) throw new Error("Respuesta no válida");
      formulario.reset();
      aviso.textContent = textoOk;
      aviso.classList.add("visible");
      aviso.focus();
    } catch (error) {
      aviso.textContent = "No hemos podido enviar el formulario. Inténtalo de nuevo en unos minutos.";
      aviso.classList.add("visible");
    } finally {
      boton.disabled = false;
    }
  });
}

const formPresupuesto = document.querySelector("#form-presupuesto");
const formNewsletter = document.querySelector("#form-newsletter");
if (formPresupuesto) conectarFormulario(formPresupuesto, WEBHOOK_PRESUPUESTO);
if (formNewsletter) conectarFormulario(formNewsletter, WEBHOOK_NEWSLETTER);

// Los botones "Pedir este pack" rellenan el selector de servicio y el mensaje.
document.querySelectorAll("[data-pack]").forEach((enlace) => {
  enlace.addEventListener("click", () => {
    const campoPack = document.querySelector("#pack");
    if (campoPack) campoPack.value = enlace.dataset.pack;
  });
});

// Imagotipo del hero (solo escritorio). Al pasar el ratón:
// 1) el círculo azul (delante) sube en diagonal, alejándose del grande, hasta ser tangente;
// 2) ahí pasa a ir detrás y cruza por detrás del círculo grande hasta salir por el otro lado, de nuevo tangente;
// 3) ahí vuelve a ir delante y sube por la misma diagonal hasta su sitio, con un pequeño rebote final.
// Las capas solo cambian cuando los círculos son tangentes (no se solapan), así que el cambio no se nota.
(function animarImagotipo() {
  const zona = document.querySelector(".circulos");
  const azul = document.getElementById("pt-azul");
  const capaAzul = document.querySelector(".pt-azul");
  if (!zona || !azul || !capaAzul || !azul.animate) return;

  const PRINCIPAL = 1950; // ms del recorrido principal
  const ASENTAMIENTO = 300; // ms del rebote final
  const REBOTE = 12; // cuánto se pasa de su posición al final (unidades del viewBox 375×395)
  const DURACION = PRINCIPAL + ASENTAMIENTO;

  // Geometría medida sobre el logo original
  const grande = { x: 157, y: 237.5, r: 144.8 };
  const reposo = { x: 257.3, y: 114.4, r: 102.7 };
  const dx = reposo.x - grande.x, dy = reposo.y - grande.y;
  const DIST = Math.hypot(dx, dy); // distancia entre centros en reposo
  const ux = dx / DIST, uy = dy / DIST; // diagonal que une los centros
  const TANGENTE = grande.r + reposo.r + 0.5; // distancia entre centros cuando son tangentes

  // Posición del azul = distancia de su centro al del grande, medida sobre la diagonal
  const pos = (s) => `translate(${(ux * (s - DIST)).toFixed(2)}px, ${(uy * (s - DIST)).toFixed(2)}px)`;
  const d1 = TANGENTE - DIST, d2 = 2 * TANGENTE, d3 = TANGENTE + DIST + REBOTE;
  const k = PRINCIPAL / DURACION / (d1 + d2 + d3);
  const T1 = d1 * k, T2 = (d1 + d2) * k, T3 = PRINCIPAL / DURACION;
  const suave = "cubic-bezier(.45, 0, .55, 1)", final = "cubic-bezier(.35, 0, .25, 1)";
  const recorrido = [
    { transform: pos(DIST), offset: 0, easing: suave },
    { transform: pos(TANGENTE), offset: T1, easing: suave }, // tangente arriba a la derecha: pasa detrás
    { transform: pos(-TANGENTE), offset: T2, easing: suave }, // tangente abajo a la izquierda: vuelve delante
    { transform: pos(DIST + REBOTE), offset: T3, easing: final },
    { transform: pos(DIST), offset: 1 },
  ];

  const escritorio = matchMedia("(min-width: 981px) and (hover: hover) and (pointer: fine)");
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)");
  let animacion = null;

  function ajustarCapa() {
    if (!animacion) return;
    const f = animacion.currentTime / DURACION;
    capaAzul.classList.toggle("detras", f >= T1 && f < T2);
    requestAnimationFrame(ajustarCapa);
  }
  function terminar() {
    animacion = null;
    capaAzul.classList.remove("detras");
  }

  zona.addEventListener("mouseenter", () => {
    if (animacion || !escritorio.matches || sinMovimiento.matches) return;
    animacion = azul.animate(recorrido, { duration: DURACION });
    animacion.finished.then(terminar, terminar);
    requestAnimationFrame(ajustarCapa);
  });
})();

// Título del hero (solo escritorio con ratón): al pasar el ratón por encima, una ola recorre las letras
// en orden; cada una crece un poco, cambia a un color de la paleta y vuelve a su tamaño y color.
(function olaTitulo() {
  const titulo = document.querySelector(".hero h1");
  if (!titulo || !titulo.animate) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const RETARDO = 38; // ms entre una letra y la siguiente
  const DURACION = 650; // ms que dura el gesto de cada letra
  const ESCALA = 1.22;
  const estilos = getComputedStyle(document.documentElement);
  const color = (nombre, respaldo) => estilos.getPropertyValue(nombre).trim() || respaldo;
  const COLORES = [
    color("--rosa", "#e7396d"), color("--coral", "#ee926f"), color("--amarillo", "#f6e521"),
    color("--cielo", "#4797d2"), color("--marino", "#24509e"),
  ];

  // Separa el título en palabras y letras (el texto completo queda como etiqueta para lectores de pantalla)
  const texto = titulo.textContent.trim();
  titulo.setAttribute("aria-label", texto);
  titulo.textContent = "";
  const letras = [];
  texto.split(" ").forEach((palabra, p, todas) => {
    const contenedor = document.createElement("span");
    contenedor.className = "ola-palabra";
    contenedor.setAttribute("aria-hidden", "true");
    for (const caracter of palabra) {
      const letra = document.createElement("span");
      letra.className = "ola-letra";
      letra.textContent = caracter;
      contenedor.appendChild(letra);
      letras.push(letra);
    }
    titulo.appendChild(contenedor);
    if (p < todas.length - 1) titulo.appendChild(document.createTextNode(" "));
  });

  let enCurso = false;
  titulo.addEventListener("mouseover", (evento) => {
    if (enCurso || evento.target === titulo) return;
    enCurso = true;
    let ultima = null;
    letras.forEach((letra, i) => {
      ultima = letra.animate(
        [
          { transform: "scale(1)", offset: 0 },
          { transform: `scale(${ESCALA})`, color: COLORES[i % COLORES.length], offset: 0.45 },
          { transform: "scale(1)", offset: 1 },
        ],
        { duration: DURACION, delay: i * RETARDO, easing: "ease-in-out" }
      );
    });
    const terminar = () => { enCurso = false; };
    ultima.finished.then(terminar, terminar);
  });
})();
