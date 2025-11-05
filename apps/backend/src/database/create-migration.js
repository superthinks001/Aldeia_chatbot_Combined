#!/usr/bin/env node
/**
 * Create a new migration file
 * Usage: npm run migrate:create <migration_name>
 */

const fs = require('fs');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Error: Please provide a migration name');
  console.error('   Usage: npm run migrate:create <migration_name>');
  console.error('   Example: npm run migrate:create add_users_table');
  process.exit(1);
}

// Get migrations directory
const migrationsDir = path.join(__dirname, 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Get next migration number
const existingMigrations = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

const nextNumber = String(existingMigrations.length + 1).padStart(3, '0');
const fileName = `${nextNumber}_${migrationName}.sql`;
const filePath = path.join(migrationsDir, fileName);

// Create migration template
const template = `-- Migration: ${fileName}
-- Description: ${migrationName.replace(/_/g, ' ')}
-- Date: ${new Date().toISOString().split('T')[0]}
-- Author: Auto-generated

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Add your SQL statements here


-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================

-- Add rollback SQL statements here (commented out)
-- Example:
-- DROP TABLE IF EXISTS example_table;
`;

// Write the file
fs.writeFileSync(filePath, template, 'utf8');

console.log('✅ Created migration file:');
console.log(`   ${fileName}`);
console.log(`   Location: ${filePath}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Edit the migration file and add your SQL');
console.log('   2. Run: npm run migrate');
