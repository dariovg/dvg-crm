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

## Documentación de despliegue

**Lee [SETUP-TU-PARTE.md](./SETUP-TU-PARTE.md)** — pasos que solo tú debes hacer (AWS RDS, Google OAuth, Vercel).

## Integración con la web

La landing (`dvg-studio-landing`) envía eventos a:

- `POST /api/ingest/lead`
- `POST /api/ingest/booking`
- `POST /api/ingest/survey`

Header: `X-CRM-Ingest-Secret: <CRM_INGEST_SECRET>`
