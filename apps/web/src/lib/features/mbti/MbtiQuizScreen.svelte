<script lang="ts">
  // MbtiQuizScreen (US-017b): trắc nghiệm MBTI từng câu một + màn kết quả. Bộ câu hỏi lấy từ
  // contracts (MBTI_QUESTIONS) qua model; submit gọi POST /quizzes/mbti. Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
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

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#snippet action()}
    <PrimaryButton label={copy.returnToDashboard} variant="surface" onclick={goToDashboard} />
  {/snippet}

  {#if model.result}
    <section class="result" aria-live="polite">
      <p class="result-eyebrow">{copy.resultTitle}</p>
      <p class="result-type">{model.result.type}</p>
      <ul class="axes">
        {#each model.result.axes as axis (axis.key)}
          <li class="axis">
            <span class="axis-label">{axis.label}</span>
            <span class="axis-score">{axis.score}%</span>
          </li>
        {/each}
      </ul>
      <p class="narrative">{model.result.narrative}</p>
      <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
    </section>
  {:else}
    <section class="quiz">
      <p class="progress">{progressLabel()}</p>
      <h2 class="question" id="mbti-question">{model.currentQuestion.text}</h2>

      <fieldset class="likert" aria-labelledby="mbti-question">
        <legend class="sr-only">{model.currentQuestion.text}</legend>
        <p class="pole pole-a">{model.currentQuestion.choiceA.text}</p>
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
              {value}
            </button>
          {/each}
        </div>
        <p class="pole pole-b">{model.currentQuestion.choiceB.text}</p>
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
  .quiz,
  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    max-width: 640px;
  }

  .progress {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .question {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  .likert {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin: 0;
  }

  .pole {
    margin: 0;
    font-size: 15px;
  }

  .pole-a {
    font-weight: 600;
  }

  .pole-b {
    font-weight: 600;
    text-align: right;
  }

  .scale {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-xs);
  }

  .scale-dot {
    aspect-ratio: 1;
    border: 1px solid var(--color-border-hairline);
    border-radius: 50%;
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    cursor: pointer;
  }

  .scale-dot.selected {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-primary-soft);
  }

  .scale-dot:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .nav {
    display: flex;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .result-eyebrow {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.125px;
  }

  .result-type {
    margin: 0;
    font-size: 40px;
    font-weight: 700;
  }

  .axes {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .axis {
    display: flex;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
  }

  .axis-label {
    font-weight: 600;
  }

  .narrative {
    margin: 0;
    line-height: 1.6;
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
</style>

