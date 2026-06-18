# DVG CRM — pasos que solo tú debes ejecutar

El código del CRM y la conexión con la web ya están listos. Sigue estos pasos en orden.

---

## Paso 1 — Crear base PostgreSQL en AWS RDS (~15 min)

1. Entra en [AWS Console → RDS](https://console.aws.amazon.com/rds/)
2. **Create database**
3. Opciones recomendadas:
   - **Standard create**
   - Engine: **PostgreSQL 16**
   - Template: **Free tier** (o Production si prefieres)
   - DB instance: `db.t4g.micro` (suficiente al inicio)
   - Identifier: `dvg-crm`
   - Master username: `dvgcrm`
   - Master password: *(guárdala bien)*
   - Database name: `dvgcrm`
   - **Public access: Yes** (necesario para Vercel sin VPC)
   - VPC security group: crea uno nuevo
4. Cuando esté **Available**, abre el security group y añade regla **Inbound**:
   - Type: PostgreSQL
   - Port: 5432
   - Source: `0.0.0.0/0`  
   *(Vercel no tiene IP fija; la conexión va con SSL + contraseña fuerte)*
5. Copia el **Endpoint** y monta la URL:

```
postgresql://dvgcrm:TU_PASSWORD@ENDPOINT.rds.amazonaws.com:5432/dvgcrm?sslmode=require
```

---

## Paso 2 — Login del CRM (email + contraseña)

No hace falta Google OAuth.

1. Genera el hash de la contraseña (solo en terminal, no la guardes en git):

```bash
cd ~/Documents/dvg-crm
CRM_ADMIN_PASSWORD='Informatica97' node scripts/seed-admin.js
```

2. Copia `CRM_ADMIN_PASSWORD_HASH` a Vercel.

Variables en Vercel (proyecto CRM):

| Variable | Valor |
|----------|--------|
| `CRM_ADMIN_EMAIL` | `info@dvgsstudio.com` |
| `CRM_ADMIN_PASSWORD_HASH` | hash bcrypt (del script) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://crm.dvgsstudio.com` |

Tras `db:push`, ejecuta el seed para guardar el usuario en la base de datos.

---

## Paso 3 — Generar secretos

En terminal (cualquier máquina):

```bash
openssl rand -base64 32
```

Usa el resultado para:
- `NEXTAUTH_SECRET` (CRM)
- `CRM_INGEST_SECRET` (CRM **y** landing — **misma clave en ambos**)

---

## Paso 4 — Desplegar CRM en Vercel (~10 min)

1. Sube el repo a GitHub:
   ```bash
   cd ~/Documents/dvg-crm
   git remote add origin https://github.com/TU_USUARIO/dvg-crm.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New Project** → importa `dvg-crm`
3. Variables de entorno en Vercel (proyecto CRM):

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | URL del paso 1 |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` |
| `NEXTAUTH_SECRET` | del paso 3 |
| `CRM_ADMIN_EMAIL` | `info@dvgsstudio.com` |
| `CRM_ADMIN_PASSWORD_HASH` | del paso 2 |
| `CRM_INGEST_SECRET` | del paso 3 |

4. Deploy
5. En local (una vez) crea las tablas:
   ```bash
   cd ~/Documents/dvg-crm
   cp .env.example .env.local
   # edita .env.local con DATABASE_URL y CRM_ADMIN_PASSWORD_HASH
   npx prisma db push
   CRM_ADMIN_PASSWORD='tu-pass' node scripts/seed-admin.js
   ```

---

## Paso 5 — Conectar la web (landing) al CRM (~5 min)

En **Vercel → proyecto dvg-studio-landing → Environment Variables**:

| Variable | Valor |
|----------|--------|
| `CRM_API_URL` | `https://tu-proyecto.vercel.app` |
| `CRM_INGEST_SECRET` | la misma clave del paso 3 |

Redeploy la landing.

---

## Paso 6 — Probar

1. Abre `https://tu-proyecto.vercel.app` → login con email y contraseña
2. En la web, pide una guía de planes con un email de prueba
3. En el CRM → **Leads** debe aparecer el contacto
4. Gmail: sigues recibiendo aviso en `BOOKING_NOTIFY_EMAIL` (configuración actual)

---

## Opcional — Dominio `crm.dvgsstudio.com`

1. Vercel → proyecto CRM → Settings → Domains → añade `crm.dvgsstudio.com`
2. En tu DNS (donde gestionas dvgsstudio.com), CNAME:
   - `crm` → `cname.vercel-dns.com`
3. Actualiza `NEXTAUTH_URL` a `https://crm.dvgsstudio.com`

---

## Resumen de qué hace cada sistema

| Acción del visitante | Gmail (aviso) | CRM |
|---------------------|-----------------|-----|
| Pide guía (email) | ✓ | Lead nuevo |
| Agenda reunión | ✓ | Lead + cita + teléfono |
| Encuesta madurez | ✓ | Lead + respuestas |

---

## Si algo falla

- **No puedo entrar al CRM:** revisa `CRM_ADMIN_EMAIL` y `CRM_ADMIN_PASSWORD_HASH` en Vercel
- **Leads no aparecen:** revisa `CRM_API_URL` y que `CRM_INGEST_SECRET` sea igual en landing y CRM
- **Error de base de datos:** security group RDS puerto 5432 abierto + `sslmode=require`
- **Demasiados intentos:** espera 15 min o revisa bloqueo de cuenta (10 fallos = 30 min)

---

¿Dudas? Pásame captura del error de Vercel o de `/api/auth` y lo vemos.
