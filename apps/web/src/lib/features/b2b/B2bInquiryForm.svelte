<script lang="ts">
  import {
    b2bInquiryRequestSchema,
    type B2bInquiryRequest,
    type B2bNeedType,
  } from '@ziweiai/contracts';
  import { submitB2bInquiry } from '$lib/api-client/b2b';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner, PrimaryButton } from '$lib/components/ui';
  import { CheckCircle2, Building2, Phone, Mail, User } from 'lucide-svelte';

  const auth = getAuthStore();

  let fullName = $state('');
  let phone = $state('');
  let email = $state('');
  let company = $state('');
  let need = $state<B2bNeedType>('phong_thuy');
  let message = $state('');

  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  const NEED_OPTIONS: Array<{ value: B2bNeedType; label: string }> = [
    { value: 'phong_thuy', label: 'Tư Vấn Phong Thủy & Động Thổ Khởi Công' },
    { value: 'ho_so_hoang_gia', label: 'Đặt In Hồ Sơ Mệnh Lý 19 Trang Tặng Khách VIP' },
    { value: 'mua_si_xu', label: 'Gói Mua Sỉ XU Cho Doanh Nghiệp (Chiết khấu 50%)' },
    { value: 'khac', label: 'Nhu Cầu Hợp Tác Phân Phối / Khác' },
  ];

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    errorMessage = null;
    successMessage = null;

    const rawPayload: B2bInquiryRequest = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      need,
      message: message.trim() || undefined,
    };

    const parsed = b2bInquiryRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      errorMessage = firstIssue ? firstIssue.message : 'Vui lòng kiểm tra lại thông tin đã nhập.';
      return;
    }

    isSubmitting = true;
    try {
      const token = auth.getAccessToken() ?? undefined;
      const res = await submitB2bInquiry(parsed.data, token);
      successMessage = res.message;
      // Reset form
      fullName = '';
      phone = '';
      email = '';
      company = '';
      message = '';
      need = 'phong_thuy';
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Hệ thống tạm thời bận, vui lòng thử lại sau hoặc gọi hotline.';
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="b2b-form-wrapper" id="partner-form">
  <div class="form-header">
    <span class="eyebrow-badge">ĐĂNG KÝ HỢP TÁC CHIẾN LƯỢC</span>
    <h2 class="form-title">Kết Nối Với Chuyên Gia Thuật Số ViOS</h2>
    <p class="form-subtitle">
      Để lại thông tin, cố vấn phong thủy và đại diện kinh doanh của ViOS Hoàng Gia sẽ liên hệ trực tiếp trong vòng 24 giờ làm việc.
    </p>
  </div>

  {#if successMessage}
    <div class="success-box">
      <CheckCircle2 size={40} class="text-emerald-500 mb-2" />
      <h3>Đăng Ký Thành Công!</h3>
      <p>{successMessage}</p>
      <button
        type="button"
        class="btn-reset"
        onclick={() => { successMessage = null; }}
      >
        Gửi thêm yêu cầu khác
      </button>
    </div>
  {:else}
    <form class="inquiry-form" onsubmit={handleSubmit} novalidate>
      {#if errorMessage}
        <NoticeBanner message={errorMessage} tone="danger" />
      {/if}

      <div class="form-grid">
        <!-- Họ tên -->
        <div class="field-group">
          <label for="b2b-fullname" class="field-label">
            Họ và tên <span class="required">*</span>
          </label>
          <div class="input-wrap">
            <User size={18} class="input-icon" />
            <input
              id="b2b-fullname"
              type="text"
              class="form-input"
              placeholder="Nguyễn Văn A"
              bind:value={fullName}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <!-- Số điện thoại -->
        <div class="field-group">
          <label for="b2b-phone" class="field-label">
            Số điện thoại liên hệ <span class="required">*</span>
          </label>
          <div class="input-wrap">
            <Phone size={18} class="input-icon" />
            <input
              id="b2b-phone"
              type="tel"
              class="form-input"
              placeholder="0988 123 456"
              bind:value={phone}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <!-- Email -->
        <div class="field-group">
          <label for="b2b-email" class="field-label">
            Địa chỉ email
          </label>
          <div class="input-wrap">
            <Mail size={18} class="input-icon" />
            <input
              id="b2b-email"
              type="email"
              class="form-input"
              placeholder="doitac@doanhnghiep.vn"
              bind:value={email}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <!-- Tên công ty / Sàn BĐS -->
        <div class="field-group">
          <label for="b2b-company" class="field-label">
            Doanh nghiệp / Sàn BĐS / Đơn vị công tác
          </label>
          <div class="input-wrap">
            <Building2 size={18} class="input-icon" />
            <input
              id="b2b-company"
              type="text"
              class="form-input"
              placeholder="Công ty BĐS Hoàng Gia"
              bind:value={company}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <!-- Nhu cầu -->
      <div class="field-group mt-4">
        <label for="b2b-need" class="field-label">
          Hạng mục hợp tác chính
        </label>
        <select
          id="b2b-need"
          class="form-select"
          bind:value={need}
          disabled={isSubmitting}
        >
          {#each NEED_OPTIONS as opt (opt.value)}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Lời nhắn -->
      <div class="field-group mt-4">
        <label for="b2b-message" class="field-label">
          Nội dung cần trao đổi thêm (dự án, quy mô, yêu cầu mẫu)
        </label>
        <textarea
          id="b2b-message"
          class="form-textarea"
          rows={3}
          placeholder="Ví dụ: Chúng tôi cần đặt 50 cuốn Hồ Sơ Hoàng Gia cho dự án mở bán tháng tới..."
          bind:value={message}
          disabled={isSubmitting}
        ></textarea>
      </div>

      <!-- Nút gửi -->
      <div class="form-actions mt-6">
        <PrimaryButton
          type="submit"
          label={isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Hợp Tác B2B'}
          loading={isSubmitting}
        />
      </div>
    </form>
  {/if}
</div>

<style>
  .b2b-form-wrapper {
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
    border-radius: 24px;
    padding: 40px 32px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    margin-bottom: 48px;
  }

  :global(.dark) .b2b-form-wrapper {
    background: rgba(30, 27, 75, 0.45);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.35);
  }

  .form-header {
    text-align: center;
    max-width: 640px;
    margin: 0 auto 32px;
  }

  .eyebrow-badge {
    display: inline-block;
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 14px;
    border-radius: 999px;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
  }

  :global(.dark) .eyebrow-badge {
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
  }

  .form-title {
    font-size: 26px;
    font-weight: 800;
    color: var(--color-text-primary, #1e1b4b);
    margin: 0 0 10px;
    letter-spacing: -0.02em;
  }

  :global(.dark) .form-title {
    color: #ffffff;
  }

  .form-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
    line-height: 1.6;
    margin: 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .b2b-form-wrapper {
      padding: 24px 16px;
    }
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #1e1b4b);
  }

  :global(.dark) .field-label {
    color: #e2e8f0;
  }

  .required {
    color: #ef4444;
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.input-icon) {
    position: absolute;
    left: 14px;
    color: var(--color-text-muted, #94a3b8);
    pointer-events: none;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 12px 14px 12px 42px;
    background: var(--color-bg-base, #f8fafc);
    border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
    border-radius: 12px;
    font-size: 14px;
    color: var(--color-text-primary, #1e1b4b);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-select,
  .form-textarea {
    padding-left: 14px;
  }

  :global(.dark) .form-input,
  :global(.dark) .form-select,
  :global(.dark) .form-textarea {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.12);
    color: #f8fafc;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .form-actions {
    display: flex;
    justify-content: center;
  }

  .success-box {
    text-align: center;
    padding: 40px 20px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 18px;
  }

  .success-box h3 {
    font-size: 20px;
    font-weight: 800;
    color: #059669;
    margin: 0 0 8px;
  }

  :global(.dark) .success-box h3 {
    color: #34d399;
  }

  .success-box p {
    font-size: 14.5px;
    color: var(--color-text-secondary, #475569);
    margin: 0 0 20px;
  }

  .btn-reset {
    background: transparent;
    border: 1px solid #059669;
    color: #059669;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-reset:hover {
    background: rgba(16, 185, 129, 0.12);
  }

  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
</style>
