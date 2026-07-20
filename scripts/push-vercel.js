/* eslint-disable */
const fs = require('fs');
const { execSync } = require('child_process');
const token = process.env.VERCEL_GALAXY;

const envFile = fs.readFileSync('.env.local', 'utf-8');
const lines = envFile.split('\n');

for (const line of lines) {
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  const key = line.slice(0, idx).trim();
  let val = line.slice(idx + 1).trim();
  if (val === '') continue; // Skip empty keys
  // if (key === 'PUBLIC_API_BASE_URL') continue; // Allow it now because user changed it from localhost
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1);
  }
  
  console.log(`Pushing ${key}...`);
  const safeVal = val.replace(/'/g, "'\\''");
  
  for (const envName of ['production', 'preview', 'development']) {
    try {
      execSync(`npx --yes vercel env rm ${key} ${envName} --yes --token "${token}"`, { stdio: 'ignore' });
    } catch(e) {}
    
    try {
      const cmd = `printf '%s' '${safeVal}' | npx --yes vercel env add ${key} ${envName} --token "${token}"`;
      execSync(cmd, { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }
  }
  console.log(`✓ Updated ${key}`);
}
