# DVG CRM

Panel interno de leads para DVG Studio.

## Desarrollo local

```bash
cp .env.example .env.local
# Rellena variables
npm install
npx prisma db push
npm run dev
```

## Documentación

| Tema | Guía |
|------|------|
| Setup inicial (RDS, Vercel, OAuth) | [SETUP-TU-PARTE.md](./SETUP-TU-PARTE.md) |
| Deploy Git → Vercel | [docs/DEPLOY.md](./docs/DEPLOY.md) |
| Staging | [docs/STAGING.md](./docs/STAGING.md) |
| Backups PostgreSQL | [docs/BACKUPS.md](./docs/BACKUPS.md) |
| Sentry y uptime | [docs/MONITORING.md](./docs/MONITORING.md) |

## Tests

```bash
npm run test:unit          # RBAC y lógica sin DB
npm run test:e2e           # Playwright (arranca dev server si hace falta)
curl -s localhost:3000/api/health | jq
```

## Integración con la web

La landing (`dvg-studio-landing`) envía eventos a:

- `POST /api/ingest/lead`
- `POST /api/ingest/booking`
- `POST /api/ingest/survey`

Header: `X-CRM-Ingest-Secret: <CRM_INGEST_SECRET>`
