#!/usr/bin/env node
/**
 * Test Supabase Connection
 *
 * Verifies that Supabase credentials are correct and connection works
 */

require('dotenv').config({ path: '.env.merge' });
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

console.log('='.repeat(60));
console.log('Testing Supabase Connection');
console.log('='.repeat(60));

// Display configuration (masked)
console.log('\n📋 Configuration:');
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL}`);
console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY?.substring(0, 20)}...`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
console.log('');

async function testSupabaseClient() {
  console.log('🔍 Test 1: Supabase Client Connection');
  console.log('-'.repeat(60));

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Try a simple query (this will fail if table doesn't exist, but connection will work)
    const { data, error } = await supabase
      .from('_test')
      .select('*')
      .limit(1);

    // PGRST116 means table doesn't exist - that's OK, connection works!
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('  ✅ Supabase client connected successfully!');
    console.log('  ✅ API authentication working');
    return true;
  } catch (error) {
    console.error('  ❌ Supabase client connection failed:', error.message);
    return false;
  }
}

async function testPostgreSQLConnection() {
  console.log('\n🔍 Test 2: Direct PostgreSQL Connection');
  console.log('-'.repeat(60));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('  ✅ PostgreSQL connection established');

    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('  ✅ Database query successful');
    console.log(`  📊 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[1]}`);
    console.log(`  🕒 Server time: ${result.rows[0].current_time}`);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`  📋 Tables in database: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`     - ${row.table_name}`);
      });
    } else {
      console.log('     (No tables yet - ready for schema creation)');
    }

    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('  ❌ PostgreSQL connection failed:', error.message);
    await pool.end();
    return false;
  }
}

async function testDatabasePermissions() {
  console.log('\n🔍 Test 3: Database Permissions');
  console.log('-'.repeat(60));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Test CREATE TABLE permission
    await client.query(`
      CREATE TABLE IF NOT EXISTS _connection_test (
        id SERIAL PRIMARY KEY,
        test_value TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ CREATE TABLE permission verified');

    // Test INSERT permission
    await client.query(`
      INSERT INTO _connection_test (test_value) VALUES ('test')
    `);
    console.log('  ✅ INSERT permission verified');

    // Test SELECT permission
    const selectResult = await client.query('SELECT * FROM _connection_test LIMIT 1');
    console.log('  ✅ SELECT permission verified');

    // Test UPDATE permission
    await client.query(`
      UPDATE _connection_test SET test_value = 'updated' WHERE id = $1
    `, [selectResult.rows[0].id]);
    console.log('  ✅ UPDATE permission verified');

    // Test DELETE permission
    await client.query('DELETE FROM _connection_test');
    console.log('  ✅ DELETE permission verified');

    // Clean up test table
    await client.query('DROP TABLE _connection_test');
    console.log('  ✅ DROP TABLE permission verified');

    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('  ❌ Permission test failed:', error.message);
    await pool.end();
    return false;
  }
}

async function main() {
  const test1 = await testSupabaseClient();
  const test2 = await testPostgreSQLConnection();
  const test3 = await testDatabasePermissions();

  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Supabase Client:       ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`PostgreSQL Connection: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Permissions:  ${test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  if (test1 && test2 && test3) {
    console.log('\n🎉 All tests passed! Supabase is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('  1. Run schema creation:');
    console.log('     - Go to Supabase Dashboard → SQL Editor');
    console.log('     - Copy contents of migrations/001_create_schema.sql');
    console.log('     - Paste and run');
    console.log('  2. Run data migration:');
    console.log('     node migrations/migrate-from-sqlite.js');
    console.log('  3. Switch to PostgreSQL:');
    console.log('     Set USE_SQLITE=false in .env.merge');
    console.log('');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check your credentials and try again.');
    console.log('\nTroubleshooting:');
    console.log('  - Verify SUPABASE_URL is correct');
    console.log('  - Verify SUPABASE_ANON_KEY is correct');
    console.log('  - Verify DATABASE_URL password is correct');
    console.log('  - Check Supabase project is active (not paused)');
    console.log('');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
