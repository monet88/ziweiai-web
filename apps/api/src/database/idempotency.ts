import { createHash } from 'node:crypto';

function stableHash(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

export function buildChartSnapshotDedupeKey(params: {
  ownerUserId: string;
  chartSystem: string;
  inputHashDigest: string;
  engineSemver: string;
  ruleSourceVersion: string;
  schemaVersion: string;
  viewYear?: number;
}): string {
  const parts = [
    params.ownerUserId,
    params.chartSystem,
    params.inputHashDigest,
    params.engineSemver,
    params.ruleSourceVersion,
    params.schemaVersion,
  ];

  // Chỉ đưa viewYear vào khóa cho hệ lá số phụ thuộc lưu niên. Hệ không phụ thuộc
  // (vd Bát Tự) bỏ qua để cùng đầu vào không tạo bản ghi trùng theo từng năm.
  if (params.viewYear !== undefined) {
    parts.push(String(params.viewYear));
  }

  return stableHash(parts);
}

export function buildExplanationRequestIdempotencyKey(params: {
  ownerUserId: string;
  chartSnapshotId: string;
  providerName: string;
  explanationKind: string;
  palaceScope?: string;
}): string {
  const parts = [
    params.ownerUserId,
    params.chartSnapshotId,
    params.providerName,
    params.explanationKind,
  ];

  // Chỉ nối palaceScope khi có để khóa luận giải tổng quan (không cung) giữ nguyên
  // giá trị cũ — tránh tạo bản ghi trùng cho dữ liệu đã sinh trước Phase 5.
  if (params.palaceScope !== undefined) {
    parts.push(params.palaceScope);
  }

  return stableHash(parts);
}
