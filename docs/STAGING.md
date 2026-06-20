# Entorno staging — staging.crm.dvgsstudio.com

Staging permite probar cambios antes de producción sin afectar a `crm.dvgsstudio.com`.

Con el **plan Hobby** de Vercel no hay entornos ilimitados ni crons en preview; staging se monta con **Preview Deployments** + rama dedicada + alias DNS opcional.

## Estrategia recomendada

1. Crea rama `staging` en GitHub y haz push periódico desde `main` o desarrolla directamente en `staging`.
2. Cada push a `staging` genera un **Preview Deployment** en Vercel.
3. Asigna el subdominio `staging.crm.dvgsstudio.com` a esa rama (alias de preview).

## Pasos en Vercel

1. **Settings → Git**
   - Production Branch: `main`
   - Preview Deployments: activados para todas las ramas (por defecto)

2. **Settings → Environment Variables** — duplica variables de Production en **Preview**:
   - `DATABASE_URL` — recomendado: **base RDS separada** o schema distinto (no usar prod real salvo lectura)
   - `NEXTAUTH_URL` = `https://staging.crm.dvgsstudio.com`
   - `NEXTAUTH_SECRET` — puede ser distinto de prod
   - `CRM_ADMIN_*`, `CRM_INGEST_SECRET`, `CRON_SECRET`
   - Credenciales de redes sociales: usa cuentas de prueba o déjalas vacías

3. **Settings → Domains**
   - Añade `staging.crm.dvgsstudio.com`
   - Asigna el dominio al entorno **Preview** y vincula la rama `staging`  
     (Vercel UI: *Edit* → branch `staging`)

4. Redeploy la rama `staging` tras cambiar variables.

## DNS

En el proveedor de `dvgsstudio.com`:

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | `staging.crm` | `cname.vercel-dns.com` |

(Vercel muestra el valor exacto al añadir el dominio.)

## Limitaciones Hobby

| Recurso | Production (`main`) | Preview / staging |
|---------|---------------------|-------------------|
| Crons (`vercel.json`) | Sí (máx. 1/día por job) | **No** en preview |
| Dominio custom | `crm.dvgsstudio.com` | Alias manual a rama |
| Blob / storage | Store de prod | Mismo store o uno de test |

Los crons de marketing **solo corren en Production**. En staging prueba publicación manual desde la UI.

## Flujo de trabajo

```bash
git checkout staging
git merge main   # o cherry-pick de features
git push origin staging
# Espera preview en Vercel → prueba en staging.crm.dvgsstudio.com
# Si OK:
git checkout main
git merge staging
git push origin main   # deploy prod vía webhook
```

## Comprobar staging

1. `https://staging.crm.dvgsstudio.com/login`
2. `https://staging.crm.dvgsstudio.com/api/health` → versión y DB
3. Usuario de prueba (seed en la base de staging, no prod)

## Alternativa sin dominio custom

Usa la URL automática de preview:

`https://dvg-crm-git-staging-TU_USUARIO.vercel.app`

Útil para PRs; el alias `staging.crm.*` es opcional pero recomendado para OAuth (`NEXTAUTH_URL` estable).
