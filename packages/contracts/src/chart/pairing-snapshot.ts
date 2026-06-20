import { z } from 'zod';
import { chartSnapshotSchema } from './chart-snapshot';

// Hợp Hôn (pairing): ghép 2 lá số (primary + partner).
// Snapshot có thể là ziwei hoặc các hệ khác; hiện tại chủ yếu ziwei.
export const pairingSnapshotSchema = z.object({
  primary: chartSnapshotSchema,
  partner: chartSnapshotSchema,
  // Tóm tắt tương hợp (điểm số theo cung, tổng thể).
  compatibility: z.object({
    overallScore: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }).optional(),
});

export type PairingSnapshot = z.infer<typeof pairingSnapshotSchema>;
