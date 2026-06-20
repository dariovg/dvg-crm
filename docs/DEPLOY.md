# Despliegue automático Git → Vercel

Guía para que cada push a `main` despliegue de forma fiable en **crm.dvgsstudio.com** (plan Hobby).

## Arquitectura recomendada

| Rama | Vercel | Dominio |
|------|--------|---------|
| `main` | Production | `crm.dvgsstudio.com` |
| `staging` (opcional) | Preview con alias | `staging.crm.dvgsstudio.com` |
| PR / otras ramas | Preview automático | `*.vercel.app` |

## Checklist — conectar GitHub a Vercel

1. **Repositorio en GitHub** con la rama `main` actualizada.
2. Vercel → **Add New Project** → importa `dvg-crm` (o Settings → Git si ya existe).
3. **Production Branch** = `main`.
4. **Build Command**: `prisma generate && next build` (ya en `vercel.json`).
5. Variables de entorno en **Production** (ver `.env.example` y `SETUP-TU-PARTE.md`):
   - `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
   - `CRM_ADMIN_*`, `CRM_INGEST_SECRET`, `CRON_SECRET`
   - Opcional: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
6. Tras el primer deploy, ejecuta en local (una vez): `npx prisma db push` + seed admin contra la RDS de prod.

## Webhook y fiabilidad

Vercel crea un webhook en GitHub al conectar el repo (`repository_dispatch` / push events).

**Verificar que funciona:**

1. GitHub → repo → **Settings → Webhooks** → webhook de Vercel → *Recent Deliveries* (respuesta `200`).
2. Vercel → proyecto → **Deployments** → el último commit de `main` aparece como *Production*.
3. Push de prueba:
   ```bash
   git commit --allow-empty -m "chore: probe deploy webhook"
   git push origin main
   ```
4. Comprueba que el deployment pasa a **Ready** y `https://crm.dvgsstudio.com/api/health` responde `{ "ok": true, ... }`.

**Si el deploy no se dispara:**

| Síntoma | Acción |
|---------|--------|
| Sin webhook en GitHub | Vercel → Settings → Git → Disconnect / Reconnect |
| Webhook 4xx/5xx | Reconectar repo; revisar permisos de la app Vercel en GitHub |
| Build falla | Vercel → Deployment → *Build Logs*; reproducir con `npm run build` en local |
| Cron no corre | Plan Hobby: máx. 1 cron/día por job; `vercel.json` ya define 3 (límite del plan) |
| Dominio no actualiza | Settings → Domains → `crm.dvgsstudio.com` asignado a Production |

## Deploy manual (fallback)

Si el webhook falla temporalmente:

```bash
cd ~/Documents/dvg-crm
vercel deploy --prod
```

Requiere `vercel login` y enlace previo (`vercel link`).

## CI en GitHub (sin deploy)

El workflow `.github/workflows/ci.yml` ejecuta en cada PR/push:

- Tests unitarios (`npm run test:unit`)
- `npm run build`
- E2E smoke con Playwright (`npm run test:e2e`)

No despliega a Vercel; el deploy sigue siendo responsabilidad del webhook de Vercel o `vercel deploy --prod`.

## Crons en producción

`vercel.json` registra 3 crons diarios. Vercel inyecta `Authorization: Bearer <CRON_SECRET>`.

Asegúrate de que `CRON_SECRET` está definido en Production. Sin él, las rutas `/api/cron/*` responden `503` en producción.

## Post-deploy

1. `GET https://crm.dvgsstudio.com/api/health` → `200` y `"database": "up"`.
2. Login manual con usuario admin.
3. (Opcional) Configura monitor de uptime apuntando a `/api/health` — ver [MONITORING.md](./MONITORING.md).
