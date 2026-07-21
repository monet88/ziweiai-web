const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/routes/(app)/admin/+page.ts',
  'apps/web/src/routes/(app)/admin/audit-logs/+page.ts',
  'apps/web/src/routes/(app)/admin/transactions/+page.ts',
  'apps/web/src/routes/(app)/admin/configs/+page.ts',
  'apps/web/src/routes/(app)/admin/analytics/+page.ts'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(
    /export const load: PageLoad = async \(\{ parent \}\) => \{[\s\S]*?const \{ session \} = \(await parent\(\)\) as any;/,
    `import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;`
  );
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
}
