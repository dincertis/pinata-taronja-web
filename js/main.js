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

// Imagotipo del hero (solo escritorio): al pasar el ratón, el círculo azul hace una órbita
// elíptica sobre la diagonal que une los dos centros. Pasa por detrás del círculo grande
// (una máscara lo esconde de forma gradual, sin saltos de capa) y vuelve por delante.
(function animarImagotipo() {
  const zona = document.querySelector(".circulos");
  const azul = document.getElementById("pt-azul");
  const iris = document.getElementById("pt-iris");
  if (!zona || !azul || !iris || !azul.animate) return;

  const DURACION = 1800; // ms por vuelta completa
  const ANCHO_ORBITA = 60; // semieje corto de la órbita (unidades del viewBox 375×395)
  const grande = { x: 157, y: 237.5 }; // centro del círculo grande
  const reposo = { x: 257.3, y: 114.4 }; // centro del azul en reposo
  const dx = reposo.x - grande.x, dy = reposo.y - grande.y;
  const DIST = Math.hypot(dx, dy); // distancia entre centros
  const ux = dx / DIST, uy = dy / DIST; // diagonal que une los centros
  const vx = -uy, vy = ux; // perpendicular
  const ALCANCE = 110; // hasta dónde llega el azul al otro lado del centro del círculo grande
  const A = (DIST + ALCANCE) / 2; // semieje largo de la elipse (va de la posición de reposo al extremo opuesto)

  const PASOS = 72;
  const orbita = [];
  for (let i = 0; i <= PASOS; i++) {
    const t = (i / PASOS) * Math.PI * 2;
    const x = ux * A * (Math.cos(t) - 1) + vx * ANCHO_ORBITA * Math.sin(t);
    const y = uy * A * (Math.cos(t) - 1) + vy * ANCHO_ORBITA * Math.sin(t);
    orbita.push({ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`, offset: i / PASOS });
  }
  // Primera mitad: el azul se esconde tras el grande; segunda mitad: vuelve a salir por delante.
  const ocultar = [
    { transform: "scale(0)", offset: 0, easing: "ease-out" },
    { transform: "scale(1)", offset: 0.16 },
    { transform: "scale(1)", offset: 0.5, easing: "ease-in" },
    { transform: "scale(0)", offset: 0.66 },
    { transform: "scale(0)", offset: 1 },
  ];

  const escritorio = matchMedia("(min-width: 981px) and (hover: hover) and (pointer: fine)");
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)");
  let enCurso = false;
  zona.addEventListener("mouseenter", () => {
    if (enCurso || !escritorio.matches || sinMovimiento.matches) return;
    enCurso = true;
    const vuelta = azul.animate(orbita, { duration: DURACION, easing: "cubic-bezier(.4, 0, .6, 1)" });
    iris.animate(ocultar, { duration: DURACION, easing: "linear" });
    const terminar = () => { enCurso = false; };
    vuelta.finished.then(terminar, terminar);
  });
})();
