import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });
dotenv.config({ path: 'apps/web/.env' });

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function test() {
  const { data, error } = await supabase.auth.signInAnonymously();
  console.log('Data:', data);
  console.log('Error:', error);
}
test();
