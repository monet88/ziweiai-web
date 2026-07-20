<script lang="ts">
  import type { PageData } from './$types';
  import { adminTopupXU } from '$lib/api-client';

  export let data: PageData;
  let topupAmount = 50;
  let selectedUserId = '';
  let isLoading = false;
  let showModal = false;

  function openTopupModal(userId: string) {
    selectedUserId = userId;
    topupAmount = 50;
    showModal = true;
  }

  function closeTopupModal() {
    showModal = false;
    selectedUserId = '';
  }

  async function handleTopup() {
    if (!selectedUserId || topupAmount <= 0) return;
    isLoading = true;
    try {
      const res = await adminTopupXU(data.session.token, selectedUserId, topupAmount);
      if (res.success) {
        // Update user data locally
        const user = data.users.find((u: any) => u.user_id === selectedUserId);
        if (user) {
          user.xu_balance = (user.xu_balance || 0) + topupAmount;
          data.users = [...data.users]; // trigger reactivity
        }
        closeTopupModal();
      }
    } catch (error) {
      console.error('Failed to topup:', error);
      alert('Nạp XU thất bại, vui lòng thử lại.');
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - Tử Vi Toàn Tập</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Quản lý người dùng và số dư XU.</p>
    </div>
  </div>

  <div class="mt-8 flex flex-col">
    <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Tên</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">XU Balance</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Premium</th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span class="sr-only">Nạp XU</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {#each data.users as user}
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{user.full_name || 'N/A'}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email || 'N/A'}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-bold text-amber-600">{user.xu_balance || 0}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{user.is_premium ? 'Có' : 'Không'}</td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onclick={() => openTopupModal(user.user_id)}
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                      Nạp XU
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={closeTopupModal}></div>
      <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
      <div class="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">Nạp XU cho tài khoản</h3>
              <div class="mt-4">
                <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Số lượng XU</label>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  min="1"
                  bind:value={topupAmount}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            onclick={handleTopup}
            disabled={isLoading}
          >
            {isLoading ? 'Đang nạp...' : 'Xác nhận nạp'}
          </button>
          <button
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            onclick={closeTopupModal}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
