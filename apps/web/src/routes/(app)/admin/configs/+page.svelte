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

<div class="mt-4 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Cấu hình Hệ thống</h3>
    <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
      <p>Quản lý các thông số như Rate Limit, Feature Flags, v.v.</p>
    </div>
    
    <div class="mt-5 space-y-4">
      {#each configs as conf}
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <div class="flex-1 w-full">
            <label for="config-{conf.key}" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{conf.key}</label>
            <textarea
              id="config-{conf.key}"
              name="config-{conf.key}"
              rows="3"
              bind:value={conf.value}
              class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>
          <button
            type="button"
            class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            disabled={savingKey === conf.key}
            on:click={() => saveConfig(conf.key, conf.value)}
          >
            {savingKey === conf.key ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      {/each}
      
      {#if configs.length === 0}
        <p class="text-sm text-gray-500">Chưa có cấu hình nào trong database.</p>
      {/if}
    </div>
  </div>
</div>
