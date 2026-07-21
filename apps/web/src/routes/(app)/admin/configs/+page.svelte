<script lang="ts">
  import type { PageData } from './$types';
  import { adminUpdateConfig } from '$lib/api-client';

  export let data: PageData;

  let configs = Object.entries(data.configs).map(([key, value]) => {
    let parsedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return { key, value: parsedValue, original: value };
  });

  let savingKey: string | null = null;

  async function saveConfig(key: string, valueStr: string) {
    if (!data.session?.token) return;
    try {
      savingKey = key;
      let parsedValue;
      try {
        parsedValue = JSON.parse(valueStr);
      } catch {
        parsedValue = valueStr;
      }

      await adminUpdateConfig(data.session.token, key, parsedValue);
      alert(`Đã cập nhật ${key}`);
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật cấu hình');
    } finally {
      savingKey = null;
    }
  }
</script>

<div class="config-card">
  <div class="card-header">
    <h3 class="card-title">Cấu hình Hệ thống</h3>
    <p class="card-desc">Quản lý các thông số như Rate Limit, Feature Flags, v.v.</p>
  </div>
  
  <div class="card-body">
    {#each configs as conf}
      <div class="config-item">
        <div class="input-group">
          <label for="config-{conf.key}" class="form-label">{conf.key}</label>
          <textarea
            id="config-{conf.key}"
            name="config-{conf.key}"
            rows="3"
            bind:value={conf.value}
            class="form-input"
          ></textarea>
        </div>
        <button
          type="button"
          class="btn btn-solid"
          disabled={savingKey === conf.key}
          on:click={() => saveConfig(conf.key, conf.value)}
        >
          {savingKey === conf.key ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    {/each}
    
    {#if configs.length === 0}
      <p class="empty-state">Chưa có cấu hình nào trong database.</p>
    {/if}
  </div>
</div>

<style>
  .config-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    margin-top: var(--space-xl);
    overflow: hidden;
  }

  .card-header {
    padding: var(--space-xl) var(--space-xl) var(--space-md);
    border-bottom: 1px solid var(--color-border-hairline);
    background: var(--color-bg-elevated);
  }

  .card-title {
    font-family: var(--font-serif);
    font-size: var(--text-title);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 600;
  }

  .card-desc {
    margin: var(--space-xs) 0 0 0;
    font-size: var(--text-body-sm);
    color: var(--color-text-secondary);
  }

  .card-body {
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .config-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-lg);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    align-items: flex-start;
  }

  @media (min-width: 640px) {
    .config-item {
      flex-direction: row;
      align-items: flex-end;
    }
  }

  .input-group {
    flex: 1;
    width: 100%;
  }

  .form-label {
    display: block;
    font-size: var(--text-body-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--space-xs);
    font-family: monospace;
    background: var(--overlay-ink-wash);
    padding: 2px 8px;
    border-radius: var(--radius-xs);
    width: fit-content;
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-body-sm);
    font-family: monospace;
    color: var(--color-text-primary);
    background: var(--color-bg-surface);
    transition: border-color var(--duration-fast);
    resize: vertical;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }

  .btn {
    font-family: var(--font-sans);
    font-size: var(--text-body-sm);
    font-weight: 500;
    padding: var(--space-sm) var(--space-xl);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-fast);
    border: none;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-solid {
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
  }

  .btn-solid:hover:not(:disabled) {
    background: var(--color-accent-primary-pressed);
  }

  .empty-state {
    color: var(--color-text-muted);
    font-size: var(--text-body);
    text-align: center;
    padding: var(--space-xl);
  }
</style>
