/**
 * Model ghép đôi Hợp Hôn (factory Svelte 5 runes) — US-017c.
 *
 * Giữ 2 draft sinh (primary + partner) + loại quan hệ; submit gọi POST /pairings. Tái dùng
 * helper birth-profile-draft (createBirthFormDraft/validate/buildCreateChartRequest) thay vì
 * fork logic. Token đọc tươi trong mutationFn (invariants §3); KHÔNG $effect ghi ngược state.
 */
import { createMutation } from '@tanstack/svelte-query';
import type { PairingRelationType, PairingSnapshot } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, createPairing } from '$lib/api-client';
import {
  buildCreateChartRequest,
  createBirthFormDraft,
  isBirthFormDraftValid,
  type BirthFormDraft,
} from '$lib/features/birth-profile/birth-profile-draft';
import { viCopy } from '$lib/i18n/vi';

export interface HepanModelOptions {
  auth: AuthStore;
}

export function createHepanModel(options: HepanModelOptions) {
  const { auth } = options;

  let primary = $state<BirthFormDraft>(createBirthFormDraft());
  let partner = $state<BirthFormDraft>(createBirthFormDraft());
  let relationType = $state<PairingRelationType>('love');
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<PairingSnapshot, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.missingChartContext);
      }
      return createPairing(token, {
        primary: buildCreateChartRequest(primary).birthInput,
        partner: buildCreateChartRequest(partner).birthInput,
        relationType,
      });
    },
  }));

  return {
    get primary() {
      return primary;
    },
    get partner() {
      return partner;
    },
    get relationType() {
      return relationType;
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
    get result(): PairingSnapshot | null {
      return mutation.data ?? null;
    },

    setPrimaryField<K extends keyof BirthFormDraft>(field: K, value: BirthFormDraft[K]): void {
      primary = { ...primary, [field]: value };
      validationMessage = null;
    },

    setPartnerField<K extends keyof BirthFormDraft>(field: K, value: BirthFormDraft[K]): void {
      partner = { ...partner, [field]: value };
      validationMessage = null;
    },

    setRelationType(next: PairingRelationType): void {
      relationType = next;
    },

    submit(): void {
      if (!isBirthFormDraftValid(primary) || !isBirthFormDraftValid(partner)) {
        validationMessage = viCopy.dashboardValidation.formInvalid;
        return;
      }
      mutation.mutate();
    },

    reset(): void {
      primary = createBirthFormDraft();
      partner = createBirthFormDraft();
      relationType = 'love';
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type HepanModel = ReturnType<typeof createHepanModel>;
