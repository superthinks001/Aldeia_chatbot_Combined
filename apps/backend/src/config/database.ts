import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env.merge') });

// ============================================
// PostgreSQL/Supabase Connection (Primary)
// ============================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found. Using SQLite fallback.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ============================================
// SQLite Connection (Fallback/Legacy)
// ============================================

const useSQLite = process.env.USE_SQLITE === 'true';
const sqliteDbPath = path.join(__dirname, '../../../../data/aldeia.db');

export const sqlite = useSQLite
  ? new sqlite3.Database(sqliteDbPath)
  : null;

// ============================================
// Database Helper Functions
// ============================================

export async function testConnection(): Promise<boolean> {
  try {
    if (useSQLite) {
      console.log('🗄️  Using SQLite database');
      return true;
    }

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ PostgreSQL/Supabase connection successful');
    return true;

  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

// Log database mode on import
if (useSQLite) {
  console.log('📊 Database Mode: SQLite (Legacy)');
} else {
  console.log('📊 Database Mode: PostgreSQL/Supabase');
}

export default { supabase, sqlite, testConnection };
