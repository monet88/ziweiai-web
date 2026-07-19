<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { AppScaffold, PrimaryButton, EmptyStateCard } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { env } from '$lib/env';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { CheckCircle2, ArrowRight } from 'lucide-svelte';

  const copy = viCopy.pricing;
  const auth = getAuthStore();
  const wallet = createWalletModel(auth);

  let initialBalance = $state<number | null>(null);
  let hasPaid = $state(false);

  const packages = [
    { xu: 10, price: 10000 },
    { xu: 50, price: 50000 },
    { xu: 100, price: 100000 },
  ];

  let selectedPackage = $state(packages[0]);

  // Derived state for the QR code
  const shortId = $derived(auth.user?.id?.substring(0, 8).toUpperCase() ?? 'GUEST');
  const memoContent = $derived(`TVTT ${shortId}`);
  const qrUrl = $derived(
    `https://img.vietqr.io/image/${env.vietqrBankId}-${env.vietqrAccountNo}-compact.png?amount=${selectedPackage.price}&addInfo=${encodeURIComponent(memoContent)}&accountName=${encodeURIComponent(env.vietqrAccountName)}`
  );

  onMount(() => {
    wallet.subscribe();
    // Capture the initial balance when component mounts
    if (!wallet.isLoading && wallet.balance !== undefined) {
      initialBalance = wallet.balance;
    }
  });

  onDestroy(() => {
    wallet.unsubscribe();
  });

  // Check for successful payment via realtime balance update
  $effect(() => {
    if (initialBalance === null && !wallet.isLoading) {
      initialBalance = wallet.balance;
    }

    if (initialBalance !== null && wallet.balance > initialBalance) {
      hasPaid = true;
    }
  });

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#snippet action()}
    <PrimaryButton
      label={copy.backToDashboard}
      variant="surface"
      onclick={() => goto(resolve('/'))}
    />
  {/snippet}

  {#if auth.isAnonymous}
    <EmptyStateCard 
      title="Yêu cầu đăng nhập"
      description="Bạn đang sử dụng phiên ẩn danh. Để đảm bảo an toàn cho số dư XU của bạn không bị mất khi đổi thiết bị hay xóa bộ nhớ trình duyệt, vui lòng đăng nhập trước khi nạp."
      actionLabel="Đăng nhập / Đăng ký"
      onaction={() => goto(resolve('/sign-in'))}
    />
  {:else if hasPaid}
    <div class="success-state">
      <div class="success-icon">
        <CheckCircle2 class="w-16 h-16 text-emerald-500" strokeWidth={2} />
      </div>
      <h2>{copy.paymentSuccessTitle}</h2>
      <p>{copy.paymentSuccessMessage}</p>
      <div class="current-balance">
        <span>{copy.balanceLabel}</span>
        <strong>{wallet.balance} XU</strong>
      </div>
      <PrimaryButton
        label={copy.continueButton}
        variant="primary"
        onclick={() => goto(resolve('/'))}
      />
    </div>
  {:else}
    <div class="pricing-layout">
      <!-- Packages Selection -->
      <section class="packages-section">
        <h3>{copy.packagesTitle}</h3>
        <div class="packages-grid">
          {#each packages as pkg (pkg.xu)}
            <button
              class="package-card"
              class:selected={selectedPackage.xu === pkg.xu}
              onclick={() => (selectedPackage = pkg)}
            >
              <span class="xu-amount">{copy.packageOption.replace('{xu}', String(pkg.xu))}</span>
              <span class="price">{copy.priceOption.replace('{price}', formatCurrency(pkg.price))}</span>
            </button>
          {/each}
        </div>
      </section>

      <!-- Checkout / QR Section -->
      <section class="checkout-section">
        <h3>{copy.checkoutTitle}</h3>
        <p class="instruction">{copy.checkoutInstruction}</p>
        
        <div class="qr-container">
          <img src={qrUrl} alt="VietQR" class="qr-image" />
          <div class="payment-status">
            <span class="pulse"></span>
            {copy.paymentWaiting}
          </div>
        </div>

        <div class="manual-transfer">
          <h4>{copy.bankTransfer}</h4>
          <dl class="transfer-info">
            <div class="info-row">
              <dt>{copy.bankName}</dt>
              <dd>{env.vietqrBankId.toUpperCase()}</dd>
            </div>
            <div class="info-row">
              <dt>{copy.accountName}</dt>
              <dd>{env.vietqrAccountName}</dd>
            </div>
            <div class="info-row">
              <dt>{copy.accountNo}</dt>
              <dd class="highlight">{env.vietqrAccountNo}</dd>
            </div>
            <div class="info-row">
              <dt>{copy.amount}</dt>
              <dd class="highlight">{formatCurrency(selectedPackage.price)}đ</dd>
            </div>
            <div class="info-row memo-row">
              <dt>{copy.memo}</dt>
              <dd class="highlight memo">{memoContent}</dd>
            </div>
          </dl>
          <p class="memo-warning">{copy.memoWarning}</p>
        </div>
      </section>
    </div>
  {/if}
</AppScaffold>

<style>
  .pricing-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-xl);
    align-items: flex-start;
  }

  @media (min-width: 900px) {
    .pricing-layout {
      grid-template-columns: 1fr 400px;
      gap: 48px;
    }
  }

  h3 {
    margin: 0 0 var(--space-md);
    font-size: 20px;
    font-weight: 750;
    color: var(--color-text-primary);
  }

  .packages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
  }

  .package-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-xl) var(--space-md);
    border: 2px solid var(--overlay-border);
    border-radius: var(--radius-xl);
    background: var(--color-bg-surface);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .package-card:hover {
    border-color: var(--overlay-border-strong);
    background: var(--overlay-surface-veil);
  }

  .package-card.selected {
    border-color: var(--color-accent-primary);
    background: var(--overlay-ink-wash);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .xu-amount {
    font-size: 32px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .price {
    font-size: 16px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .checkout-section {
    background: var(--color-bg-surface);
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-xl);
    padding: var(--space-lg);
    box-shadow: var(--shadow-card);
  }

  .instruction {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-lg);
    line-height: 1.5;
  }

  .qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    padding: var(--space-md);
    background: #ffffff;
    border-radius: var(--radius-lg);
    border: 1px solid var(--overlay-border);
  }

  .qr-image {
    width: 100%;
    max-width: 280px;
    height: auto;
    border-radius: 8px;
  }

  .payment-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-accent-primary);
    font-weight: 600;
  }

  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent-primary);
    animation: pulse-ring 2s infinite;
  }

  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
  }

  .manual-transfer {
    border-top: 1px dashed var(--overlay-border-strong);
    padding-top: var(--space-lg);
  }

  .manual-transfer h4 {
    margin: 0 0 var(--space-md);
    font-size: 15px;
    color: var(--color-text-primary);
  }

  .transfer-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
  }

  .info-row dt {
    color: var(--color-text-secondary);
  }

  .info-row dd {
    margin: 0;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .info-row .highlight {
    font-weight: 700;
    font-size: 15px;
  }

  .info-row.memo-row {
    margin-top: 8px;
    padding: 12px;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    border: 1px solid var(--overlay-border-strong);
  }

  .memo-row .memo {
    color: var(--color-accent-primary);
    letter-spacing: 0.05em;
  }

  .memo-warning {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--color-danger);
    text-align: right;
  }

  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 64px 20px;
    background: var(--color-bg-surface);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-xl);
    gap: var(--space-md);
  }

  .success-icon {
    margin-bottom: var(--space-sm);
    animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes scale-in {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .success-state h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .success-state p {
    margin: 0 0 var(--space-lg);
    color: var(--color-text-secondary);
    font-size: 16px;
    max-width: 400px;
  }

  .current-balance {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    background: var(--overlay-surface-veil);
    border-radius: var(--radius-pill);
    margin-bottom: var(--space-xl);
  }

  .current-balance span {
    color: var(--color-text-muted);
    font-size: 15px;
  }

  .current-balance strong {
    color: var(--color-accent-primary);
    font-size: 24px;
    font-weight: 800;
  }
</style>
