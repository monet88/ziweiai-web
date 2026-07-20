<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Lịch sử giao dịch - Admin - Tử Vi Toàn Tập</title>
</svelte:head>

<div class="flex flex-col">
  <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
    <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
      <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Thời gian</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Người dùng</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Loại GD</th>
              <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">Biến động</th>
              <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">Số dư cuối</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Thực hiện bởi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {#each data.transactions as tx (tx.id)}
              <tr>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-white sm:pl-6">
                  {new Date(tx.created_at).toLocaleString('vi-VN')}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white font-medium">
                  {tx.profiles?.full_name || tx.profiles?.email || 'N/A'}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span class="inline-flex rounded-full bg-blue-100 dark:bg-blue-900 px-2 text-xs font-semibold leading-5 text-blue-800 dark:text-blue-200">
                    {tx.transaction_type}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-bold {tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                  {tx.balance_after}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {tx.actor_email || 'Hệ thống'}
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Chưa có giao dịch nào.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
