import fs from 'fs';
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.nachzhkeuzwiqmbtelrp:D%40vidtinh710%21%40%23@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('Running migration...');
    const sql = fs.readFileSync('supabase/migrations/000013_admin_tables.sql', 'utf8');
    await client.query(sql);
    
    console.log('Running seed...');
    const seed = fs.readFileSync('supabase/seed_admin.sql', 'utf8');
    await client.query(seed);
    
    console.log('Refreshing schema cache...');
    await client.query('NOTIFY pgrst, "reload schema";');
    
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
