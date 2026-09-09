<script lang="ts">
  interface Props {
    title: string;
    value: number;
    description: string;
    accentColor?: string;
  }

  let { title, value, description, accentColor = 'var(--accent, #d4af37)' }: Props = $props();
</script>

<div class="numerology-card" style="--card-accent: {accentColor};">
  <div class="badge-wrapper">
    <div class="number-badge">{value}</div>
  </div>
  <div class="info">
    <h3 class="card-title">{title}</h3>
    <p class="card-desc">{description}</p>
  </div>
</div>

<style>
  .numerology-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .numerology-card:hover {
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.3);
  }

  .badge-wrapper {
    flex-shrink: 0;
  }

  .number-badge {
    width: 3.25rem;
    height: 3.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--card-accent);
    background: radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.15), rgba(0, 0, 0, 0.4));
    border: 1.5px solid var(--card-accent);
    border-radius: 50%;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.15);
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .card-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: #f5f2ed;
    letter-spacing: 0.02em;
  }

  .card-desc {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.45;
    color: rgba(245, 242, 237, 0.65);
  }

  :global([data-theme="light"]) .numerology-card {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(212, 175, 55, 0.35);
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.08);
  }

  :global([data-theme="light"]) .number-badge {
    background: radial-gradient(circle at 30% 30%, #ffffff 0%, #fef3c7 70%, #fde68a 100%);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .card-title {
    color: #180d38;
  }

  :global([data-theme="light"]) .card-desc {
    color: #57534e;
  }
</style>
