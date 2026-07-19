<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { Coins } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  const auth = getAuthStore();
  const wallet = createWalletModel(auth);

  onMount(() => {
    wallet.subscribe();
  });

  onDestroy(() => {
    wallet.unsubscribe();
  });

  function handleTopup() {
    goto(resolve('/pricing'));
  }
</script>

<!-- Show 0 XU for anonymous to encourage topup, which then prompts login. -->
<button class="wallet-indicator" onclick={handleTopup} aria-label="Ví XU của bạn" title="Nạp thêm XU">
  <div class="wallet-icon">
    <Coins size={16} strokeWidth={2.5} />
  </div>
  <span class="wallet-balance">
    {#if wallet.isLoading}
      ...
    {:else}
      {wallet.balance} XU
    {/if}
  </span>
</button>

<style>
  .wallet-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px 0 4px;
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .wallet-indicator:hover {
    background: var(--overlay-surface-veil);
    border-color: var(--color-accent-primary);
  }

  .wallet-indicator:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .wallet-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
  }

  .wallet-balance {
    font-variant-numeric: tabular-nums;
  }

  @media (pointer: coarse) {
    .wallet-indicator {
      height: 44px;
    }
    
    .wallet-icon {
      width: 36px;
      height: 36px;
    }
  }
</style>
