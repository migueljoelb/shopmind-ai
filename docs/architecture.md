# Arquitectura de ShopMind AI

Este documento describe cómo viaja la información dentro del sistema, desde que el cliente escribe un mensaje hasta que recibe una respuesta generada por el agente.

## Diagrama de flujo

```
Usuario
  |
  v
Interfaz web (HTML / CSS / JavaScript)
  |
  v
Webhook (n8n)
  |
  v
AI Agent (n8n)
  |
  v
Modelo de lenguaje (Cohere Command R+)
  |
  v
Herramienta de busqueda vectorial (Supabase / pgvector)
  |
  v
Respuesta generada
  |
  v
Interfaz web
  |
  v
Usuario
```

## Descripcion de cada etapa

### 1. Usuario

El cliente escribe una pregunta en el campo de texto del chat, disponible en la pagina web de la tienda.

### 2. Interfaz web

El archivo `frontend/js/script.js` captura el mensaje, lo muestra en pantalla y lo envia mediante una peticion HTTP de tipo POST al Webhook de n8n. Junto con el mensaje se envia un identificador de sesion (`sessionId`), generado y almacenado en el navegador del cliente mediante `sessionStorage`, utilizado posteriormente para dar continuidad a la conversacion.

### 3. Webhook (n8n)

Es el punto de entrada del backend de automatizacion. Expone una URL publica que recibe las peticiones POST del frontend y dispara la ejecucion del workflow principal.

### 4. AI Agent

Nodo central del workflow, encargado de:

- Recibir el mensaje del cliente y el historial de la conversacion.
- Aplicar las instrucciones de comportamiento definidas en su configuracion (personalidad, reglas de negocio, restriccion de dominio de conversacion).
- Decidir, de forma autonoma, si es necesario consultar la base de conocimiento antes de responder.
- Generar la respuesta final utilizando el modelo de lenguaje conectado.

### 5. Modelo de lenguaje (Cohere Command R+)

Modelo conversacional responsable de interpretar el mensaje del cliente y redactar la respuesta en lenguaje natural, ya sea con conocimiento general o incorporando la informacion recuperada de la base de conocimiento.

### 6. Herramienta de busqueda vectorial (Supabase / pgvector)

Cuando el AI Agent determina que la pregunta requiere informacion especifica de la tienda, consulta esta herramienta. El texto de la pregunta se convierte en un vector mediante un modelo de embeddings (Cohere `embed-english-v3.0`), y se compara contra los vectores almacenados en la tabla `documents` de Supabase para identificar los fragmentos de documentacion mas relevantes. Estos fragmentos se incorporan como contexto antes de generar la respuesta final, lo que constituye el patron de Retrieval-Augmented Generation (RAG) y reduce significativamente el riesgo de que el modelo genere informacion incorrecta o inventada.

### 7. Respuesta generada

El AI Agent devuelve la respuesta al nodo Webhook mediante un nodo de tipo Respond to Webhook, que construye una respuesta JSON con la estructura `{ "respuesta": "..." }`.

### 8. Interfaz web y Usuario

El frontend recibe la respuesta, la muestra en el chat como un mensaje del asistente, y oculta el indicador de "escribiendo...".

## Workflows de n8n

El proyecto se compone de dos workflows independientes:

### ShopMind AI - Agente Principal

Contiene el flujo descrito anteriormente: Webhook, AI Agent (con Chat Model, Memory y Tool conectados) y Respond to Webhook. Es el workflow que atiende las conversaciones en tiempo real y permanece publicado (activo) de forma continua.

### ShopMind AI - Carga de documentos

Workflow independiente, de ejecucion manual, responsable de poblar la base de conocimiento. Su flujo es el siguiente:

```
Disparador manual
  -> Lista de documentos (nodo Code)
  -> Descarga de contenido (HTTP Request)
  -> Fragmentacion e indexacion (Supabase Vector Store, modo Insert Documents)
```

Se ejecuta unicamente cuando se actualiza alguno de los documentos de `docs/knowledge-base/`.

## Memoria de conversacion

El AI Agent utiliza un nodo de memoria (Simple Memory) configurado con el `sessionId` recibido desde el frontend como clave de sesion. Esto permite que el agente mantenga contexto entre mensajes de una misma conversacion, sin mezclar el historial de distintos usuarios. La memoria se almacena localmente en la instancia de n8n y se limita a las ultimas interacciones definidas en la configuracion del nodo.

## Seguridad y control de acceso

- Las credenciales de los servicios externos (Cohere, Supabase) se gestionan como credenciales cifradas dentro de n8n, sin exponerse en el codigo del frontend ni en el repositorio.
- El Webhook tiene habilitado el encabezado CORS (`Allowed Origins: *`) para permitir su consumo desde el dominio del frontend durante la etapa de desarrollo y evaluacion del proyecto.
