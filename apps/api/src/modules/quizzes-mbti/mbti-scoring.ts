import { MBTI_QUESTION_BY_ID, type MbtiAnswer, type MbtiResult } from '@ziweiai/contracts';

// Thang Likert 1..7 -> trọng số về hai cực (port nguyên .ref/taibu/src/lib/divination/mbti.ts):
// 1 = rất đồng ý choiceA (+3 cho cực A), 4 = trung lập (0/0), 7 = rất đồng ý choiceB (+3 cho cực B).
const LIKERT_WEIGHTS: Record<number, { a: number; b: number }> = {
  1: { a: 3, b: 0 },
  2: { a: 2, b: 0 },
  3: { a: 1, b: 0 },
  4: { a: 0, b: 0 },
  5: { a: 0, b: 1 },
  6: { a: 0, b: 2 },
  7: { a: 0, b: 3 },
};

type Dimension = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

// Nhãn cực tiếng Việt (bất biến 0 chữ Hán) — dùng cho axes[].label.
const DIMENSION_LABEL: Record<Dimension, string> = {
  E: 'Hướng ngoại (E)',
  I: 'Hướng nội (I)',
  S: 'Giác quan (S)',
  N: 'Trực giác (N)',
  T: 'Lý trí (T)',
  F: 'Cảm xúc (F)',
  J: 'Nguyên tắc (J)',
  P: 'Linh hoạt (P)',
};

interface AxisPair {
  readonly key: 'EI' | 'SN' | 'TF' | 'JP';
  readonly first: Dimension; // cực ưu tiên khi hòa điểm (port tie-break taibu: >= chọn cực đầu)
  readonly second: Dimension;
}

const AXES: readonly AxisPair[] = [
  { key: 'EI', first: 'E', second: 'I' },
  { key: 'SN', first: 'S', second: 'N' },
  { key: 'TF', first: 'T', second: 'F' },
  { key: 'JP', first: 'J', second: 'P' },
];

/**
 * Tính kết quả MBTI từ mảng câu trả lời Likert (port calculateResult của taibu, map sang
 * mbtiResultSchema). Tie-break giống nguồn: khi điểm hai cực bằng nhau, chọn cực đầu (E/S/T/J).
 *
 * `score` của mỗi trục = phần trăm của cực ƯU THẾ (50..100, làm tròn); `label` = nhãn Việt của
 * cực ưu thế. Câu trả lời có questionId không khớp bộ câu hỏi sẽ bị bỏ qua (không cộng điểm).
 * `narrative` KHÔNG sinh ở đây — service quyết định (deterministic hoặc LLM).
 */
export function scoreMbti(answers: readonly MbtiAnswer[]): Omit<MbtiResult, 'narrative'> {
  const scores: Record<Dimension, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const answer of answers) {
    const question = MBTI_QUESTION_BY_ID.get(answer.questionId);
    if (!question) {
      continue;
    }
    const weights = LIKERT_WEIGHTS[answer.choice];
    if (!weights) {
      continue;
    }
    scores[question.choiceA.dimension] += weights.a;
    scores[question.choiceB.dimension] += weights.b;
  }

  const typeLetters: string[] = [];
  const axes: MbtiResult['axes'] = AXES.map((axis) => {
    const firstScore = scores[axis.first];
    const secondScore = scores[axis.second];
    const total = firstScore + secondScore;
    // Hòa điểm (gồm cả trường hợp total=0) -> chọn cực đầu, hiển thị 50%.
    const dominant = firstScore >= secondScore ? axis.first : axis.second;
    const dominantScore = firstScore >= secondScore ? firstScore : secondScore;
    const percent = total === 0 ? 50 : Math.round((dominantScore / total) * 100);
    typeLetters.push(dominant);
    return { key: axis.key, score: percent, label: DIMENSION_LABEL[dominant] };
  });

  return {
    type: typeLetters.join('') as MbtiResult['type'],
    axes,
  };
}
