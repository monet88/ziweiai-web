<script lang="ts">
  import { Home, Compass, Clock, Wallet } from 'lucide-svelte';
  import { page } from '$app/stores';

  const tabs = [
    { name: 'Khám Phá', href: '/', icon: Home },
    { name: 'Tử Vi', href: '/charts', icon: Compass },
    { name: 'Lịch Sử', href: '/history', icon: Clock },
    { name: 'Tài Khoản', href: '/wallet', icon: Wallet }
  ];

  let currentPath = $derived($page.url.pathname);
</script>

<nav class="bottom-nav bottom-nav-glass">
  <ul>
    {#each tabs as tab (tab.href)}
      {@const isActive =
        tab.href === '/'
          ? currentPath === '/'
          : currentPath.startsWith(tab.href)}
      <li>
        <a href={tab.href} class:active={isActive}>
          <div class="icon-wrapper" class:active={isActive}>
            <svelte:component this={tab.icon} size={24} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <span>{tab.name}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 40;
    /* safe-area-inset-bottom for iOS */
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  ul {
    display: flex;
    justify-content: space-around;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0 var(--space-xs);
    height: 64px;
  }

  li {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: var(--color-text-muted);
    /* Mobile-first touch target >= 48px */
    width: 100%;
    min-height: 48px;
    gap: 4px;
    transition: color var(--duration-fast) ease;
  }

  a.active {
    color: var(--color-accent-primary);
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  span {
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
  }
</style>
