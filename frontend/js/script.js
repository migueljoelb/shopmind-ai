// ==========================================================
// CONFIGURACIÓN
// ==========================================================
// Esta es la URL del Webhook de n8n. Todavía no existe -
// la vamos a crear y pegar aquí en la Fase 6: Integración con IA.
const N8N_WEBHOOK_URL = "https://TU-INSTANCIA.app.n8n.cloud/webhook/shopmind";

// ==========================================================
// REFERENCIAS AL DOM
// ==========================================================
// document.getElementById busca en el HTML el elemento que tenga
// ese "id" exacto, y nos da acceso a él desde JavaScript.
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");

// ==========================================================
// FUNCIÓN: agregar un mensaje a la pantalla
// ==========================================================
// "sender" puede ser "bot" o "user", y controla de qué lado
// aparece la burbuja y de qué color es (gracias a las clases CSS).
function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);

  // Hacemos scroll automático hacia el mensaje más reciente
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================================
// FUNCIÓN: mostrar / ocultar el indicador "está escribiendo..."
// ==========================================================
function showTyping() {
  typingIndicator.hidden = false;
}

function hideTyping() {
  typingIndicator.hidden = true;
}

// ==========================================================
// FUNCIÓN: enviar el mensaje del usuario a n8n
// ==========================================================
// "async function" significa que esta función puede "esperar"
// (await) tareas que tardan tiempo, como pedir datos por internet,
// sin congelar el resto de la página mientras espera.
async function sendMessageToAgent(message) {
  showTyping();

  try {
    // fetch() envía una solicitud HTTP. "POST" significa que estamos
    // enviando datos (el mensaje), no solo pidiéndolos.
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mensaje: message })
    });

    if (!response.ok) {
      // Si el servidor respondió con un error (ej: 404, 500)
      throw new Error("El servidor respondió con un error: " + response.status);
    }

    const data = await response.json();

    hideTyping();
    // Ajustaremos "data.respuesta" según el formato exacto que
    // devuelva nuestro workflow de n8n en la Fase 6.
    addMessage(data.respuesta, "bot");

  } catch (error) {
    // Si algo falla (sin internet, el webhook no existe todavía, etc.)
    // mostramos un mensaje amigable en vez de dejar el chat "colgado".
    hideTyping();
    addMessage(
      "Lo siento, no pude conectarme en este momento. Por favor intenta de nuevo en unos segundos.",
      "bot"
    );
    console.error("Error al conectar con el agente:", error);
  }
}

// ==========================================================
// EVENTO: cuando el usuario envía el formulario
// ==========================================================
chatForm.addEventListener("submit", function (event) {
  // Evita que el formulario recargue la página (comportamiento
  // por defecto del HTML que no queremos aquí).
  event.preventDefault();

  const message = userInput.value.trim();
  if (message === "") return;

  addMessage(message, "user");
  userInput.value = "";

  sendMessageToAgent(message);
});

// ==========================================================
// MENSAJE DE BIENVENIDA (se muestra al cargar la página)
// ==========================================================
window.addEventListener("DOMContentLoaded", function () {
  addMessage(
    "Hola, soy ShopMind AI. ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre productos, envíos, pagos, devoluciones y más.",
    "bot"
  );
});
