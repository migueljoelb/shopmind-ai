# Workflows de n8n

Esta carpeta contiene la exportación de los dos workflows que conforman el backend de automatización de ShopMind AI.

## Archivos

| Archivo | Descripción |
|---|---|
| `agente-principal.json` | Workflow que atiende las conversaciones en tiempo real: Webhook, AI Agent (con Chat Model, Memory y herramienta de búsqueda vectorial) y Respond to Webhook. |
| `carga-documentos.json` | Workflow de ejecución manual que descarga los documentos de `docs/knowledge-base/`, los fragmenta y los indexa como vectores en Supabase. |

## Cómo importar estos workflows en tu propia instancia de n8n

1. Abre tu instancia de n8n (n8n Cloud o self-hosted).
2. Ve a **Workflows** → **Import from File**.
3. Selecciona el archivo `.json` correspondiente.
4. Una vez importado, es necesario reconfigurar manualmente las credenciales de los siguientes servicios, ya que por seguridad **no se incluyen** en el archivo exportado:
   - Cohere (modelo de lenguaje y modelo de embeddings)
   - Supabase (host y service role secret)

## Orden recomendado de configuración

1. Importar y configurar `carga-documentos.json`.
2. Ejecutarlo manualmente para poblar la tabla `documents` en Supabase.
3. Importar y configurar `agente-principal.json`.
4. Publicar (activar) el workflow del agente principal.
5. Copiar la URL de producción del nodo Webhook y configurarla en `frontend/js/script.js` (constante `N8N_WEBHOOK_URL`).

Para el detalle completo de la arquitectura y el propósito de cada nodo, ver [`docs/architecture.md`](../docs/architecture.md).
