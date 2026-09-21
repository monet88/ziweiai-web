import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  b2bInquiryRequestSchema,
  b2bInquiryResponseSchema,
  type B2bInquiryRequest,
  type B2bInquiryResponse,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { reportOpsAlert } from '../../observability/ops-alert';

@Injectable()
export class B2bService {
  private readonly logger = new Logger(B2bService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async submitInquiry(rawInput: unknown): Promise<B2bInquiryResponse> {
    const parseResult = b2bInquiryRequestSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const message = firstIssue ? firstIssue.message : 'Dữ liệu yêu cầu hợp tác không hợp lệ.';
      throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', message);
    }

    const data: B2bInquiryRequest = parseResult.data;

    const { data: inserted, error: insertError } = await this.supabase
      .from('b2b_inquiries')
      .insert({
        full_name: data.fullName,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        need: data.need,
        message: data.message || null,
      })
      .select('id, created_at')
      .single();

    if (insertError || !inserted) {
      this.logger.error(`[b2b] Lưu yêu cầu hợp tác thất bại: ${insertError?.message ?? 'Unknown DB error'}`);
      throw new ApiErrorHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_ERROR',
        'Hệ thống tạm thời không thể tiếp nhận yêu cầu, vui lòng thử lại sau hoặc liên hệ hotline.',
      );
    }

    this.logger.log(`[b2b] Tiếp nhận yêu cầu hợp tác thành công: id=${inserted.id} phone=${data.phone}`);

    // Phát cảnh báo vận hành (Ops alert) thông báo đối tác mới (ADR-0009)
    // Fire-and-forget: Lỗi cảnh báo tuyệt đối KHÔNG làm sập response của khách hàng
    void reportOpsAlert({
      level: 'warning',
      code: 'B2B_PARTNER_INQUIRY_RECEIVED',
      message: `🎉 [B2B] Yêu cầu đối tác mới từ [${data.fullName}] (SĐT: ${data.phone}, Công ty: ${data.company || 'N/A'}, Nhu cầu: ${data.need})`,
      tags: {
        inquiry_id: inserted.id,
        need: data.need,
        phone: data.phone,
      },
    });

    return b2bInquiryResponseSchema.parse({
      success: true,
      id: inserted.id,
      createdAt: inserted.created_at,
      message: 'Cảm ơn bạn! Đội ngũ tư vấn ViOS Hoàng Gia sẽ liên hệ trong vòng 24 giờ làm việc.',
    });
  }
}
