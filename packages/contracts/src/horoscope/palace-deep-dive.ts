import { z } from 'zod';

export const palaceAspectRelationsSchema = z.object({
  /** Cung đối xung (đối diện 180 độ) */
  opposite: z.object({
    nameKey: z.string(),
    nameVi: z.string(),
    earthlyBranch: z.string(),
    mainStars: z.array(z.string()),
  }),
  /** Cung tam hợp 1 */
  trine1: z.object({
    nameKey: z.string(),
    nameVi: z.string(),
    earthlyBranch: z.string(),
    mainStars: z.array(z.string()),
  }),
  /** Cung tam hợp 2 */
  trine2: z.object({
    nameKey: z.string(),
    nameVi: z.string(),
    earthlyBranch: z.string(),
    mainStars: z.array(z.string()),
  }),
  /** 2 cung giáp sườn */
  flanking: z.array(
    z.object({
      nameKey: z.string(),
      nameVi: z.string(),
      earthlyBranch: z.string(),
      keyStars: z.array(z.string()),
    }),
  ),
});

export type PalaceAspectRelations = z.infer<typeof palaceAspectRelationsSchema>;

export const palaceRemedyAdviceSchema = z.object({
  /** Tóm lược phương hướng năng lượng */
  energySummary: z.string(),
  /** Lời khuyên hành động cụ thể */
  actionAdvice: z.array(z.string()),
  /** Hướng phong thủy / ngũ hành cải vận */
  fengShuiTips: z.array(z.string()),
  /** Màu sắc / con số may mắn */
  luckyElements: z.object({
    colors: z.array(z.string()),
    directions: z.array(z.string()),
  }),
});

export type PalaceRemedyAdvice = z.infer<typeof palaceRemedyAdviceSchema>;

export const palaceDeepDiveAnalysisSchema = z.object({
  palaceKey: z.string(),
  palaceNameVi: z.string(),
  earthlyBranch: z.string(),
  heavenlyStem: z.string(),
  elementNapAm: z.string().optional(),
  isBodyPalace: z.boolean(),
  isOriginalPalace: z.boolean(),
  /** Tứ hóa tại chính cung (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) */
  mutagensInPalace: z.array(z.string()),
  /** Đánh giá tổng quan độ vượng của cung (0 - 100) */
  vigorScore: z.number().min(0).max(100),
  /** Tam phương tứ chính và cung giáp */
  aspects: palaceAspectRelationsSchema,
  /** Lời khuyên cải vận */
  remedy: palaceRemedyAdviceSchema,
  /** Đoạn văn bản luận giải tóm lược phục vụ AI Audio Advisor đọc */
  audioNarrativeScript: z.string(),
});

export type PalaceDeepDiveAnalysis = z.infer<typeof palaceDeepDiveAnalysisSchema>;
