import { Module } from '@nestjs/common';
import { DeepseekExplanationProvider } from './deepseek-explanation-provider';
import { ExplanationProviderRouter } from './explanation-provider-router';
import { GeminiExplanationProvider } from './gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from './openai-compatible-explanation-provider';

/**
 * Module dùng chung gói 3 nhà cung cấp AI + router luận giải.
 *
 * Trước đây explanations/fortune/vision-shared mỗi module tự đăng ký lại 4 provider giống hệt →
 * Nest tạo 3 bộ instance riêng (lãng phí + nguy cơ cấu hình phân kỳ). Gom về một nơi rồi cho các
 * module khác `imports: [AiProvidersModule]` để dùng CHUNG một bộ provider (review PR #28 P2).
 */
@Module({
  providers: [
    DeepseekExplanationProvider,
    OpenAiCompatibleExplanationProvider,
    GeminiExplanationProvider,
    ExplanationProviderRouter,
  ],
  exports: [ExplanationProviderRouter],
})
export class AiProvidersModule {}
