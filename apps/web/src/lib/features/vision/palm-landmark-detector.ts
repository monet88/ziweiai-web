// US-031 (backlog #25): nạp MediaPipe HandLandmarker LAZY (dynamic import) để không phình bundle
// route Xem Tay và không vỡ static build. Mọi thứ chạy 100% phía client, KHÔNG gọi backend.
//
// Model + wasm tải từ CDN của MediaPipe nên không cần bundle asset nhị phân vào SPA tĩnh. Nếu CDN
// hỏng / offline / WebGL không khả dụng, detect() ném lỗi và caller (overlay) tự thoái lui êm —
// luồng upload + luận giải Xem Tay không phụ thuộc lớp phủ này.
import type { NormalizedLandmark } from './palm-overlay-geometry';

const WASM_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const HAND_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Kiểu tối thiểu cần dùng — tránh phụ thuộc cứng vào type của package ở tầng module (import động).
interface HandLandmarkerResult {
  readonly landmarks: ReadonlyArray<ReadonlyArray<NormalizedLandmark>>;
}

interface HandLandmarkerInstance {
  detect(image: HTMLImageElement): HandLandmarkerResult;
  close?(): void;
}

let landmarkerPromise: Promise<HandLandmarkerInstance> | null = null;

/** Tải (một lần, có cache) HandLandmarker ở chế độ ảnh tĩnh. Lỗi tải sẽ reset cache để thử lại sau. */
async function loadHandLandmarker(): Promise<HandLandmarkerInstance> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE_URL);
      return (await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: HAND_LANDMARKER_MODEL_URL },
        runningMode: 'IMAGE',
        numHands: 1,
      })) as unknown as HandLandmarkerInstance;
    })().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
}

/**
 * Phát hiện 21 landmark bàn tay trên một ảnh đã tải xong. Trả mảng landmark chuẩn hoá [0..1] của
 * bàn tay đầu tiên, hoặc null nếu không thấy bàn tay nào. Ném lỗi nếu không nạp được model/wasm.
 */
export async function detectHandLandmarks(
  image: HTMLImageElement,
): Promise<NormalizedLandmark[] | null> {
  const landmarker = await loadHandLandmarker();
  const result = landmarker.detect(image);
  const first = result.landmarks?.[0];
  if (!first || first.length === 0) {
    return null;
  }
  return first.map((point) => ({ x: point.x, y: point.y, z: point.z }));
}
