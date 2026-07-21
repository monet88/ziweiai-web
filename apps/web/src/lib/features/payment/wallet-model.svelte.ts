import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { supabase } from '$lib/supabase/supabase-client';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { z } from 'zod';

// Singleton for Realtime channel to avoid duplicate connections
let channel: ReturnType<typeof supabase.channel> | null = null;
let activeSubscriptions = 0;

export function createWalletModel(auth: AuthStore) {
  const queryClient = useQueryClient();

  const queryKey = () => ['wallet_balance', auth.user?.id];

  const query = createQuery(() => ({
    queryKey: queryKey(),
    queryFn: async () => {
      if (!auth.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('xu_balance, last_checkin_date')
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

  function subscribe() {
    if (!auth.user?.id || auth.isAnonymous) return;
    activeSubscriptions++;

    if (activeSubscriptions === 1) {
      if (channel) supabase.removeChannel(channel);
      
      channel = supabase
        .channel(`public:profiles:${auth.user.id}`)
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
            queryClient.setQueryData(queryKey(), (oldData: any) => {
              if (!oldData) return { xu_balance: newBalance, last_checkin_date: newCheckinDate };
              return {
                ...oldData,
                xu_balance: newBalance !== undefined ? newBalance : oldData.xu_balance,
                last_checkin_date: newCheckinDate !== undefined ? newCheckinDate : oldData.last_checkin_date
              };
            });
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
    get canCheckin() {
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
    async checkin() {
      if (!auth.user || auth.isAnonymous) throw new Error('Cần đăng nhập để điểm danh');
      
      const { fetchJson } = await import('$lib/api-client/fetch-json');
      const schema = z.object({
        success: z.boolean(),
        xu_added: z.number()
      });
      const result = await fetchJson('/api/rewards/checkin', schema, {
        method: 'POST',
        token: auth.session?.access_token,
      });
      
      if (result.success) {
        this.refresh();
      }
      return result;
    },
    refresh() {
      return queryClient.invalidateQueries({ queryKey: queryKey() });
    },
    subscribe,
    unsubscribe
  };
}
