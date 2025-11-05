#!/usr/bin/env node
/**
 * Fix DATABASE_URL with URL-encoded password
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing DATABASE_URL in .env.merge\n');

// Read .env.merge
const envPath = path.join(__dirname, '.env.merge');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract current DATABASE_URL
const match = envContent.match(/DATABASE_URL=postgresql:\/\/postgres:(.+?)@(db\..+?):(\d+)\/(.+)/);

if (!match) {
  console.log('❌ Could not parse DATABASE_URL');
  process.exit(1);
}

const password = match[1];
const host = match[2];
const port = match[3];
const database = match[4];

console.log('Current configuration:');
console.log(`  Password (raw): ${password}`);
console.log(`  Host: ${host}`);
console.log(`  Port: ${port}`);
console.log(`  Database: ${database}`);

// URL encode the password
const encodedPassword = encodeURIComponent(password);

console.log(`\nURL-encoded password: ${encodedPassword}`);

// Create new DATABASE_URL
const newDatabaseUrl = `postgresql://postgres:${encodedPassword}@${host}:${port}/${database}`;

console.log(`\nNew DATABASE_URL:\n${newDatabaseUrl}`);

// Update .env.merge
const newEnvContent = envContent.replace(
  /DATABASE_URL=.*/,
  `DATABASE_URL=${newDatabaseUrl}`
);

// Backup original
fs.writeFileSync(envPath + '.backup', envContent);
console.log('\n✅ Backed up original to .env.merge.backup');

// Write new content
fs.writeFileSync(envPath, newEnvContent);
console.log('✅ Updated .env.merge with encoded password');

console.log('\n📝 You can now run: node test-supabase-connection.js');
