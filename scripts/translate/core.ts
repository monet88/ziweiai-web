// Lõi thuần của pipeline dịch Hán -> Việt cho dữ liệu hệ B6 (backlog #41 / US-033).
//
// Tách hẳn khỏi lớp gọi LLM để test được không cần network: mọi hàm ở đây nhận
// dữ liệu vào, trả dữ liệu ra, không I/O. Lớp client (translate-client.ts) lo việc
// gọi OpenAI-compatible; runner (run.ts) lo đọc/ghi file + cache.
//
// Đơn vị dịch (TranslationUnit) là cặp {id, text}. Mỗi hệ B6 tự flatten dataset
// của mình thành mảng unit rồi re-assemble theo id sau khi dịch xong. Pipeline
// không biết gì về cấu trúc dataset từng hệ — chỉ làm việc trên id + text.

// Pattern CJK đồng bộ với @ziweiai/core (cjk-guard.ts) + web (cjk.ts): Han + Kana
// + Hangul + Bopomofo + dấu câu/ fullwidth CJK. Copy tại chỗ vì script tooling
// không thuộc workspace package nào và không nên kéo @ziweiai/core (iztro + ephemeris).
// Không dùng cờ g để .test() không giữ lastIndex giữa các lần gọi.
export const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

export function containsCjkText(value: string): boolean {
  return CJK_TEXT_PATTERN.test(value);
}

export type TranslationUnit = {
  readonly id: string;
  readonly text: string;
};

export type TranslatedUnit = {
  readonly id: string;
  readonly vi: string;
};

// Hàm gọi LLM dịch một batch. Trả về map id -> bản dịch. Tách thành type để core
// test được bằng fake (không network). Triển khai thật ở translate-client.ts.
export type BatchTranslator = (units: readonly TranslationUnit[]) => Promise<ReadonlyMap<string, string>>;

export type TranslateOptions = {
  readonly batchSize?: number;
  // Bản dịch đã có sẵn (từ cache lần chạy trước): id -> vi. Unit có id trong đây
  // được bỏ qua, không gọi LLM lại -> hỗ trợ resume cho dataset lớn (xin xăm 387KB).
  readonly cache?: ReadonlyMap<string, string>;
  // Số lần thử lại cho mỗi unit còn rò chữ Hán sau lần dịch đầu (dịch lại riêng).
  readonly maxRetries?: number;
};

export type TranslateReport = {
  readonly translated: ReadonlyMap<string, string>;
  readonly fromCache: number;
  readonly fromLlm: number;
  readonly retried: number;
};

export class TranslationError extends Error {}

const DEFAULT_BATCH_SIZE = 40;
const DEFAULT_MAX_RETRIES = 2;

// Chia mảng thành các batch kích thước cố định. Batch cuối có thể ngắn hơn.
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) {
    throw new TranslationError(`batchSize phải >= 1, nhận ${size}.`);
  }
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

// Kiểm bất biến trước khi dịch: id phải duy nhất + không rỗng. Trùng id sẽ làm
// re-assemble sai (ghi đè lẫn nhau) nên phải fail-fast.
export function assertUniqueIds(units: readonly TranslationUnit[]): void {
  const seen = new Set<string>();
  for (const unit of units) {
    if (unit.id.length === 0) {
      throw new TranslationError('Gặp unit có id rỗng.');
    }
    if (seen.has(unit.id)) {
      throw new TranslationError(`Trùng id "${unit.id}" trong tập unit cần dịch.`);
    }
    seen.add(unit.id);
  }
}

// Dịch toàn bộ unit qua translator, theo batch, có cache + retry cho phần còn rò Hán.
// Bất biến đầu ra: mọi unit đầu vào đều có bản dịch (đếm khớp) và KHÔNG bản dịch nào
// còn chứa chữ Hán/CJK. Vi phạm -> ném TranslationError (fail-fast, không ghi file bẩn).
export async function translateUnits(
  units: readonly TranslationUnit[],
  translator: BatchTranslator,
  options: TranslateOptions = {},
): Promise<TranslateReport> {
  assertUniqueIds(units);

  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const cache = options.cache ?? new Map<string, string>();

  const result = new Map<string, string>();
  let fromCache = 0;
  let fromLlm = 0;
  let retried = 0;

  // Bỏ qua unit đã có trong cache (và cache sạch Hán). Cache còn Hán coi như miss
  // để dịch lại — không tin một bản dịch hỏng từ lần trước.
  const pending: TranslationUnit[] = [];
  for (const unit of units) {
    const cached = cache.get(unit.id);
    if (cached !== undefined && !containsCjkText(cached)) {
      result.set(unit.id, cached);
      fromCache += 1;
    } else {
      pending.push(unit);
    }
  }

  for (const batch of chunk(pending, batchSize)) {
    const translatedMap = await translator(batch);
    for (const unit of batch) {
      const vi = translatedMap.get(unit.id);
      if (vi === undefined) {
        throw new TranslationError(`Translator không trả bản dịch cho id "${unit.id}".`);
      }
      result.set(unit.id, vi);
      fromLlm += 1;
    }
  }

  // Dịch lại riêng từng unit còn rò Hán. Mỗi lần retry gọi translator với batch
  // một phần tử để LLM tập trung. Hết lượt mà vẫn còn Hán -> fail-fast.
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const dirty = units.filter((unit) => {
      const vi = result.get(unit.id);
      return vi !== undefined && containsCjkText(vi);
    });
    if (dirty.length === 0) {
      break;
    }
    for (const unit of dirty) {
      const translatedMap = await translator([unit]);
      const vi = translatedMap.get(unit.id);
      if (vi !== undefined) {
        result.set(unit.id, vi);
        retried += 1;
      }
    }
  }

  validateTranslation(units, result);

  return { translated: result, fromCache, fromLlm, retried };
}

// Bất biến đầu ra cuối cùng: đếm khớp + không rò Hán. Dùng lại được ở chỗ khác
// (vd test, hoặc kiểm cache đã ghi). Ném TranslationError kèm chi tiết khi sai.
export function validateTranslation(
  units: readonly TranslationUnit[],
  translated: ReadonlyMap<string, string>,
): void {
  if (translated.size !== units.length) {
    throw new TranslationError(
      `Số bản dịch (${translated.size}) không khớp số unit đầu vào (${units.length}).`,
    );
  }
  const missing: string[] = [];
  const stillHan: string[] = [];
  for (const unit of units) {
    const vi = translated.get(unit.id);
    if (vi === undefined) {
      missing.push(unit.id);
      continue;
    }
    if (containsCjkText(vi)) {
      stillHan.push(unit.id);
    }
  }
  if (missing.length > 0) {
    throw new TranslationError(`Thiếu bản dịch cho ${missing.length} unit: ${missing.slice(0, 10).join(', ')}.`);
  }
  if (stillHan.length > 0) {
    throw new TranslationError(
      `Còn ${stillHan.length} bản dịch chứa chữ Hán sau khi retry: ${stillHan.slice(0, 10).join(', ')}.`,
    );
  }
}
