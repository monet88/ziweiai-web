import { Injectable, Logger } from '@nestjs/common';
import { SepayWebhookPayload, RevenueCatWebhookPayload } from '@ziweiai/contracts';
import { WalletEngineService } from '../wallet/wallet-engine.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly walletEngine: WalletEngineService) {}

  async processTransaction(payload: SepayWebhookPayload) {
    return this.walletEngine.processSePayDeposit(payload);
  }

  async processRevenueCatTransaction(payload: RevenueCatWebhookPayload) {
    return this.walletEngine.processRevenueCatDeposit(payload);
  }
}
