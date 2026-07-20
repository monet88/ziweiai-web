<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Quản lý hệ thống và người dùng.</p>
    </div>
  </div>

  <div class="mt-4">
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <a
          href="/admin"
          class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm { $page.url.pathname === '/admin' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300' }"
          aria-current={$page.url.pathname === '/admin' ? 'page' : undefined}
        >
          Người dùng
        </a>
        <a
          href="/admin/transactions"
          class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm { $page.url.pathname === '/admin/transactions' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300' }"
          aria-current={$page.url.pathname === '/admin/transactions' ? 'page' : undefined}
        >
          Lịch sử giao dịch
        </a>
        <a
          href="/admin/analytics"
          class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm { $page.url.pathname === '/admin/analytics' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300' }"
          aria-current={$page.url.pathname === '/admin/analytics' ? 'page' : undefined}
        >
          Thống kê
        </a>
      </nav>
    </div>
  </div>

  <div class="mt-8">
    <slot />
  </div>
</div>
