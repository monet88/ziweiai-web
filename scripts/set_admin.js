require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

supabaseUrl = supabaseUrl ? supabaseUrl.replace(/^["']|["']$/g, '') : undefined;
supabaseServiceKey = supabaseServiceKey ? supabaseServiceKey.replace(/^["']|["']$/g, '') : undefined;

console.log('Loaded URL:', supabaseUrl);
console.log('Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin(email) {
  console.log(`Setting admin role for ${email}...`);
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    allUsers = allUsers.concat(users.users);
    if (users.users.length < 1000) {
      hasMore = false;
    } else {
      page++;
    }
  }

  const user = allUsers.find(u => u.email === email);
  if (!user) {
    console.error(`User with email ${email} not found after checking ${allUsers.length} users.`);
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { app_metadata: { ...user.app_metadata, role: ['admin'] } }
  );

  if (error) {
    console.error('Error updating user:', error);
  } else {
    console.log(`Successfully granted admin role to ${email}.`);
  }
}

setAdmin('sevengotek@gmail.com');
