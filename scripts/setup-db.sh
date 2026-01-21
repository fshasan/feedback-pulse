#!/bin/bash

# Create D1 database (run this once to create the database)
echo "Creating D1 database..."
npx wrangler d1 create feedback-db

echo ""
echo "After creating the database, update the database_id in wrangler.jsonc with the ID shown above."
echo ""
echo "Then run migrations:"
echo "npx wrangler d1 migrations apply feedback-db --local"
