#!/usr/bin/env bash
#
# Open a psql shell inside the local CRM Postgres Docker container.
#
# This connects to Postgres INSIDE the container (via docker exec), so it works
# regardless of which host port the container is published on (5432, 5455, ...).
# No host psql client needed and no port confusion.
#
#   Usage:
#     ./scripts/crm-psql.sh                 # interactive psql shell
#     ./scripts/crm-psql.sh -c "SELECT 1;"  # run a one-off query and exit
#     ./scripts/crm-psql.sh '\dt'           # list tables
#
set -euo pipefail

CONTAINER="${CRM_PG_CONTAINER:-jarcube-crm-pg}"
DB="${CRM_PG_DB:-jarcube_crm}"
USER="${CRM_PG_USER:-postgres}"

# Make sure the container is actually running before trying to exec into it.
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Error: container '$CONTAINER' is not running." >&2
  echo "Running Postgres containers:" >&2
  docker ps --filter 'ancestor=postgres' --format '  {{.Names}}  {{.Ports}}' >&2 || true
  echo "Set CRM_PG_CONTAINER=<name> to override." >&2
  exit 1
fi

# -it gives an interactive terminal for the psql shell. Any extra args ($@) are
# passed straight to psql, e.g. -c "SELECT ...".
exec docker exec -it "$CONTAINER" psql -U "$USER" -d "$DB" "$@"
