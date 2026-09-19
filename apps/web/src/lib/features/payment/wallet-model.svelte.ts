import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { supabase } from '$lib/supabase/supabase-client';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { z } from 'zod';

// Singleton for Realtime channel to avoid duplicate connections
let channel: ReturnType<typeof supabase.channel> | null = null;
let activeSubscriptions = 0;
let lastReferralRewardTimestamp = 0;

export function createWalletModel(auth: AuthStore) {
  const queryClient = useQueryClient();

  let lastTopupEvent = $state<{ added: number; newBalance: number } | null>(null);
  let lastReferralEvent = $state<{ rewardXu: number; refereeEmailMasked?: string } | null>(null);
  let previousBalance = $state<number | null>(null);

  const queryKey = () => ['wallet_balance', auth.user?.id];

  const query = createQuery(() => ({
    queryKey: queryKey(),
    queryFn: async () => {
      if (!auth.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('xu_balance, last_checkin_date, referral_code')
        .eq('user_id', auth.user.id)
        .single();
      
      if (error) {
        console.error('Failed to fetch wallet balance:', error);
        throw error;
      }
      return data;
    },
    enabled: !!auth.user?.id && !auth.isAnonymous,
    staleTime: 5 * 60 * 1000,
  }));

  // Lắng nghe thay đổi số dư từ query (polling fallback)
  $effect(() => {
    const current = query.data?.xu_balance;
    if (current !== undefined && current !== null) {
      if (previousBalance !== null && current > previousBalance) {
        const added = current - previousBalance;
        lastTopupEvent = { added, newBalance: current };
        const now = Date.now();
        if (now - lastReferralRewardTimestamp > 3000) {
          import('$lib/stores/toast').then(({ toast }) => {
            toast.show(`🎉 Nạp XU thành công! +${added} XU đã được cộng vào ví.`, 'success');
          });
        }
      }
      previousBalance = current;
    }
  });

  const referralsQueryKey = () => ['wallet_referrals', auth.user?.id];
  const referralsQuery = createQuery(() => ({
    queryKey: referralsQueryKey(),
    queryFn: async () => {
      if (!auth.user?.id) return [];
      const { fetchJson } = await import('$lib/api-client/fetch-json');
      const schema = z.array(z.object({
        id: z.string(),
        referrerId: z.string(),
        refereeId: z.string(),
        rewardXu: z.number(),
        status: z.string(),
        createdAt: z.string(),
        completedAt: z.string().nullable(),
        refereeEmailMasked: z.string().optional().nullable(),
      }));
      return fetchJson('/rewards/referrals', schema, {
        method: 'GET',
        token: auth.session?.access_token,
      });
    },
    enabled: !!auth.user?.id && !auth.isAnonymous,
  }));

  const transactionsQueryKey = () => ['wallet_transactions', auth.user?.id];
  const transactionsQuery = createQuery(() => ({
    queryKey: transactionsQueryKey(),
    queryFn: async () => {
      if (!auth.user?.id || auth.isAnonymous) return [];
      const { fetchJson } = await import('$lib/api-client/fetch-json');
      const { transactionListResponseSchema } = await import('@ziweiai/contracts');
      const res = await fetchJson('/wallet/transactions', transactionListResponseSchema, {
        method: 'GET',
        token: auth.session?.access_token,
      });
      return res.data || [];
    },
    enabled: !!auth.user?.id && !auth.isAnonymous,
  }));

  function subscribe() {
    if (!auth.user?.id || auth.isAnonymous) return;
    activeSubscriptions++;

    if (activeSubscriptions === 1) {
      if (channel) supabase.removeChannel(channel);
      
      channel = supabase
        .channel(`public:wallet:${auth.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${auth.user.id}`,
          },
          (payload) => {
            const newBalance = payload.new.xu_balance;
            const newCheckinDate = payload.new.last_checkin_date;
            const now = Date.now();
            const isRecentReferral = (now - lastReferralRewardTimestamp) < 3000;

            if (newBalance !== undefined && previousBalance !== null && newBalance > previousBalance) {
              const added = newBalance - previousBalance;
              lastTopupEvent = { added, newBalance };
              if (!isRecentReferral) {
                import('$lib/stores/toast').then(({ toast }) => {
                  toast.show(`🎉 Nạp XU thành công! +${added} XU đã được cộng vào ví.`, 'success');
                });
              }
              previousBalance = newBalance;
            }
            queryClient.setQueryData(queryKey(), (oldData: any) => {
              if (!oldData) return { xu_balance: newBalance, last_checkin_date: newCheckinDate, referral_code: undefined };
              return {
                ...oldData,
                xu_balance: newBalance !== undefined ? newBalance : oldData.xu_balance,
                last_checkin_date: newCheckinDate !== undefined ? newCheckinDate : oldData.last_checkin_date
              };
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'referrals',
            filter: `referrer_id=eq.${auth.user.id}`,
          },
          (payload) => {
            lastReferralRewardTimestamp = Date.now();
            const rewardXu = payload.new?.reward_xu ?? 10;
            const refereeEmailMasked = payload.new?.referee_email_masked ?? undefined;
            lastReferralEvent = { rewardXu, refereeEmailMasked };
            import('$lib/stores/toast').then(({ toast }) => {
              toast.show(`👑 VINH DANH SỨ GIẢ: Bạn vừa nhận thưởng giới thiệu bạn bè: +${rewardXu} XU vào ví!`, 'success');
            });
            // Tự động làm mới số dư, lịch sử giới thiệu & partner hub
            queryClient.invalidateQueries({ queryKey: queryKey() });
            queryClient.invalidateQueries({ queryKey: referralsQueryKey() });
            queryClient.invalidateQueries({ queryKey: ['partner_hub', auth.user?.id] });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ziwei:referral_received', { detail: payload.new }));
            }
          }
        )
        .subscribe();
    }
  }

  function unsubscribe() {
    if (!auth.user?.id || auth.isAnonymous) return;
    if (activeSubscriptions > 0) {
      activeSubscriptions--;
    }

    if (activeSubscriptions === 0 && channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  }

  return {
    get balance() {
      return query.data?.xu_balance ?? 0;
    },
    get lastCheckinDate() {
      return query.data?.last_checkin_date ?? null;
    },
    get referralCode() {
      return query.data?.referral_code ?? null;
    },
    get referrals() {
      return referralsQuery.data ?? [];
    },
    get transactions() {
      return transactionsQuery.data ?? [];
    },
    get isTransactionsLoading() {
      return transactionsQuery.isPending;
    },
    get canCheckin() {
      if (query.isPending) return false;
      const lastCheckin = query.data?.last_checkin_date;
      if (!lastCheckin) return true;
      
      // Compare with today in Vietnam time
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const todayString = formatter.format(new Date()); // YYYY-MM-DD
      
      return lastCheckin < todayString;
    },
    get isLoading() {
      return query.isPending;
    },
    get isError() {
      return query.isError;
    },
    get lastTopupEvent() {
      return lastTopupEvent;
    },
    clearTopupEvent() {
      lastTopupEvent = null;
    },
    get lastReferralEvent() {
      return lastReferralEvent;
    },
    clearReferralEvent() {
      lastReferralEvent = null;
    },
    async checkin(turnstileToken?: string) {
      if (!auth.user || auth.isAnonymous) throw new Error('Cần đăng nhập để điểm danh');
      
      const { fetchJson } = await import('$lib/api-client/fetch-json');
      const schema = z.object({
        success: z.boolean(),
        xu_added: z.number()
      });

      const { sanitizeReferralCode } = await import('$lib/features/referral/append-referral-query');
      const refCode = sanitizeReferralCode(localStorage.getItem('ziweiai_ref_code'));
      const body: { referralCode?: string; turnstileToken?: string } = {};
      if (refCode) body.referralCode = refCode;
      if (turnstileToken) body.turnstileToken = turnstileToken;

      const result = await fetchJson('/rewards/checkin', schema, {
        method: 'POST',
        token: auth.session?.access_token,
        body: Object.keys(body).length > 0 ? body : undefined,
      });
      
      if (result.success) {
        if (localStorage.getItem('ziweiai_ref_code')) {
          localStorage.removeItem('ziweiai_ref_code');
        }
        this.refresh();
      }
      return result;
    },
    refresh() {
      queryClient.invalidateQueries({ queryKey: transactionsQueryKey() });
      return queryClient.invalidateQueries({ queryKey: queryKey() });
    },
    subscribe,
    unsubscribe
  };
}
