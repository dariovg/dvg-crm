# Backups PostgreSQL (AWS RDS)

Estrategia en dos capas: **snapshots automáticos de RDS** (AWS) + **volcados lógicos opcionales** (`pg_dump`).

## Capa 1 — RDS automated backups (recomendado, sin código)

AWS guarda snapshots continuos mientras la instancia está activa.

1. AWS Console → **RDS** → instancia `dvg-crm` → **Modify**
2. **Backup**:
   - *Backup retention period*: **7–35 días** (7 mínimo recomendado)
   - *Backup window*: horario de baja actividad (ej. 03:00–04:00 UTC)
   - *Copy tags to snapshots*: Yes
3. **Maintenance** → elige ventana distinta a backups si es posible.
4. Guarda cambios (*Apply immediately* o en ventana de mantenimiento).

**Restaurar desde snapshot:**

1. RDS → Snapshots → selecciona snapshot → **Restore snapshot**
2. Nueva instancia con endpoint distinto → actualiza `DATABASE_URL` en Vercel → redeploy
3. O restaura sobre instancia de prueba para auditoría

**Point-in-time recovery (PITR):** disponible con backups automáticos; en la consola RDS → *Restore to point in time*.

## Capa 2 — Volcado lógico con pg_dump (script local / cron)

El script `scripts/backup-db.sh` genera un `.sql.gz` portable (útil para migraciones o archivo off-site).

### Requisitos

- Cliente PostgreSQL: `pg_dump` en PATH  
  macOS: `brew install libpq && brew link --force libpq`
- Variable `DATABASE_URL` (misma que Vercel, con `sslmode=require` para RDS)

### Uso manual

```bash
cd ~/Documents/dvg-crm
chmod +x scripts/backup-db.sh

DATABASE_URL='postgresql://dvgcrm:PASS@endpoint.rds.amazonaws.com:5432/dvgcrm?sslmode=require' \
  ./scripts/backup-db.sh
```

Salida por defecto: `./backups/dvg-crm-YYYYMMDD-HHMMSS.sql.gz`

Opciones:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `BACKUP_DIR` | `./backups` | Carpeta destino |
| `RETENTION_DAYS` | `14` | Borra volcados más antiguos |

### Cron en tu Mac / servidor (opcional)

```cron
# Diario 04:30 UTC — ajusta ruta y DATABASE_URL en ~/.dvg-crm-backup.env
30 4 * * * set -a && . ~/.dvg-crm-backup.env && set +a && /Users/dariovg/Documents/dvg-crm/scripts/backup-db.sh >> ~/backups/dvg-crm.log 2>&1
```

**No guardes `DATABASE_URL` en el repo.** Usa un fichero fuera de git con permisos `600`.

### Subir a S3 (manual)

```bash
aws s3 cp backups/dvg-crm-*.sql.gz s3://TU-BUCKET/dvg-crm-backups/ --sse AES256
```

Automatización S3 + lifecycle rules queda para Block 8 si se necesita.

## Qué NO incluye este repo

- Credenciales AWS en git
- Lambda/cron en AWS para pg_dump (posible mejora futura)
- Cifrado adicional del `.sql.gz` (usa `gpg` local si lo necesitas)

## Verificación

```bash
gzip -t backups/dvg-crm-*.sql.gz
# Restaurar en DB vacía de prueba:
# gunzip -c backups/dvg-crm-....sql.gz | psql "$TEST_DATABASE_URL"
```

## Checklist rápido

- [ ] Retención RDS ≥ 7 días
- [ ] Ventana de backup configurada
- [ ] Probar restore en instancia de prueba (una vez al trimestre)
- [ ] (Opcional) Cron local con `backup-db.sh` + copia S3
