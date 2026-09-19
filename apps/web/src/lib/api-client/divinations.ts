import {
  createDivinationResponseSchema,
  mbtiResultSchema,
  pairingSnapshotSchema,
  visionAnalysisSchema,
  tarotDrawSchema,
  lenormandDrawSchema,
  dreamInterpretationSchema,
  stickDrawSchema,
  almanacSelectionSchema,
  xiaoLiuRenDrawSchema,
  type CreateDivinationRequest,
  type CreateDivinationResponse,
  type MbtiAnswer,
  type MbtiResult,
  type PairingRequest,
  type PairingSnapshot,
  type VisionAnalysis,
  type VisionKind,
  type TarotDraw,
  type TarotSpread,
  type LenormandDraw,
  type LenormandSpread,
  type DreamInterpretation,
  type StickDraw,
  type AlmanacSelection,
  type AlmanacTopic,
  type XiaoLiuRenDraw,
  type XiaoLiuRenDrawRequest,
  numerologyExplainResponseSchema,
  type NumerologyExplainRequest,
  type NumerologyExplainResponse,
} from '@ziweiai/contracts';
import { fetchJson, fetchMultipart, fetchNoContent } from './fetch-json';

export function createDivination(
  token: string,
  request: CreateDivinationRequest,
): Promise<CreateDivinationResponse> {
  return fetchJson('/divinations', createDivinationResponseSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

export function createMbtiQuiz(token: string, answers: MbtiAnswer[]): Promise<MbtiResult> {
  return fetchJson('/quizzes/mbti', mbtiResultSchema, {
    method: 'POST',
    token,
    body: { answers },
  });
}

export function createPairing(token: string, request: PairingRequest): Promise<PairingSnapshot> {
  return fetchJson('/pairings', pairingSnapshotSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

export function createVisionAnalysis(
  token: string,
  kind: VisionKind,
  params: { image: File; question?: string },
): Promise<VisionAnalysis> {
  const form = new FormData();
  form.append('image', params.image);
  if (params.question && params.question.trim().length > 0) {
    form.append('question', params.question.trim());
  }
  return fetchMultipart(`/vision/${kind}`, visionAnalysisSchema, form, token);
}

export function deleteVisionResult(token: string, visionResultId: string): Promise<void> {
  return fetchNoContent(`/vision/results/${visionResultId}`, { method: 'DELETE', token });
}

export function drawTarot(
  token: string,
  params: { question: string; spread: TarotSpread; seed?: string },
): Promise<TarotDraw> {
  return fetchJson('/draws/tarot', tarotDrawSchema, {
    method: 'POST',
    token,
    body: {
      question: params.question,
      spread: params.spread,
      ...(params.seed ? { seed: params.seed } : {}),
    },
  });
}

export function drawLenormand(
  token: string,
  params: { question: string; spread: LenormandSpread; seed?: string },
): Promise<LenormandDraw> {
  return fetchJson('/draws/lenormand', lenormandDrawSchema, {
    method: 'POST',
    token,
      body: {
        question: params.question,
        spread: params.spread,
        ...(params.seed ? { seed: params.seed } : {}),
      },
    });
}

export function interpretDream(
  token: string,
  params: { dream: string },
): Promise<DreamInterpretation> {
  return fetchJson('/dreams/interpret', dreamInterpretationSchema, {
    method: 'POST',
    token,
    body: { dream: params.dream },
  });
}

export function drawStick(
  token: string,
  params: { question: string; seed?: string },
): Promise<StickDraw> {
  return fetchJson('/draws/stick', stickDrawSchema, {
    method: 'POST',
    token,
    body: {
      question: params.question,
      ...(params.seed ? { seed: params.seed } : {}),
    },
  });
}

export function selectAlmanac(
  token: string,
  params: { topic: AlmanacTopic; startDate: string; endDate: string },
): Promise<AlmanacSelection> {
  return fetchJson('/almanac/select', almanacSelectionSchema, {
    method: 'POST',
    token,
    body: {
      topic: params.topic,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  });
}

export function explainNumerology(
  token: string,
  params: NumerologyExplainRequest,
): Promise<NumerologyExplainResponse> {
  return fetchJson('/numerology/explain', numerologyExplainResponseSchema, {
    method: 'POST',
    token,
    body: params,
  });
}

export function drawXiaoLiuRen(
  token: string,
  params: XiaoLiuRenDrawRequest,
): Promise<XiaoLiuRenDraw> {
  return fetchJson('/draws/xiaoliuren', xiaoLiuRenDrawSchema, {
    method: 'POST',
    token,
    body: params,
  });
}

