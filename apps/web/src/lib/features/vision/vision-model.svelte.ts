/**
 * Model luận giải vision dùng chung Xem Tướng (US-017e) + Xem Tay (US-017f) — Svelte 5 runes.
 *
 * Giữ file ảnh đang chọn + câu hỏi tuỳ chọn; submit gọi POST /vision/{kind} (multipart). Validate
 * phía client (loại MIME + kích thước ≤ 4MB) trước khi gửi để báo lỗi sớm, KHÔNG thay cho gate
 * server. Token đọc tươi trong mutationFn (invariants §3). Chặn anon ở UI bằng auth.isAnonymous —
 * server vẫn là chốt chặn cuối (assertEmailIdentityRequired).
 */
import { createMutation } from '@tanstack/svelte-query';
import type { VisionAnalysis, VisionKind } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, createVisionAnalysis } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Hình dạng copy chung cho cả Xem Tướng (face) và Xem Tay (palm). Route/màn hình truyền copy tương
// ứng (viCopy.face / viCopy.palm) để model dùng chung không cần biết trước hệ nào. Dùng kiểu CẤU
// TRÚC (string) thay vì `typeof viCopy.face` (literal hẹp) để cả hai khối copy đều gán được —
// `typeof viCopy.face` khiến heroEyebrow là literal "XEM TƯỚNG", palm gán vào sẽ lỗi kiểu.
export type VisionCopy = { readonly [K in keyof typeof viCopy.face]: string };

export interface VisionModelOptions {
  kind: VisionKind;
  auth: AuthStore;
  copy: VisionCopy;
}

export function createVisionModel(options: VisionModelOptions) {
  const { kind, auth, copy } = options;

  let imageFile = $state<File | null>(null);
  let question = $state('');
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<VisionAnalysis, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.missingChartContext);
      }
      if (!imageFile) {
        throw new ApiError('validation', copy.missingImage);
      }
      return createVisionAnalysis(token, kind, { image: imageFile, question });
    },
  }));

  return {
    get kind() {
      return kind;
    },
    get isAnonymous() {
      return auth.isAnonymous;
    },
    get imageFile() {
      return imageFile;
    },
    get question() {
      return question;
    },
    get validationMessage() {
      return validationMessage;
    },
    get isSubmitting() {
      return mutation.isPending;
    },
    get isError() {
      return mutation.isError;
    },
    get errorMessage() {
      return mutation.error?.message ?? null;
    },
    get result(): VisionAnalysis | null {
      return mutation.data ?? null;
    },

    /** Nhận file từ input; validate loại + kích thước rồi giữ lại (hoặc đặt validationMessage). */
    setImage(file: File | null): void {
      validationMessage = null;
      if (!file) {
        imageFile = null;
        return;
      }
      if (!SUPPORTED_MIME_TYPES.has(file.type)) {
        imageFile = null;
        validationMessage = copy.invalidImageType;
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        imageFile = null;
        validationMessage = copy.imageTooLarge;
        return;
      }
      imageFile = file;
    },

    setQuestion(next: string): void {
      question = next;
    },

    submit(): void {
      if (auth.isAnonymous) {
        validationMessage = copy.identityRequired;
        return;
      }
      if (!imageFile) {
        validationMessage = copy.missingImage;
        return;
      }
      validationMessage = null;
      mutation.mutate();
    },

    reset(): void {
      imageFile = null;
      question = '';
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type VisionModel = ReturnType<typeof createVisionModel>;
