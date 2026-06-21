/**
 * Model trắc nghiệm MBTI (factory Svelte 5 runes) — US-017b.
 *
 * Nguyên tắc reactive (invariants §3): token đọc TƯƠI trong mutationFn createMbtiQuiz (không
 * snapshot); result dẫn xuất từ mutation.data; KHÔNG $effect ghi ngược state. Bộ câu hỏi lấy
 * từ @ziweiai/contracts (MBTI_QUESTIONS) — web chỉ import contracts (boundary 0007).
 */
import { createMutation } from '@tanstack/svelte-query';
import { MBTI_QUESTIONS, type MbtiAnswer, type MbtiResult } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, createMbtiQuiz } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

export interface MbtiQuizModelOptions {
  auth: AuthStore;
}

export function createMbtiQuizModel(options: MbtiQuizModelOptions) {
  const { auth } = options;
  const questions = MBTI_QUESTIONS;

  // choice theo questionId: 1..7 Likert; chưa trả lời = undefined.
  let answersById = $state<Record<string, number>>({});
  let currentIndex = $state(0);
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<MbtiResult, ApiError, MbtiAnswer[]>(() => ({
    mutationFn: async (answers: MbtiAnswer[]) => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.missingChartContext);
      }
      return createMbtiQuiz(token, answers);
    },
  }));

  return {
    get questions() {
      return questions;
    },
    get total() {
      return questions.length;
    },
    get currentIndex() {
      return currentIndex;
    },
    get currentQuestion() {
      return questions[currentIndex];
    },
    get currentChoice(): number | null {
      return answersById[questions[currentIndex]?.id] ?? null;
    },
    get validationMessage() {
      return validationMessage;
    },
    get isFirst() {
      return currentIndex === 0;
    },
    get isLast() {
      return currentIndex === questions.length - 1;
    },
    get answeredCount() {
      return Object.keys(answersById).length;
    },
    get allAnswered() {
      return questions.every((q) => answersById[q.id] !== undefined);
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
    get result(): MbtiResult | null {
      return mutation.data ?? null;
    },

    /** Chọn đáp án cho câu hiện tại (1..7). Xoá thông báo lỗi nếu có. */
    select(choice: number): void {
      const id = questions[currentIndex]?.id;
      if (!id) {
        return;
      }
      answersById = { ...answersById, [id]: choice };
      validationMessage = null;
    },

    next(): void {
      if (this.currentChoice === null) {
        validationMessage = viCopy.mbti.answerRequired;
        return;
      }
      if (currentIndex < questions.length - 1) {
        currentIndex += 1;
      }
    },

    previous(): void {
      if (currentIndex > 0) {
        currentIndex -= 1;
        validationMessage = null;
      }
    },

    submit(): void {
      if (!this.allAnswered) {
        validationMessage = viCopy.mbti.answerRequired;
        return;
      }
      const answers: MbtiAnswer[] = questions.map((q) => ({ questionId: q.id, choice: answersById[q.id] }));
      mutation.mutate(answers);
    },

    reset(): void {
      answersById = {};
      currentIndex = 0;
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type MbtiQuizModel = ReturnType<typeof createMbtiQuizModel>;
