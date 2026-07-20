<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  let logs = data.logs;
</script>

<div class="mt-4 bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
  <div class="px-4 py-5 sm:px-6">
    <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Nhật ký hoạt động (Audit Logs)</h3>
    <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Danh sách các hành động nhạy cảm của Admin.</p>
  </div>
  
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-900">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thời gian</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Admin</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chi tiết (Metadata)</th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {#each logs as log}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              {new Date(log.created_at).toLocaleString('vi-VN')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {log.actor_email}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-900 dark:text-indigo-300">
                {log.action}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              {log.target_id || '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
              {log.metadata ? JSON.stringify(log.metadata) : '-'}
            </td>
          </tr>
        {/each}
        {#if logs.length === 0}
          <tr>
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Chưa có nhật ký nào.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
