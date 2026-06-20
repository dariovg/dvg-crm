#!/usr/bin/env bash
# Volcado lógico de PostgreSQL (AWS RDS u otro) con pg_dump.
# Uso:
#   DATABASE_URL='postgresql://...' ./scripts/backup-db.sh
#   BACKUP_DIR=~/backups/dvg-crm RETENTION_DAYS=14 ./scripts/backup-db.sh
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Define DATABASE_URL (postgresql://usuario:pass@host:5432/dvgcrm?sslmode=require)" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Instala el cliente PostgreSQL (pg_dump). macOS: brew install libpq && brew link --force libpq" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date -u +"%Y%m%d-%H%M%S")"
mkdir -p "$BACKUP_DIR"

OUT_FILE="$BACKUP_DIR/dvg-crm-${STAMP}.sql.gz"
echo "Backup → $OUT_FILE"

pg_dump "$DATABASE_URL" --no-owner --no-acl --format=plain | gzip -9 > "$OUT_FILE"

BYTES="$(wc -c < "$OUT_FILE" | tr -d ' ')"
echo "OK (${BYTES} bytes comprimidos)"

if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && [[ "$RETENTION_DAYS" -gt 0 ]]; then
  find "$BACKUP_DIR" -name 'dvg-crm-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete
  echo "Retención: eliminados volcados > ${RETENTION_DAYS} días"
fi
