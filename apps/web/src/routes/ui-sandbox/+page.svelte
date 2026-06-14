<script lang="ts">
  // Route sandbox dev-only để kiểm mắt bộ UI primitive (US-004). SvelteKit loại thư mục
  // bắt đầu bằng `_` khỏi router, nên dùng tên `ui-sandbox` + gate import.meta.env.DEV:
  // production build hiển thị 404-state thay vì lộ trang nháp.
  import {
    AppScaffold,
    PrimaryButton,
    SummaryCard,
    TextInputField,
    SelectField,
    NoticeBanner,
    EmptyStateCard,
    Spinner,
    FullScreenState,
  } from '$lib/components/ui';

  const isDev = import.meta.env.DEV;

  let textValue = $state('');
  let emailValue = $state('');
  let numberValue = $state('');
  let selectValue = $state('zi-wei-dou-shu');
  let loadingDemo = $state(false);
  let showFullScreen = $state(false);

  const systemOptions = [
    { label: 'Tử Vi Đẩu Số', value: 'zi-wei-dou-shu' },
    { label: 'Bát Tự', value: 'ba-zi' },
    { label: 'Mai Hoa Dịch Số', value: 'mei-hua-yi-shu' },
  ];

  const summaryItems = [
    { label: 'Cung Mệnh', value: 'Tử Vi, Thiên Phủ' },
    { label: 'Cục mệnh', value: 'Thủy Nhị Cục' },
    { label: 'Âm lịch', value: '14/08/1992 Nhâm Thân' },
  ];

  function toggleLoading() {
    loadingDemo = true;
    setTimeout(() => (loadingDemo = false), 1500);
  }
</script>

{#if !isDev}
  <main class="gate">
    <p>Trang nháp UI chỉ khả dụng ở môi trường phát triển.</p>
  </main>
{:else if showFullScreen}
  <FullScreenState title="Đang tải lá số" message="Đang chuẩn bị tóm tắt và trạng thái độ tin cậy." />
  <button class="floating" onclick={() => (showFullScreen = false)}>Đóng FullScreenState</button>
{:else}
  <AppScaffold
    eyebrow="UI SANDBOX"
    title="Bộ component nền"
    subtitle="Kiểm mắt các primitive trước khi lắp vào màn hình US-005..007."
  >
    {#snippet action()}
      <PrimaryButton label="Hành động" onclick={() => {}} />
    {/snippet}

    <section class="demo">
      <h2>Nút</h2>
      <div class="row">
        <PrimaryButton label="Gold" onclick={() => {}} />
        <PrimaryButton label="Surface" variant="surface" onclick={() => {}} />
        <PrimaryButton label="Tải" loading={loadingDemo} onclick={toggleLoading} />
        <PrimaryButton label="Khoá" disabled onclick={() => {}} />
      </div>
    </section>

    <section class="demo">
      <h2>Form control</h2>
      <TextInputField label="Họ tên" fieldId="demo-name" bind:value={textValue} placeholder="Nhập họ tên" helperText="Nhãn helper bình thường." />
      <TextInputField label="Email" fieldId="demo-email" type="email" bind:value={emailValue} placeholder="ban@vidu.com" errorText="Email không hợp lệ." />
      <TextInputField label="Năm sinh" fieldId="demo-year" type="number" bind:value={numberValue} placeholder="1992" />
      <SelectField label="Hệ lá số" fieldId="demo-system" bind:value={selectValue} options={systemOptions} />
    </section>

    <section class="demo">
      <h2>Thẻ + banner</h2>
      <SummaryCard title="Tóm tắt lá số" items={summaryItems} />
      <NoticeBanner message="Thiếu giờ sinh sẽ chặn luận giải chính xác." tone="warning" />
      <NoticeBanner message="Xác thực thất bại. Vui lòng thử lại." tone="danger" />
      <NoticeBanner message="Đây là thông tin tham khảo." tone="info" />
      <EmptyStateCard
        title="Chưa có luận giải"
        description="Hãy tạo một phần luận giải ngắn sau khi xem trạng thái độ tin cậy."
        actionLabel="Tạo luận giải"
        onaction={() => {}}
      />
    </section>

    <section class="demo">
      <h2>Trạng thái tải</h2>
      <div class="row">
        <Spinner />
        <Spinner size="lg" />
        <Spinner tone="dark" />
        <PrimaryButton label="Mở FullScreenState" variant="surface" onclick={() => (showFullScreen = true)} />
      </div>
    </section>
  </AppScaffold>
{/if}

<style>
  .gate {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: var(--color-text-muted);
    font-family: system-ui, sans-serif;
  }

  .demo {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .demo h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
  }

  .floating {
    position: fixed;
    bottom: var(--space-lg);
    right: var(--space-lg);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-pill);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    cursor: pointer;
  }
</style>
