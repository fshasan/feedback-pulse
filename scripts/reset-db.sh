#!/bin/bash

# Reset and migrate database script
# This script drops the feedback table and recreates it with the latest schema

echo "⚠️  WARNING: This will DELETE ALL DATA in the feedback table!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "Resetting local database..."
npx wrangler d1 execute feedback-db --local --command "DROP TABLE IF EXISTS feedback"
npx wrangler d1 execute feedback-db --local --command "DROP TABLE IF EXISTS d1_migrations"

echo "Applying migrations to local database..."
npx wrangler d1 migrations apply feedback-db --local

echo ""
echo "✅ Local database reset and migrated successfully!"
echo ""
echo "To reset remote database, run:"
echo "  npx wrangler d1 execute feedback-db --remote --command 'DROP TABLE IF EXISTS feedback'"
echo "  npx wrangler d1 execute feedback-db --remote --command 'DROP TABLE IF EXISTS d1_migrations'"
echo "  npx wrangler d1 migrations apply feedback-db --remote"
