const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('../../.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  if (line && line.includes('=')) {
    const [key, value] = line.split('=');
    acc[key] = value.replace(/"/g, '');
  }
  return acc;
}, {});

const supabaseUrl = env['PUBLIC_SUPABASE_URL'];
const supabaseKey = env['PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'sevengotek@gmail.com',
    password: 'Jalafaka@112'
  });
  if (error) {
    console.error('Login error:', error);
    return;
  }
  const token = data.session.access_token;
  console.log('Token:', token);

  const res = await fetch("https://ziwei.7app.online/admin/users", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  console.log('EC2 API Status:', res.status);
  if (res.status !== 200) {
    console.log('Body:', await res.text());
  } else {
    console.log('Success! Users length:', (await res.json()).length);
  }
}

login();
