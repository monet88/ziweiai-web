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
      {@const IconComponent = tab.icon}
      <li>
        <a href={tab.href} class:active={isActive}>
          <div class="icon-wrapper" class:active={isActive}>
            <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
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
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border-top: 1px solid var(--overlay-border);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }

  ul {
    display: flex;
    justify-content: space-around;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0 var(--space-xs);
    height: 60px;
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
    width: 100%;
    min-height: 48px;
    gap: 3px;
    transition: all var(--duration-fast) ease;
  }

  a.active {
    color: var(--color-accent-primary);
  }

  :global([data-theme="dark"]) a.active {
    color: #d4af37;
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 2px 12px;
    border-radius: var(--radius-pill);
    transition: all 0.2s ease;
  }

  .icon-wrapper.active {
    background: var(--overlay-ink-wash);
  }

  :global([data-theme="dark"]) .icon-wrapper.active {
    background: rgba(212, 175, 55, 0.12);
  }

  span {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.01em;
  }
</style>
