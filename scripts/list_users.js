require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

supabaseUrl = supabaseUrl ? supabaseUrl.replace(/^["']|["']$/g, '') : undefined;
supabaseServiceKey = supabaseServiceKey ? supabaseServiceKey.replace(/^["']|["']$/g, '') : undefined;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectUsers() {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const users = usersData.users;
  console.log(`Total users found: ${users.length}`);

  const admins = [];
  let sevengotekFound = false;

  for (const user of users) {
    if (user.email === 'sevengotek@gmail.com') {
      sevengotekFound = true;
    }

    const roles = user.app_metadata?.role;
    let isAdmin = false;
    if (Array.isArray(roles) && roles.includes('admin')) {
      isAdmin = true;
    } else if (roles === 'admin') {
      isAdmin = true;
    }

    if (isAdmin) {
      admins.push(user.email);
    }
  }

  console.log('--- ADMIN USERS ---');
  if (admins.length > 0) {
    admins.forEach(email => console.log('- ' + email));
  } else {
    console.log('No admin users found.');
  }

  console.log('--- SEVENGOTEK STATUS ---');
  if (sevengotekFound) {
    console.log('sevengotek@gmail.com exists in this database.');
    
    const user = users.find(u => u.email === 'sevengotek@gmail.com');
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { app_metadata: { ...user.app_metadata, role: ['admin'] } }
    );
    if (error) {
      console.error('Failed to set admin role:', error);
    } else {
      console.log('Successfully SET admin role for sevengotek@gmail.com!');
    }
  } else {
    console.log('sevengotek@gmail.com DOES NOT EXIST in this database (You need to sign up first).');
  }
}

inspectUsers();
