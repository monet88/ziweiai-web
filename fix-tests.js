const fs = require('fs');
const files = [
  'apps/api/src/modules/draws-lenormand/draws-lenormand.service.test.ts',
  'apps/api/src/modules/draws-sticks/draws-sticks.service.test.ts',
  'apps/api/src/modules/dreams/dreams.service.test.ts',
  'apps/api/src/modules/draws-tarot/draws-tarot.service.test.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import if not exists
  if (!content.includes('SupabasePersistenceGateway')) {
    content = content.replace(
      "import { ApiErrorHttpException } from '../../common/http/api-error';",
      "import type { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';\nimport { ApiErrorHttpException } from '../../common/http/api-error';"
    );
  }

  // Find the beforeEach block
  const className = file.includes('lenormand') ? 'DrawsLenormandService' :
                    file.includes('sticks') ? 'DrawsSticksService' :
                    file.includes('dreams') ? 'DreamsService' :
                    'DrawsTarotService';

  // Replace service instantiation
  if (!content.includes('persistenceGateway as SupabasePersistenceGateway')) {
    const serviceRegex = new RegExp(`service = new ${className}\\([^)]+\\);`);
    content = content.replace(serviceRegex, (match) => {
      let args = match.match(/\(([^)]+)\)/)[1];
      return `service = new ${className}(${args}, persistenceGateway as SupabasePersistenceGateway);`;
    });
    
    // Add persistenceGateway mock
    content = content.replace(
      `let service: ${className};`,
      `let persistenceGateway: Pick<SupabasePersistenceGateway, 'deductXU'>;\n  let service: ${className};`
    );

    // Add to beforeEach
    content = content.replace(
      'quotasService = {',
      'persistenceGateway = { deductXU: vi.fn().mockResolvedValue(true) };\n    quotasService = {'
    );
    
    // Fix test: chặn PAYMENT_REQUIRED khi bật nhưng AI gate không free-for-all
    // It should now test INSUFFICIENT_FUNDS
    content = content.replace(
      /it\('chặn PAYMENT_REQUIRED([^']*)', async \(\) => {/g,
      "it('chặn INSUFFICIENT_FUNDS$1', async () => {\n    persistenceGateway.deductXU = vi.fn().mockResolvedValue(false);"
    );
    content = content.replace(
      /expectApiError\(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED'\);/g,
      "expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'INSUFFICIENT_FUNDS');"
    );
  }

  fs.writeFileSync(file, content);
}
console.log('Fixed tests');
