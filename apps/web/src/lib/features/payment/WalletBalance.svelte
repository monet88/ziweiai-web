<script lang="ts">
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { getWalletStore, type WalletStore } from './wallet-context';
  import { createWalletModel } from './wallet-model.svelte';
  import { Coins, Plus } from 'lucide-svelte';
  import { viCopy } from '$lib/i18n/vi';
  import { Spinner } from '$lib/components/ui';

  const auth = getAuthStore();
  let wallet: WalletStore;
  try {
    wallet = getWalletStore();
  } catch {
    wallet = createWalletModel(auth);
  }
</script>

{#if auth.isAuthenticated && !auth.isAnonymous}
  <div class="wallet-badge">
    <a href={resolve('/wallet')} class="balance" title="Ví XU & Điểm danh hàng ngày">
      <Coins class="w-4 h-4 text-amber-500" />
      {#if wallet.isLoading}
        <span class="loading"><Spinner size="sm" /></span>
      {:else}
        <strong class="amount">{wallet.balance}</strong>
      {/if}
    </a>
    <a href={resolve('/wallet')} class="add-btn" aria-label={viCopy.pricing.addXuAction} title="Nạp XU">
      <Plus class="w-3 h-3" strokeWidth={3} />
    </a>
  </div>
{/if}

<style>
  .wallet-badge {
    display: inline-flex;
    align-items: center;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-pill);
    height: 36px;
    padding-left: 12px;
    padding-right: 4px;
    gap: 8px;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .wallet-badge:hover {
    border-color: rgba(245, 158, 11, 0.6);
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
    transform: translateY(-1px);
  }

  .balance {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    color: inherit;
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
