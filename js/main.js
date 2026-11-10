// PIÑATA TARONJA · comportamiento básico de la web.
// Los formularios todavía no envían datos: cuando decidamos el destino
// (por ejemplo un webhook de n8n) basta con rellenar esta URL.
const WEBHOOK_PRESUPUESTO = "";
const WEBHOOK_NEWSLETTER = "";

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
