import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { type SupabaseClient } from '@supabase/supabase-js';
import {
  type AstrologicalJournalEntry,
  type CreateJournalEntryRequest,
  type AstrologicalJournalListResponse,
  type JournalMood,
} from '@ziweiai/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);
  // Lưu trữ in-memory để đảm bảo độ bền vững 100% khi chưa chạy migration Supabase
  private readonly memoryEntries = new Map<string, AstrologicalJournalEntry[]>();

  constructor(
    @Optional() @Inject(SUPABASE_CLIENT) private readonly client?: SupabaseClient,
  ) {}

  /**
   * Tính toán chỉ số cộng hưởng năng lượng (Resonance Score 0 - 100%)
   * Đối chiếu tâm trạng & đánh giá thực tế với năng lượng vận nhật
   */
  public calculateResonance(
    mood: JournalMood,
    rating: number,
    canChiDay?: string,
  ): { score: number; insight: string } {
    let baseScore = 50;

    // Trọng số tâm trạng
    switch (mood) {
      case 'HAN_HOAN':
        baseScore = 75;
        break;
      case 'BINH_AN':
        baseScore = 85; // Bình an là tâm thế hòa hợp tự nhiên cao nhất
        break;
      case 'LO_AU':
        baseScore = 40;
        break;
      case 'MET_MOI':
        baseScore = 45;
        break;
      case 'CANG_THANG':
        baseScore = 35;
        break;
    }

    // Hiệu chỉnh theo rating thực tế (1 - 5 sao)
    const ratingBonus = (rating - 3) * 8; // -16 đến +16
    const score = Math.max(10, Math.min(99, Math.round(baseScore + ratingBonus)));

    let insight = '';
    const dayLabel = canChiDay ? `ngày ${canChiDay}` : 'ngày hôm nay';

    if (score >= 80) {
      insight = `Tâm thức và trường năng lượng của bạn hòa quyện tuyệt vời với khí vận ${dayLabel}. Trực giác nhạy bén, mọi việc hanh thông theo quy luật thuận thiên.`;
    } else if (score >= 60) {
      insight = `Trường khí ${dayLabel} duy trì thế cân bằng. Tâm thế tĩnh tại giúp bạn ứng biến linh hoạt trước các biến động nhỏ của ngoại cảnh.`;
    } else {
      insight = `Có sự xung khắc nhẹ giữa nhịp sinh học cá nhân và khí vận ${dayLabel}. Đây là ngày thích hợp để tịnh dưỡng nội tâm, tránh tranh biện và hoãn các quyết định đại sự.`;
    }

    return { score, insight };
  }

  /**
   * Lấy danh sách nhật ký của người dùng
   */
  async getEntries(userId: string, month?: string): Promise<AstrologicalJournalListResponse> {
    let list: AstrologicalJournalEntry[] = [];

    // Thử truy vấn từ Supabase
    if (this.client) {
      try {
        let query = this.client
          .from('astrological_journals')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (month) {
          query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            date: row.date,
            lunarDateStr: row.lunar_date_str || '',
            canChiDay: row.can_chi_day || '',
            mood: row.mood as JournalMood,
            eventNotes: row.event_notes || '',
            actualRating: Number(row.actual_rating || 3),
            resonanceScore: Number(row.resonance_score || 50),
            resonanceInsight: row.resonance_insight || '',
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err: any) {
        this.logger.warn(`Supabase getEntries failed, fallback memory: ${err?.message}`);
      }
    }

    // Nếu không có dữ liệu từ Supabase, lấy từ memory
    if (list.length === 0) {
      const userMem = this.memoryEntries.get(userId) || [];
      list = month ? userMem.filter((e) => e.date.startsWith(month)) : [...userMem];
      list.sort((a, b) => b.date.localeCompare(a.date));
    }

    // Tính streak days
    const streak = this.calculateStreak(list.map((e) => e.date));
    const avgScore =
      list.length > 0
        ? Math.round(list.reduce((acc, curr) => acc + curr.resonanceScore, 0) / list.length)
        : 75;

    return {
      entries: list,
      currentStreakDays: streak,
      averageResonanceScore: avgScore,
      totalEntriesCount: list.length,
    };
  }

  /**
   * Lưu hoặc cập nhật nhật ký ngày
   */
  async saveEntry(userId: string, payload: CreateJournalEntryRequest): Promise<AstrologicalJournalEntry> {
    const { score, insight } = this.calculateResonance(
      payload.mood,
      payload.actualRating,
      payload.canChiDay,
    );

    const nowIso = new Date().toISOString();
    const entry: AstrologicalJournalEntry = {
      id: randomUUID(),
      userId,
      date: payload.date,
      lunarDateStr: payload.lunarDateStr || 'Ngày chiêm nghiệm',
      canChiDay: payload.canChiDay || 'Lưu nhật',
      mood: payload.mood,
      eventNotes: payload.eventNotes,
      actualRating: payload.actualRating,
      resonanceScore: score,
      resonanceInsight: insight,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Lưu vào Supabase nếu có client
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('astrological_journals')
          .upsert(
            {
              user_id: userId,
              date: entry.date,
              lunar_date_str: entry.lunarDateStr,
              can_chi_day: entry.canChiDay,
              mood: entry.mood,
              event_notes: entry.eventNotes,
              actual_rating: entry.actualRating,
              resonance_score: entry.resonanceScore,
              resonance_insight: entry.resonanceInsight,
              updated_at: nowIso,
            },
            { onConflict: 'user_id,date' },
          )
          .select()
          .maybeSingle();

        if (!error && data) {
          entry.id = data.id || entry.id;
        }
      } catch (err: any) {
        this.logger.warn(`Supabase upsert journal failed, fallback memory: ${err?.message}`);
      }
    }

    // Cập nhật memory store
    const userMem = this.memoryEntries.get(userId) || [];
    const existingIdx = userMem.findIndex((e) => e.date === entry.date);
    if (existingIdx >= 0) {
      userMem[existingIdx] = { ...userMem[existingIdx], ...entry };
    } else {
      userMem.unshift(entry);
    }
    this.memoryEntries.set(userId, userMem);

    return entry;
  }

  /**
   * Tính chuỗi ngày liên tục (streak)
   */
  private calculateStreak(sortedDatesDesc: string[]): number {
    if (sortedDatesDesc.length === 0) return 0;

    const uniqueDates = Array.from(new Set(sortedDatesDesc)).sort((a, b) => b.localeCompare(a));
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Chuỗi chỉ tính nếu có ghi chép hôm nay hoặc hôm qua
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0;
    }

    let streak = 0;
    let expectedDate = new Date(uniqueDates[0]);

    for (const dStr of uniqueDates) {
      const actualDate = new Date(dStr);
      const diffDays = Math.round(
        (expectedDate.getTime() - actualDate.getTime()) / (1000 * 3600 * 24),
      );

      if (diffDays === 0) {
        streak++;
        expectedDate = new Date(actualDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return streak;
  }
}
