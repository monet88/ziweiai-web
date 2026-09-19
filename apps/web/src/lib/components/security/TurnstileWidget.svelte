<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';

  interface Props {
    action?: string;
    onToken?: (token: string) => void;
  }

  let { action = 'generic', onToken }: Props = $props();

  let container: HTMLDivElement | null = $state(null);
  let widgetId: string | null = null;
  let isReady = $state(false);

  const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY || '';

  export async function execute(): Promise<string> {
    if (!browser || !siteKey) {
      // Graceful Bypass Mode khi không cấu hình site key
      return '';
    }

    return new Promise((resolve) => {
      let resolved = false;

      const finish = (token: string) => {
        if (!resolved) {
          resolved = true;
          onToken?.(token);
          resolve(token);
        }
      };

      // Safety timeout sau 4 giây phòng ngừa script bị adblock hoặc mạng lag
      const timeoutId = setTimeout(() => {
        finish('');
      }, 4000);

      const turnstile = (window as any).turnstile;
      if (!turnstile || !container) {
        clearTimeout(timeoutId);
        finish('');
        return;
      }

      try {
        if (widgetId !== null) {
          turnstile.reset(widgetId);
          turnstile.execute(widgetId);
        } else {
          widgetId = turnstile.render(container, {
            sitekey: siteKey,
            action,
            size: 'invisible',
            theme: 'dark',
            callback: (token: string) => {
              clearTimeout(timeoutId);
              finish(token);
            },
            'error-callback': () => {
              clearTimeout(timeoutId);
              finish('');
            },
            'expired-callback': () => {
              clearTimeout(timeoutId);
              finish('');
            },
          });
        }
      } catch {
        clearTimeout(timeoutId);
        finish('');
      }
    });
  }

  onMount(() => {
    if (!browser || !siteKey) return;

    if (!(window as any).turnstile) {
      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          isReady = true;
        };
        document.head.appendChild(script);
      } else {
        isReady = true;
      }
    } else {
      isReady = true;
    }
  });

  onDestroy(() => {
    if (browser && widgetId !== null && (window as any).turnstile) {
      try {
        (window as any).turnstile.remove(widgetId);
      } catch {
        // ignore cleanup error
      }
    }
  });
</script>

<div
  bind:this={container}
  class="turnstile-invisible-container"
  data-turnstile-ready={isReady}
  aria-hidden="true"
></div>

<style>
  .turnstile-invisible-container {
    display: none;
    visibility: hidden;
    width: 0;
    height: 0;
    overflow: hidden;
  }
</style>
