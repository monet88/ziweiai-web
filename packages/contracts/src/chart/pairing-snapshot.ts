import { z } from 'zod';
import { chartSnapshotSchema } from './chart-snapshot';
import { birthInputSchema } from './birth-input';

// Loại quan hệ cần ghép (US-017c, port HepanType của taibu): tình cảm / hợp tác / gia đình.
export const pairingRelationTypeSchema = z.enum(['love', 'business', 'family']);

// Một chiều tương hợp (ví dụ "Ngũ hành phối hợp"): điểm 0-100 + mô tả tiếng Việt (0 chữ Hán).
export const pairingCompatibilityDimensionSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(100),
  description: z.string().min(1),
});

// Tóm tắt tương hợp: điểm tổng + nhãn mức + các chiều + diễn giải. Tính deterministic từ 2
// birth-input (bazi/ngũ hành) ở astro-engine, không phải từ ziwei snapshot.
export const pairingCompatibilitySchema = z.object({
  overallScore: z.number().min(0).max(100),
  level: z.string().min(1),
  dimensions: z.array(pairingCompatibilityDimensionSchema).min(1),
  narrative: z.string().min(1),
});

// Hợp Hôn (pairing): ghép 2 lá số ziwei (primary + partner) + tóm tắt tương hợp.
export const pairingSnapshotSchema = z.object({
  primary: chartSnapshotSchema,
  partner: chartSnapshotSchema,
  relationType: pairingRelationTypeSchema,
  compatibility: pairingCompatibilitySchema,
});

// Body POST /pairings: 2 birth-input + loại quan hệ.
export const pairingRequestSchema = z.object({
  primary: birthInputSchema,
  partner: birthInputSchema,
  relationType: pairingRelationTypeSchema,
});

export type PairingRelationType = z.infer<typeof pairingRelationTypeSchema>;
export type PairingCompatibilityDimension = z.infer<typeof pairingCompatibilityDimensionSchema>;
export type PairingCompatibility = z.infer<typeof pairingCompatibilitySchema>;
export type PairingSnapshot = z.infer<typeof pairingSnapshotSchema>;
export type PairingRequest = z.infer<typeof pairingRequestSchema>;
