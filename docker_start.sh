#!/bin/sh

echo "Running migrations (if any)..."
# npm run migration:run

echo "Starting the NestJS server..."
exec node dist/main.js
