import { Injectable, Logger, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { SepayWebhookPayload, RevenueCatWebhookPayload } from '@ziweiai/contracts';
import { WalletEngineService } from '../wallet/wallet-engine.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly walletEngine: WalletEngineService,
  ) {}

  async processTransaction(payload: SepayWebhookPayload): Promise<void> {
    // Idempotency check
    const { data: existingTx } = await this.client
      .from('transactions')
      .select('id')
      .eq('sepay_transaction_id', payload.id.toString())
      .single();

    if (existingTx) {
      this.logger.log(`Transaction ${payload.id} already processed. Skipping.`);
      return;
    }

    // Calculate XU based on pricing tiers with bonus XU
    let xuAdded = Math.floor(payload.transferAmount / 1000);
    if (payload.transferAmount >= 500000) {
      xuAdded = Math.max(xuAdded, Math.floor(payload.transferAmount / 1000) + 100);
    } else if (payload.transferAmount >= 100000) {
      xuAdded = Math.max(xuAdded, Math.floor(payload.transferAmount / 1000) + 20);
    }

    if (xuAdded <= 0) {
      this.logger.warn(`Transfer amount too small to add XU: ${payload.transferAmount}`);
      return;
    }

    const memo = [payload.content, payload.code, payload.description].filter(Boolean).join(' ');
    const match = memo.match(/TVTT\s*([a-zA-Z0-9]{8})/i);

    if (!match) {
      this.logger.warn(`No valid TVTT code found in content: "${payload.content}". Recording unmatched transaction.`);
      await this.recordUnmatchedTransaction(payload, xuAdded);
      return;
    }

    const shortUuid = match[1].toLowerCase();

    // Resolve user by matching first 8 chars of user_id UUID using index range
    const isHex = /^[0-9a-f]{8}$/i.test(shortUuid);
    const minUuid = isHex ? `${shortUuid}-0000-0000-0000-000000000000` : null;
    const maxUuid = isHex ? `${shortUuid}-ffff-ffff-ffff-ffffffffffff` : null;

    let matchedUsers: { user_id: string }[] = [];

    if (minUuid && maxUuid) {
      const { data, error } = await this.client
        .from('profiles')
        .select('user_id')
        .gte('user_id', minUuid)
        .lte('user_id', maxUuid);

      if (error) {
        this.logger.error(`Failed to fetch profiles for short UUID prefix: ${shortUuid}`, error);
        await this.recordUnmatchedTransaction(payload, xuAdded);
        return;
      }
      matchedUsers = data || [];
    } else {
      const { data: userProfiles, error: userError } = await this.client
        .from('profiles')
        .select('user_id');

      if (userError || !userProfiles) {
        this.logger.error(`Failed to fetch profiles to match short UUID: ${shortUuid}`, userError);
        await this.recordUnmatchedTransaction(payload, xuAdded);
        return;
      }
      matchedUsers = userProfiles.filter((p) => p.user_id.toLowerCase().startsWith(shortUuid));
    }

    if (matchedUsers.length !== 1) {
      this.logger.warn(`Expected 1 user for prefix ${shortUuid}, found ${matchedUsers.length}. Recording unmatched transaction.`);
      await this.recordUnmatchedTransaction(payload, xuAdded);
      return;
    }

    const userId = matchedUsers[0].user_id;

    // Xử lý nạp tiền hoàn toàn nguyên tử (atomic) qua RPC process_sepay_payment
    const { data: atomicResult, error: rpcError } = await this.client.rpc('process_sepay_payment', {
      p_sepay_transaction_id: payload.id.toString(),
      p_owner_user_id: userId,
      p_amount_vnd: payload.transferAmount,
      p_xu_added: xuAdded,
      p_content: payload.content || null,
    });

    if (rpcError || !atomicResult) {
      this.logger.error(`Atomic payment RPC failed for transaction ${payload.id}: ${rpcError?.message || 'Unknown error'}`);
      throw new InternalServerErrorException('Lỗi xử lý giao dịch nạp XU atomic. Webhook sẽ tự động thử lại.');
    }

    if (atomicResult.status === 'already_processed') {
      this.logger.log(`Transaction ${payload.id} already processed by atomic RPC. Skipping.`);
      return;
    }

    this.logger.log(`Successfully processed transaction ${payload.id} atomically. Added ${xuAdded} XU to user ${userId}.`);
  }

  private async recordUnmatchedTransaction(payload: SepayWebhookPayload, xuAdded: number): Promise<void> {
    const { error: txError } = await this.client
      .from('transactions')
      .insert({
        owner_user_id: null,
        amount_vnd: payload.transferAmount,
        xu_added: xuAdded,
        sepay_transaction_id: payload.id.toString(),
        content: payload.content || payload.description || null,
      });

    if (txError) {
      this.logger.error(`Failed to record unmatched transaction ${payload.id}`, txError);
      throw new BadRequestException('Database error');
    }
    this.logger.log(`Recorded unmatched transaction ${payload.id} (${payload.transferAmount} VND) for admin reconciliation.`);
  }

  async processRevenueCatTransaction(payload: RevenueCatWebhookPayload): Promise<void> {
    const event = payload.event;
    if (event.type !== 'INITIAL_PURCHASE' && event.type !== 'NON_RENEWING_PURCHASE') {
      this.logger.log(`Skipping RevenueCat event type ${event.type}`);
      return;
    }

    const { data: existingTx } = await this.client
      .from('transactions')
      .select('id')
      .eq('revenuecat_transaction_id', event.id)
      .single();

    if (existingTx) {
      this.logger.log(`RevenueCat transaction ${event.id} already processed. Skipping.`);
      return;
    }

    const userId = event.app_user_id;
    let xuAdded = 0;
    const productId = event.product_id.toLowerCase();

    if (productId.includes('2000')) {
      xuAdded = 2000;
    } else if (productId.includes('600')) {
      xuAdded = 600;
    } else if (productId.includes('500')) {
      xuAdded = 500;
    } else if (productId.includes('120')) {
      xuAdded = 120;
    } else if (productId.includes('100')) {
      xuAdded = 100;
    } else if (productId.includes('50')) {
      xuAdded = 50;
    } else if (productId.includes('20')) {
      xuAdded = 20;
    } else {
      const match = productId.match(/(\d+)/);
      if (match) {
        xuAdded = parseInt(match[1], 10);
      } else {
        this.logger.warn(`Could not determine XU amount for product_id: ${event.product_id}`);
        return;
      }
    }

    const currency = (event.currency || 'USD').toUpperCase();
    const originalPrice = typeof event.price_in_purchased_currency === 'number'
      ? event.price_in_purchased_currency
      : (typeof event.price === 'number' ? event.price : 0);

    // Tính toán số tiền quy đổi sang VNĐ chính xác (không làm tròn thô 4.99 USD thành 5 VNĐ)
    let amountVnd = 0;
    if (currency === 'VND') {
      amountVnd = Math.round(originalPrice);
    } else {
      // Map theo bảng giá niêm yết chuẩn nếu khớp gói XU
      const packagePriceMap: Record<number, number> = {
        10: 10000,
        20: 20000,
        50: 50000,
        100: 100000,
        120: 100000,
        500: 500000,
        600: 500000,
        2000: 1500000,
      };

      const FX_RATES_TO_VND: Record<string, number> = {
        USD: 25400,
        EUR: 27500,
        GBP: 32200,
        JPY: 170,
        SGD: 19200,
        CAD: 18600,
        AUD: 16800,
        THB: 740,
        KRW: 19,
      };

      if (packagePriceMap[xuAdded]) {
        amountVnd = packagePriceMap[xuAdded];
      } else if (FX_RATES_TO_VND[currency]) {
        amountVnd = Math.round(originalPrice * FX_RATES_TO_VND[currency]);
      } else {
        this.logger.warn(`Unmapped currency ${currency} for RevenueCat payment. Setting amount_vnd to 0.`);
        amountVnd = 0; // Tuyệt đối không làm tròn ngoại tệ lạ thành VNĐ
      }
    }

    // Xử lý nạp tiền RevenueCat hoàn toàn nguyên tử (atomic) qua RPC process_revenuecat_payment
    const { data: atomicResult, error: rpcError } = await this.client.rpc('process_revenuecat_payment', {
      p_rc_transaction_id: event.id,
      p_owner_user_id: userId,
      p_amount_vnd: amountVnd,
      p_xu_added: xuAdded,
      p_currency: currency,
      p_original_price: originalPrice,
    });

    if (rpcError || !atomicResult) {
      this.logger.error(`Atomic RevenueCat RPC failed for transaction ${event.id}: ${rpcError?.message || 'Unknown error'}`);
      throw new InternalServerErrorException('Lỗi xử lý giao dịch RevenueCat atomic. Webhook sẽ tự động thử lại.');
    }

    if (atomicResult.status === 'already_processed') {
      this.logger.log(`RevenueCat transaction ${event.id} already processed by atomic RPC. Skipping.`);
      return;
    }

    this.logger.log(`Successfully processed RevenueCat transaction ${event.id} atomically. Added ${xuAdded} XU to user ${userId}.`);
  }

  /**
   * Lấy lịch sử giao dịch nạp tiền VietQR / SePay của người dùng
   */
  async getUserTransactions(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('id, amount_vnd, xu_added, sepay_transaction_id, content, created_at')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`Failed to fetch transactions for user ${userId}:`, error);
      throw new InternalServerErrorException('Không thể tải lịch sử giao dịch lúc này.');
    }

    return data || [];
  }
}
