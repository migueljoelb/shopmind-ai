# ShopMind AI

- **Repositorio:** https://github.com/migueljoelb/shopmind-ai
- **Demo en producción:** https://shopmind-ai-migueljoelb.netlify.app
- **Autor:** Miguel Joel Brito ([@migueljoelb](https://github.com/migueljoelb))

---

Agente conversacional de inteligencia artificial para tiendas de comercio electrónico, desarrollado como Proyecto Final del Challenge Alura + Oracle Next Education (ONE).

## Preguntas sugeridas para evaluar el agente

Para facilitar la revisión, se recomienda iniciar la prueba del chat con las siguientes preguntas, ya que evidencian el uso de la base de conocimiento (RAG) y la memoria de conversación. Posteriormente, se puede probar con cualquier otra pregunta libre.

1. **"¿Cuántos días tengo para devolver un producto?"** — responde con el plazo exacto (30 días) tomado directamente de la política de reembolsos.
2. **"¿Cuánto cuesta la Laptop UltraSlim 14?"** — responde con el precio real registrado en el catálogo de productos.
3. **"Si devuelvo un producto, ¿también me devuelven lo que pagué de envío?"** — combina información de dos documentos distintos (política de reembolsos y guía de envíos) para dar una respuesta precisa.

---

## Descripción del proyecto

ShopMind AI es un asistente virtual capaz de mantener conversaciones con clientes de una tienda en línea, resolviendo dudas sobre productos, envíos, pagos, devoluciones, políticas y preguntas frecuentes. El agente utiliza un modelo de lenguaje de gran escala combinado con una base de conocimiento propia mediante la técnica de Retrieval-Augmented Generation (RAG), lo que le permite responder con información real y verificada de la tienda en lugar de generar respuestas basadas únicamente en conocimiento general.

El backend de automatización e inteligencia artificial está construido íntegramente en n8n, sin necesidad de un servidor backend tradicional.

## Características

- Interfaz de chat web responsive, sin dependencias de frameworks externos.
- Respuestas generadas por un modelo de lenguaje conversacional (Cohere Command R+).
- Base de conocimiento vectorial (RAG) construida a partir de documentación oficial de la tienda, alojada en Supabase con la extensión pgvector.
- Memoria de conversación por sesión de usuario, mediante identificadores de sesión generados en el cliente.
- Comportamiento acotado al dominio de la tienda: el agente evita responder temas ajenos al negocio y declara honestamente cuando no dispone de información suficiente.
- Indicador de estado "escribiendo..." y manejo de errores de red en la interfaz.
- Arquitectura separada entre el flujo de atención al cliente y el flujo de ingesta de documentos.

## Arquitectura

El sistema sigue el siguiente flujo de datos:

```
Usuario
  -> Interfaz web (HTML / CSS / JavaScript)
  -> Webhook (n8n)
  -> AI Agent (n8n)
  -> Modelo de lenguaje (Cohere Command R+)
  -> Herramienta de búsqueda vectorial (Supabase / pgvector)
  -> Respuesta generada
  -> Interfaz web
  -> Usuario
```

El flujo se compone de dos workflows independientes en n8n:

1. **ShopMind AI - Agente Principal.** Recibe los mensajes del cliente mediante un Webhook, los procesa con un AI Agent que dispone de un modelo de lenguaje, memoria de conversación y una herramienta de búsqueda documental, y devuelve la respuesta al cliente.
2. **ShopMind AI - Carga de documentos.** Workflow de ejecución manual, encargado de leer los documentos Markdown de la base de conocimiento, dividirlos en fragmentos, generar sus representaciones vectoriales (embeddings) e insertarlos en la base de datos de Supabase. Se ejecuta únicamente cuando la documentación de la tienda se actualiza.

Documentación gráfica adicional de la arquitectura disponible en [`docs/architecture.md`](docs/architecture.md).

## Tecnologías utilizadas

| Componente | Tecnología | Justificación |
|---|---|---|
| Interfaz de usuario | HTML5, CSS3, JavaScript (vainilla) | Sin dependencias externas, despliegue simple como sitio estático. |
| Automatización / backend | n8n (n8n Cloud) | Permite construir la lógica del agente mediante flujos visuales, sin mantener un servidor propio. |
| Modelo de lenguaje | Cohere (Command R+) | Se evaluó inicialmente Google Gemini; se migró a Cohere por presentar límites de cuota gratuita más generosos y estables durante las pruebas del proyecto (ver sección de decisiones técnicas). |
| Embeddings | Cohere (embed-english-v3.0) | Modelo de embeddings del mismo proveedor que el modelo de lenguaje, con límites de uso independientes. |
| Reranking | Cohere (rerank-v3.5) | Segunda etapa de la búsqueda documental, para mejorar la precisión ante consultas que combinan varios temas a la vez. |
| Base de conocimiento | Documentos Markdown | Formato de texto plano, fácil de versionar y fragmentar para su indexación. |
| Base de datos vectorial | Supabase (PostgreSQL + pgvector) | Nivel gratuito suficiente para el proyecto e incluye base de datos relacional y vectorial en un mismo servicio. |
| Hosting del frontend | Netlify | Despliegue continuo desde GitHub sin requerir verificación con tarjeta de crédito. |

### Decisiones técnicas relevantes

**Migración de Google Gemini a Cohere.** La integración del modelo de lenguaje se implementó inicialmente con Google Gemini (`gemini-2.5-flash`). Durante el ciclo de pruebas de integración se identificó que el nivel gratuito de Gemini impone un límite de 20 solicitudes diarias por modelo (RPD), insuficiente para las necesidades de prueba y demostración del proyecto. Se migró la integración completa —modelo de lenguaje y modelo de embeddings— a Cohere, cuyo nivel de prueba permite 1,000 solicitudes mensuales con un límite de 20 solicitudes por minuto (RPM), resultando más adecuado para este caso de uso.

**Uso de un modelo de reranking.** Se identificó que, ante consultas que combinan dos o más temas distintos (por ejemplo, política de devoluciones y costos de envío en una misma pregunta), la búsqueda por similitud vectorial simple no siempre recuperaba el fragmento más relevante entre los primeros resultados. Se incorporó un modelo de reranking (Cohere `rerank-v3.5`) como segunda etapa de la búsqueda documental, reordenando los fragmentos candidatos según su relevancia específica respecto a la consulta completa, lo que mejoró la precisión de las respuestas en este tipo de casos.

**Elección de Netlify sobre Oracle Cloud.** Se consideró desplegar el frontend en Oracle Cloud Infrastructure, dado que el challenge está patrocinado por Oracle. Sin embargo, el registro en Oracle Cloud Free Tier requiere una tarjeta de crédito o débito válida como método de verificación de identidad, requisito que no se pudo cumplir. Se optó por Netlify, que no requiere método de pago para su nivel gratuito y resulta suficiente para el alcance de este proyecto.

## Estructura del repositorio

```
shopmind-ai/
├── README.md
├── LICENSE
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/script.js
│   └── assets/
├── docs/
│   ├── architecture.md
│   └── knowledge-base/
│       ├── politica-privacidad.md
│       ├── politica-reembolsos.md
│       ├── faq.md
│       ├── guia-envios.md
│       └── terminos-condiciones.md
├── n8n/
│   └── README.md
└── assets/
    └── screenshots/
```

### Requisitos previos

- Cuenta de n8n (n8n Cloud o instancia propia).
- Cuenta de Supabase.
- Clave de API de Cohere.
- Cuenta de GitHub y de Netlify (para el despliegue del frontend).

### 1. Base de datos vectorial (Supabase)

Ejecutar en el SQL Editor de Supabase el script de creación de la tabla `documents` y la función `match_documents`, disponible en la documentación del proyecto.

### 2. Workflows de n8n

Importar en n8n los dos workflows del proyecto:

- `ShopMind AI - Agente Principal`
- `ShopMind AI - Carga de documentos`

Configurar las credenciales de Cohere y Supabase en los nodos correspondientes. Ejecutar manualmente el workflow de carga de documentos para poblar la base de conocimiento antes del primer uso.

Activar (publicar) el workflow principal y copiar la URL de producción del nodo Webhook.

### 3. Frontend

En el archivo `frontend/js/script.js`, sustituir el valor de la constante `N8N_WEBHOOK_URL` por la URL de producción obtenida en el paso anterior.

### 4. Despliegue

Conectar el repositorio a Netlify, configurando `frontend` como directorio de publicación (Publish directory), sin comando de build.

## Uso

Acceder a la URL pública del sitio desplegado y escribir una consulta en el campo de texto del chat. El asistente responderá utilizando la información contenida en la base de conocimiento de la tienda.

## Consideraciones de seguridad

- Las claves de API (Cohere, Supabase) se gestionan exclusivamente como credenciales dentro de n8n y no se exponen en el código del frontend.
- El archivo `.gitignore` excluye archivos de variables de entorno del control de versiones.
- El acceso al Webhook mediante CORS se configuró de forma abierta (`*`) para fines de desarrollo y evaluación. En un entorno de producción real se recomienda restringir el encabezado `Access-Control-Allow-Origin` al dominio específico del frontend.

## Limitaciones conocidas

- El nivel gratuito de Cohere impone límites de solicitudes por minuto y por mes; un volumen de uso elevado podría requerir una actualización de plan.
- La memoria de conversación se almacena localmente en la instancia de n8n y no está diseñada para escenarios de alta concurrencia o múltiples instancias en paralelo.
- El proyecto no implementa autenticación de usuarios; la identificación de sesión se basa en un identificador generado en el navegador del cliente.

## Mejoras futuras

- Implementación de un mecanismo de reintento con espera progresiva ante límites de tasa de la API del modelo de lenguaje.
- Panel de administración para actualizar la base de conocimiento sin ejecutar manualmente el workflow de ingesta.
- Soporte multilenguaje explícito en la interfaz de usuario.
- Sistema de valoración de la conversación por parte del cliente.


<img width="490" height="674" alt="image" src="https://github.com/user-attachments/assets/3f2a25e7-fde9-4ff6-89d6-097aa166cb0d" />



## Licencia

Este proyecto se distribuye bajo los términos de la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.
