import { describe, it, expect, beforeEach } from 'vitest';
import { JournalService } from './journal.service';
import type { CreateJournalEntryRequest } from '@ziweiai/contracts';

describe('JournalService', () => {
  let service: JournalService;

  beforeEach(() => {
    service = new JournalService();
  });

  describe('calculateResonance', () => {
    it('should calculate high resonance score for peaceful/joyful mood with 5-star rating', () => {
      const result = service.calculateResonance('BINH_AN', 5, 'Giáp Tý');
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.insight).toContain('Tâm thức và trường năng lượng của bạn');
    });

    it('should calculate lower resonance score for stressful mood with 1-star rating', () => {
      const result = service.calculateResonance('CANG_THANG', 1, 'Bính Ngọ');
      expect(result.score).toBeLessThan(40);
      expect(result.insight).toContain('xung khắc');
    });
  });

  describe('saveEntry and getEntries', () => {
    it('should save journal entry and retrieve list with streak calculation', async () => {
      const userId = 'test-user-uuid-1';
      const payload: CreateJournalEntryRequest = {
        date: new Date().toISOString().slice(0, 10),
        lunarDateStr: '15/08 Bính Ngọ',
        canChiDay: 'Giáp Dần',
        mood: 'HAN_HOAN',
        eventNotes: 'Hôm nay ký được hợp đồng quan trọng.',
        actualRating: 5,
      };

      const entry = await service.saveEntry(userId, payload);
      expect(entry.id).toBeDefined();
      expect(entry.userId).toBe(userId);
      expect(entry.resonanceScore).toBeGreaterThanOrEqual(70);

      const listResponse = await service.getEntries(userId);
      expect(listResponse.entries.length).toBe(1);
      expect(listResponse.currentStreakDays).toBe(1);
      expect(listResponse.totalEntriesCount).toBe(1);
      expect(listResponse.averageResonanceScore).toBe(entry.resonanceScore);
    });

    it('should filter entries by month', async () => {
      const userId = 'test-user-uuid-2';
      await service.saveEntry(userId, {
        date: '2026-09-01',
        mood: 'BINH_AN',
        eventNotes: 'Tháng 9',
        actualRating: 4,
      });
      await service.saveEntry(userId, {
        date: '2026-08-15',
        mood: 'LO_AU',
        eventNotes: 'Tháng 8',
        actualRating: 3,
      });

      const sepEntries = await service.getEntries(userId, '2026-09');
      expect(sepEntries.entries.length).toBe(1);
      expect(sepEntries.entries[0].date).toBe('2026-09-01');
    });
  });
});
