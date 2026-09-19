<script lang="ts">
  // MbtiQuizScreen (US-017b): trắc nghiệm MBTI từng câu một + màn kết quả. Bộ câu hỏi lấy từ
  // contracts (MBTI_QUESTIONS) qua model; submit gọi POST /quizzes/mbti. Nhãn toàn tiếng Việt.
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createMbtiQuizModel } from './mbti-quiz-model.svelte';

  const copy = viCopy.mbti;
  const auth = getAuthStore();
  const model = createMbtiQuizModel({ auth });

  // Thang Likert 7 mức: 1..3 nghiêng vế A, 4 trung lập, 5..7 nghiêng vế B.
  const likertValues = [1, 2, 3, 4, 5, 6, 7];

  function progressLabel(): string {
    return copy.progressLabel
      .replace('{current}', String(model.currentIndex + 1))
      .replace('{total}', String(model.total));
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#if model.result}
    <section class="result celestial-card-glass" aria-live="polite">
      <div class="result-header">
        <p class="result-eyebrow">{copy.resultTitle}</p>
        <p class="result-type">{model.result.type}</p>
      </div>

      <div class="axes-wrapper">
        <ul class="axes">
          {#each model.result.axes as axis (axis.key)}
            <li class="axis">
              <div class="axis-head">
                <span class="axis-label">{axis.label}</span>
                <span class="axis-score">{axis.score}%</span>
              </div>
              <div class="axis-track">
                <div class="axis-fill" style="width: {axis.score}%"></div>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <p class="narrative">{model.result.narrative}</p>

      <div class="retake-action">
        <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
      </div>
    </section>
  {:else}
    <section class="quiz celestial-card-glass">
      <div class="progress-bar-wrapper">
        <div class="progress-info">
          <span class="progress-badge">Trắc Nghiệm Tính Cách</span>
          <span class="progress-counter">{progressLabel()}</span>
        </div>
        <div class="quiz-track">
          <div
            class="quiz-progress-fill"
            style="width: {((model.currentIndex + 1) / model.total) * 100}%"
          ></div>
        </div>
      </div>

      <h2 class="question" id="mbti-question">{model.currentQuestion.text}</h2>

      <fieldset class="likert" aria-labelledby="mbti-question">
        <legend class="sr-only">{model.currentQuestion.text}</legend>
        <div class="poles">
          <p class="pole pole-a">{model.currentQuestion.choiceA.text}</p>
          <p class="pole pole-b">{model.currentQuestion.choiceB.text}</p>
        </div>

        <div class="scale">
          {#each likertValues as value (value)}
            <button
              type="button"
              class="scale-dot"
              class:selected={model.currentChoice === value}
              aria-pressed={model.currentChoice === value}
              aria-label={value === 1 ? copy.likertStronglyA : value === 4 ? copy.likertNeutral : value === 7 ? copy.likertStronglyB : String(value)}
              onclick={() => model.select(value)}
            >
              <span class="dot-num">{value}</span>
            </button>
          {/each}
        </div>
      </fieldset>

      {#if model.validationMessage}
        <NoticeBanner message={model.validationMessage} tone="warning" />
      {/if}
      {#if model.isError && model.errorMessage}
        <NoticeBanner message={model.errorMessage} tone="danger" />
      {/if}

      <div class="nav">
        <PrimaryButton
          label={copy.previousButton}
          variant="surface"
          disabled={model.isFirst || model.isSubmitting}
          onclick={() => model.previous()}
        />
        {#if model.isLast}
          <PrimaryButton
            label={copy.submitButton}
            loading={model.isSubmitting}
            disabled={!model.allAnswered}
            onclick={() => model.submit()}
          />
        {:else}
          <PrimaryButton label={copy.nextButton} disabled={model.isSubmitting} onclick={() => model.next()} />
        {/if}
      </div>
    </section>
  {/if}
</AppScaffold>

<style>
  .celestial-card-glass {
    position: relative;
    background: rgba(18, 12, 38, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 24px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 32px 28px;
    max-width: 720px;
    margin: 0 auto;
  }

  .quiz,
  .result {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .progress-bar-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .progress-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd700;
  }

  .progress-counter {
    color: #dfd4b8;
    font-size: 13px;
    font-weight: 600;
  }

  .quiz-track {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    overflow: hidden;
  }

  .quiz-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d4af37, #ffd700);
    border-radius: 999px;
    transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .question {
    margin: 0;
    font-family: 'Cinzel', 'Noto Serif', serif;
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.4;
    text-align: center;
    padding: 8px 0;
  }

  .likert {
    display: flex;
    flex-direction: column;
    gap: 18px;
    border: 1px solid rgba(212, 175, 55, 0.2);
    background: rgba(10, 7, 22, 0.6);
    border-radius: 20px;
    padding: 24px 20px;
    margin: 0;
  }

  .poles {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .pole {
    margin: 0;
    font-size: 14px;
    color: #dfd4b8;
    line-height: 1.4;
  }

  .pole-a {
    font-weight: 600;
    color: #fce99f;
    max-width: 45%;
  }

  .pole-b {
    font-weight: 600;
    color: #c084fc;
    text-align: right;
    max-width: 45%;
  }

  .scale {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
  }

  .scale-dot {
    aspect-ratio: 1;
    border: 1.5px solid rgba(212, 175, 55, 0.25);
    border-radius: 50%;
    background: rgba(18, 12, 38, 0.8);
    color: #dfd4b8;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .scale-dot:hover:not(.selected) {
    border-color: #ffd700;
    background: rgba(212, 175, 55, 0.15);
    transform: scale(1.08);
  }

  .scale-dot.selected {
    border-color: #ffd700;
    background: linear-gradient(135deg, #ffd700, #b8860b);
    color: #0d0722;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    transform: scale(1.15);
  }

  .scale-dot:focus-visible {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
  }

  .nav {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 8px;
  }

  /* Kết quả */
  .result-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    padding: 24px 16px;
    background: radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
    border-radius: 20px;
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .result-eyebrow {
    margin: 0;
    color: #e6ca65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .result-type {
    margin: 0;
    font-size: 56px;
    font-weight: 900;
    letter-spacing: 0.08em;
    font-family: 'Cinzel', 'Noto Serif', serif;
    background: linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.5));
  }

  .axes-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .axes {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .axis {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 18px;
    border: 1px solid rgba(212, 175, 55, 0.18);
    background: rgba(10, 7, 22, 0.5);
    border-radius: 14px;
  }

  .axis-head {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: #f7eed8;
    font-size: 14px;
  }

  .axis-score {
    color: #ffd700;
    font-weight: 700;
  }

  .axis-track {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    overflow: hidden;
  }

  .axis-fill {
    height: 100%;
    background: linear-gradient(90deg, #a855f7, #ffd700);
    border-radius: 999px;
  }

  .narrative {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: #dfd4b8;
    background: rgba(10, 7, 22, 0.5);
    padding: 20px;
    border-radius: 16px;
    border-left: 3px solid #ffd700;
  }

  .retake-action {
    display: flex;
    justify-content: flex-end;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 640px) {
    .celestial-card-glass {
      padding: 20px 16px;
      border-radius: 18px;
    }

    .question {
      font-size: 18px;
    }

    .scale {
      gap: 6px;
    }

    .scale-dot {
      font-size: 13px;
    }
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .celestial-card-glass {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 16px 40px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .progress-badge {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.45);
    color: #854d0e;
  }

  :global([data-theme="light"]) .progress-counter {
    color: #57534e;
  }

  :global([data-theme="light"]) .quiz-track {
    background: rgba(0, 0, 0, 0.08);
  }

  :global([data-theme="light"]) .question {
    color: #180d38;
  }

  :global([data-theme="light"]) .likert {
    background: rgba(248, 246, 240, 0.85);
    border-color: rgba(212, 175, 55, 0.35);
  }

  :global([data-theme="light"]) .pole {
    color: #44403c;
  }

  :global([data-theme="light"]) .pole-a {
    color: #78350f;
  }

  :global([data-theme="light"]) .pole-b {
    color: #6b21a8;
  }

  :global([data-theme="light"]) .scale-dot {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.35);
    color: #292524;
  }

  :global([data-theme="light"]) .scale-dot:hover:not(.selected) {
    background: rgba(254, 243, 199, 0.6);
    border-color: #b45309;
  }

  :global([data-theme="light"]) .result-header {
    background: radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .result-eyebrow {
    color: #854d0e;
  }

  :global([data-theme="light"]) .result-type {
    background: linear-gradient(135deg, #180d38 0%, #b45309 60%, #78350f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 8px rgba(212, 175, 55, 0.3));
  }

  :global([data-theme="light"]) .axis {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .axis-head {
    color: #1c1917;
  }

  :global([data-theme="light"]) .axis-score {
    color: #b45309;
  }

  :global([data-theme="light"]) .axis-track {
    background: rgba(0, 0, 0, 0.08);
  }

  :global([data-theme="light"]) .narrative {
    background: rgba(248, 246, 240, 0.85);
    color: #292524;
    border-left-color: #d97706;
  }
</style>

