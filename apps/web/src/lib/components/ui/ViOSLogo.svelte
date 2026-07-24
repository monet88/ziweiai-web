<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    showTagline?: boolean;
    class?: string;
  }

  let { size = 'md', showTagline = false, class: className = '' }: Props = $props();

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 44,
  };
</script>

<div class="vios-brand {className}" class:size-sm={size === 'sm'} class:size-md={size === 'md'} class:size-lg={size === 'lg'}>
  <svg 
    width={iconSizes[size]} 
    height={iconSizes[size]} 
    viewBox="0 0 40 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    class="vios-icon"
  >
    <!-- Background glow & ring -->
    <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#vios-bg-grad)" stroke="url(#vios-stroke-grad)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="13" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2 3" opacity="0.6"/>
    
    <!-- Stylized ViOS Emblem -->
    <path d="M11 13L20 29L29 13" stroke="url(#vios-v-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="20" cy="15" r="3.5" fill="#f59e0b"/>
    <circle cx="20" cy="15" r="1.5" fill="#ffffff"/>

    <defs>
      <linearGradient id="vios-bg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1e1b4b"/>
        <stop offset="1" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="vios-stroke-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stop-color="#818cf8"/>
        <stop offset="1" stop-color="#f59e0b"/>
      </linearGradient>
      <linearGradient id="vios-v-grad" x1="11" y1="13" x2="29" y2="29" gradientUnits="userSpaceOnUse">
        <stop stop-color="#c084fc"/>
        <stop offset="1" stop-color="#38bdf8"/>
      </linearGradient>
    </defs>
  </svg>
  <div class="vios-text-group">
    <span class="vios-title">Vi<span class="vios-os">OS</span></span>
    {#if showTagline}
      <span class="vios-tagline">Tử Vi & Chiêm Tinh AI</span>
    {/if}
  </div>
</div>

<style>
  .vios-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-sans, system-ui, sans-serif);
    user-select: none;
    text-decoration: none;
  }

  .vios-icon {
    flex-shrink: 0;
    filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.35));
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .vios-brand:hover .vios-icon {
    transform: scale(1.08) rotate(4deg);
  }

  .vios-text-group {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .vios-title {
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--color-text-primary, #f8fafc);
  }

  .size-sm .vios-title { font-size: 18px; }
  .size-md .vios-title { font-size: 22px; }
  .size-lg .vios-title { font-size: 30px; }

  .vios-os {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 900;
    margin-left: 1px;
  }

  .vios-tagline {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary, #94a3b8);
    margin-top: 4px;
    text-transform: uppercase;
  }
</style>
