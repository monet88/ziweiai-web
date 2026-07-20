<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: analytics = data.analytics;
</script>

<svelte:head>
  <title>Thống kê - Admin Tử Vi Toàn Tập</title>
</svelte:head>

{#if !analytics}
  <div class="rounded-md bg-red-50 p-4 mt-6">
    <div class="flex">
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
        <div class="mt-2 text-sm text-red-700">
          <p>Không thể lấy dữ liệu thống kê từ máy chủ.</p>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="mt-6">
    <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
      <!-- Total Users -->
      <div class="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6">
        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tổng người dùng</dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{analytics.total_users}</dd>
      </div>

      <!-- Total XU Topup -->
      <div class="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6">
        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tổng XU được nạp</dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-green-600 dark:text-green-400">{analytics.total_xu_topup}</dd>
      </div>

      <!-- Total XU Consumed -->
      <div class="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6">
        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tổng XU tiêu thụ</dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-500">{analytics.total_xu_consumed}</dd>
      </div>
    </dl>
  </div>

  <div class="mt-10">
    <h2 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Biến động 30 ngày gần nhất</h2>
    <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Ngày</th>
                <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">Đăng ký mới</th>
                <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">XU Nạp</th>
                <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">XU Tiêu Thụ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {#each analytics.daily_stats as stat (stat.date)}
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{stat.date}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500 dark:text-gray-400">{stat.new_users}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">+{stat.xu_topup}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-amber-600 dark:text-amber-500">-{stat.xu_consumed}</td>
                </tr>
              {/each}
              {#if analytics.daily_stats.length === 0}
                <tr>
                  <td colspan="4" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Không có dữ liệu trong 30 ngày qua.</td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
{/if}
