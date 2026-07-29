const fs = require('fs');
const files = [
  'apps/api/src/modules/draws-lenormand/draws-lenormand.service.test.ts',
  'apps/api/src/modules/draws-sticks/draws-sticks.service.test.ts',
  'apps/api/src/modules/draws-tarot/draws-tarot.service.test.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/,\n\s+persistenceGateway as SupabasePersistenceGateway\);/g, '');
  content = content.replace(/,\s+persistenceGateway as SupabasePersistenceGateway\);/g, '');
  
  // Now add it properly
  const className = file.includes('lenormand') ? 'DrawsLenormandService' :
                    file.includes('sticks') ? 'DrawsSticksService' :
                    'DrawsTarotService';
  
  content = content.replace(
    new RegExp(`service = new ${className}\\(\\s*quotasService as QuotasService,\\s*providerRouter as ExplanationProviderRouter,?(\\s*)\\);`, 'm'),
    `service = new ${className}(\n      quotasService as QuotasService,\n      providerRouter as ExplanationProviderRouter,\n      persistenceGateway as SupabasePersistenceGateway\n    );`
  );
  fs.writeFileSync(file, content);
}
console.log('Fixed syntax errors');
