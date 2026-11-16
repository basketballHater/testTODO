#!/bin/sh
# Container start-up: make sure the app has a key, wait for MySQL, migrate, then run the server.
set -e

cd /var/www/html

# Generate an ephemeral key when none was supplied (set APP_KEY to keep it stable across restarts).
if [ -z "${APP_KEY:-}" ]; then
    APP_KEY="$(php artisan key:generate --show)"
    export APP_KEY
fi

echo "Waiting for the database and running migrations..."
attempts=0
until php artisan migrate --force; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
        echo "Database is not reachable after $attempts attempts, giving up." >&2
        exit 1
    fi
    echo "Database not ready yet (attempt $attempts), retrying in 2s..."
    sleep 2
done

if [ "${DB_SEED:-false}" = "true" ]; then
    php artisan db:seed --force
fi

exec "$@"
