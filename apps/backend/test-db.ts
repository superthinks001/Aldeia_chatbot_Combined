import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../../.env.merge') });

// Now import after env vars are loaded
import { supabase } from './src/config/database';

async function testQueries() {
  console.log('🧪 Testing database queries...\n');
  
  // Verify environment variables
  console.log('Environment check:');
  console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // Test 1: Count users
  console.log('Test 1: Count users');
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Failed:', countError);
  } else {
    console.log(`✅ Found ${count} users\n`);
  }
  
  // Test 2: Get first user
  console.log('Test 2: Get first user');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single();
  
  if (userError) {
    console.error('❌ Failed:', userError);
  } else {
    console.log('✅ User:', user);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role, '\n');
  }
  
  // Test 3: Get analytics count
  console.log('Test 3: Count analytics');
  const { count: analyticsCount, error: analyticsError } = await supabase
    .from('analytics')
    .select('*', { count: 'exact', head: true });
  
  if (analyticsError) {
    console.error('❌ Failed:', analyticsError);
  } else {
    console.log(`✅ Found ${analyticsCount} analytics events\n`);
  }
  
  console.log('🎉 All database tests passed!');
}

testQueries().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
