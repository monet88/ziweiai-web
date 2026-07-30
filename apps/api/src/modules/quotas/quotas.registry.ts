import { Injectable, Logger } from '@nestjs/common';
import { QuotaRule } from './quota-rule.interface';

@Injectable()
export class QuotasRegistry {
  private readonly logger = new Logger(QuotasRegistry.name);
  private readonly rules = new Map<string, QuotaRule>();

  register(rule: QuotaRule): void {
    if (this.rules.has(rule.featureKey)) {
      this.logger.warn(`Overwriting existing quota rule for featureKey: ${rule.featureKey}`);
    }
    this.rules.set(rule.featureKey, rule);
    this.logger.debug(`Registered quota rule: ${rule.featureKey}`);
  }

  get(featureKey: string): QuotaRule | undefined {
    return this.rules.get(featureKey);
  }
}
