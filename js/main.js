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
