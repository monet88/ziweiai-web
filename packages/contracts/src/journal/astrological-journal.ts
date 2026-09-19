import { z } from 'zod';

export const journalMoodSchema = z.enum([
  'HAN_HOAN', // Hân hoan, phấn chấn
  'BINH_AN',  // Bình an, tĩnh tại
  'LO_AU',    // Lo âu, bất an
  'MET_MOI',  // Mệt mỏi, uể oải
  'CANG_THANG', // Căng thẳng, bức bối
]);

export type JournalMood = z.infer<typeof journalMoodSchema>;

export const astrologicalJournalEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD'),
  lunarDateStr: z.string(),
  canChiDay: z.string(),
  mood: journalMoodSchema,
  eventNotes: z.string(),
  /** Đánh giá thực tế của người dùng từ 1 đến 5 sao */
  actualRating: z.number().int().min(1).max(5),
  /** Chỉ số cộng hưởng năng lượng giữa tâm trạng và sao/vận ngày (0 - 100%) */
  resonanceScore: z.number().min(0).max(100),
  /** Nhận định tương quan từ AI */
  resonanceInsight: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AstrologicalJournalEntry = z.infer<typeof astrologicalJournalEntrySchema>;

export const createJournalEntryRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD'),
  lunarDateStr: z.string().optional(),
  canChiDay: z.string().optional(),
  mood: journalMoodSchema,
  eventNotes: z.string().max(2000, 'Ghi chú tối đa 2000 ký tự'),
  actualRating: z.number().int().min(1).max(5),
});

export type CreateJournalEntryRequest = z.infer<typeof createJournalEntryRequestSchema>;

export const astrologicalJournalListResponseSchema = z.object({
  entries: z.array(astrologicalJournalEntrySchema),
  currentStreakDays: z.number().int().nonnegative(),
  averageResonanceScore: z.number().min(0).max(100),
  totalEntriesCount: z.number().int().nonnegative(),
});

export type AstrologicalJournalListResponse = z.infer<typeof astrologicalJournalListResponseSchema>;
