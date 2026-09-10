import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DivinationChatService } from './divination-chat.service';
import type { AiFeatureExecutionOrchestrator } from '../../../providers/ai/ai-feature-execution.orchestrator';
import type { AuthenticatedUser } from '@ziweiai/contracts';

describe('DivinationChatService', () => {
  let service: DivinationChatService;
  let orchestrator: Partial<AiFeatureExecutionOrchestrator>;

  const mockUser: AuthenticatedUser = {
    userId: 'user-uuid-1',
    email: 'user@example.com',
    role: 'user',
  };

  beforeEach(() => {
    orchestrator = {
      executeFeature: vi.fn().mockResolvedValue('Khâm Thiên Giám Ngự Bút luận giải cát tường.'),
    };
    service = new DivinationChatService(orchestrator as AiFeatureExecutionOrchestrator);
  });

  describe('chat', () => {
    it('executes feature with 1 XU cost and returns valid response', async () => {
      const res = await service.chat(mockUser, '127.0.0.1', {
        question: 'Vận tài lộc năm nay?',
        topic: 'Tài Lộc',
      });

      expect(res.answer).toBe('Khâm Thiên Giám Ngự Bút luận giải cát tường.');
      expect(res.costXu).toBe(1);
      expect(orchestrator.executeFeature).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          cost: 1,
          quotaFeatureKey: 'divination_chat',
        }),
      );
    });
  });

  describe('explainCompatibility', () => {
    it('executes feature with 15 XU cost and returns valid explanation', async () => {
      const res = await service.explainCompatibility(mockUser, '127.0.0.1', {
        person1: { name: 'Nguyễn Văn A', birthYear: 1995, gender: 'male' },
        person2: { name: 'Trần Thị B', birthYear: 1998, gender: 'female' },
        overallScore: 85,
        verdictTitle: 'Thiên Duyên Tiền Định',
      });

      expect(res.explanation).toBe('Khâm Thiên Giám Ngự Bút luận giải cát tường.');
      expect(res.costXu).toBe(15);
      expect(orchestrator.executeFeature).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          cost: 15,
          quotaFeatureKey: 'compatibility_explain',
        }),
      );
    });
  });
});
