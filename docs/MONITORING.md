# Monitorización — Sentry y uptime

## Health check (`/api/health`)

Endpoint público para load balancers y monitores externos.

```bash
curl -s https://crm.dvgsstudio.com/api/health | jq
```

Respuesta OK:

```json
{
  "ok": true,
  "version": "0.1.0",
  "database": "up",
  "timestamp": "2026-06-20T12:00:00.000Z",
  "service": "dvg-crm"
}
```

- `503` si la base de datos no responde (`"database": "down"`)
- Sin autenticación; no expone secretos

## Uptime externo (manual)

Configura un monitor HTTP en el servicio que prefieras:

| Servicio | URL a vigilar | Intervalo |
|----------|---------------|-----------|
| [UptimeRobot](https://uptimerobot.com) (free) | `https://crm.dvgsstudio.com/api/health` | 5 min |
| [Better Stack](https://betterstack.com/uptime) | mismo | 3 min |
| Vercel → Observability | dominio raíz o `/login` | incluido en Pro |

**Alertas sugeridas:**

- Status ≠ 200 durante 2 comprobaciones seguidas
- Keyword check: `"ok":true` en el body (opcional)
- Notificación: email + Slack

También puedes vigilar la landing y el endpoint de ingest por separado (Block 8).

## Sentry (errores de aplicación)

Integración opcional vía `@sentry/nextjs`. Sin DSN, Sentry no se activa.

### 1. Crear proyecto

1. [sentry.io](https://sentry.io) → New Project → **Next.js**
2. Copia el **DSN**

### 2. Variables en Vercel

| Variable | Entorno | Uso |
|----------|---------|-----|
| `SENTRY_DSN` | Production (+ Preview si quieres) | Servidor, edge, instrumentación |
| `NEXT_PUBLIC_SENTRY_DSN` | Production | Errores en el navegador (mismo DSN) |

Opcional (subida de source maps en CI):

| Variable | Uso |
|----------|-----|
| `SENTRY_AUTH_TOKEN` | Token de org con scope `project:releases` |
| `SENTRY_ORG` | Slug de la org |
| `SENTRY_PROJECT` | Slug del proyecto |

Sin auth token, los errores se reportan pero los stack traces en prod pueden ser menos legibles.

### 3. Verificar

Tras redeploy, provoca un error de prueba en staging (no en prod) o revisa Sentry → *Issues* tras un error real.

El componente `app/global-error.jsx` envía excepciones de React al cliente si `NEXT_PUBLIC_SENTRY_DSN` está definido.

## Crons y alertas existentes

- Crons diarios en `vercel.json` (Hobby: 1 ejecución/día por job)
- `/api/cron/marketing-alerts` puede enviar a Slack (`SLACK_WEBHOOK_URL`) y email SMTP

Revisa Vercel → **Logs** y **Cron Jobs** si un job falla repetidamente.

## Runbook rápido

| Alerta | Acción |
|--------|--------|
| Health 503 | RDS security group, `DATABASE_URL`, estado instancia AWS |
| Health 200 pero login falla | `NEXTAUTH_*`, usuarios en DB |
| Sentry spike | Deployment reciente → rollback en Vercel |
| Uptime caído, health OK | DNS / CDN — revisar dominio en Vercel |
