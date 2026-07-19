<script lang="ts">
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { createWalletModel } from './wallet-model.svelte';
  import { Coins, Plus } from 'lucide-svelte';
  import { viCopy } from '$lib/i18n/vi';
  import { onMount, onDestroy } from 'svelte';
  import { Spinner } from '$lib/components/ui';

  const auth = getAuthStore();
  const wallet = createWalletModel(auth);

  onMount(() => {
    wallet.subscribe();
  });

  onDestroy(() => {
    wallet.unsubscribe();
  });
</script>

{#if auth.isAuthenticated && !auth.isAnonymous}
  <div class="wallet-badge">
    <div class="balance" title={viCopy.pricing.balanceLabel}>
      <Coins class="w-4 h-4 text-amber-500" />
      {#if wallet.isLoading}
        <span class="loading"><Spinner size="sm" /></span>
      {:else}
        <strong class="amount">{wallet.balance}</strong>
      {/if}
    </div>
    <a href={resolve('/pricing')} class="add-btn" aria-label={viCopy.pricing.addXuAction}>
      <Plus class="w-3 h-3" strokeWidth={3} />
    </a>
  </div>
{/if}

<style>
  .wallet-badge {
    display: inline-flex;
    align-items: center;
    background: var(--color-bg-surface);
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-pill);
    height: 36px;
    padding-left: 12px;
    padding-right: 4px;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .wallet-badge:hover {
    border-color: var(--color-accent-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .balance {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .amount {
    font-size: 14px;
    font-weight: 750;
    color: var(--color-text-primary);
  }

  .loading {
    display: flex;
    align-items: center;
    height: 20px;
    width: 20px;
  }

  .add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-text-primary);
    color: var(--color-text-on-primary);
    text-decoration: none;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .add-btn:hover {
    transform: scale(1.1);
  }
  
  .add-btn:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }
</style>
