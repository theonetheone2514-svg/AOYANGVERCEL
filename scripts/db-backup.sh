#!/usr/bin/env bash
set -euo pipefail

# Database backup script for webtea-next
# Usage: bash scripts/db-backup.sh [output-dir]
# Requires: Supabase CLI (supabase) or pg_dump

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$OUTPUT_DIR"

# Option 1: Supabase CLI (recommended)
if command -v supabase &>/dev/null; then
  echo "Using Supabase CLI..."
  supabase db dump -f "$OUTPUT_DIR/backup_$TIMESTAMP.sql"
  echo "Backup saved: $OUTPUT_DIR/backup_$TIMESTAMP.sql"

# Option 2: pg_dump (requires DATABASE_URL)
elif [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Using pg_dump..."
  pg_dump --no-owner --no-acl "$DATABASE_URL" \
    > "$OUTPUT_DIR/backup_$TIMESTAMP.sql"
  echo "Backup saved: $OUTPUT_DIR/backup_$TIMESTAMP.sql"

else
  echo "ERROR: No backup method available."
  echo ""
  echo "  Install Supabase CLI: https://supabase.com/docs/guides/cli"
  echo "  Or set DATABASE_URL env var with your connection string."
  echo ""
  echo "  Supabase connection string can be found in:"
  echo "  Project Settings → Database → Connection string (URI)"
  exit 1
fi

# Compress
gzip "$OUTPUT_DIR/backup_$TIMESTAMP.sql"
echo "Compressed: $OUTPUT_DIR/backup_$TIMESTAMP.sql.gz"
echo "Done."
