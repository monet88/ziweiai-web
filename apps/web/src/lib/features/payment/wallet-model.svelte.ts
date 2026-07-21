import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { supabase } from '$lib/supabase/supabase-client';
import type { AuthStore } from '$lib/auth/auth-store.svelte';

// Singleton for Realtime channel to avoid duplicate connections
let channel: ReturnType<typeof supabase.channel> | null = null;
let activeSubscriptions = 0;

export function createWalletModel(auth: AuthStore) {
  const queryClient = useQueryClient();

  const queryKey = () => ['wallet_balance', auth.user?.id];

  const query = createQuery(() => ({
    queryKey: queryKey(),
    queryFn: async () => {
      if (!auth.user?.id) return 0;
      const { data, error } = await supabase
        .from('profiles')
        .select('xu_balance')
        .eq('user_id', auth.user.id)
        .single();
      
      if (error) {
        console.error('Failed to fetch wallet balance:', error);
        throw error;
      }
      return data?.xu_balance ?? 0;
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
            if (typeof newBalance === 'number') {
              queryClient.setQueryData(queryKey(), newBalance);
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
      return query.data ?? 0;
    },
    get isLoading() {
      return query.isPending;
    },
    get isError() {
      return query.isError;
    },
    refresh() {
      return queryClient.invalidateQueries({ queryKey: queryKey() });
    },
    subscribe,
    unsubscribe
  };
}
