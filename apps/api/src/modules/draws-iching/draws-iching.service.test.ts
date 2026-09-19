import { describe, expect, it, vi } from 'vitest';
import { DrawsIchingService } from './draws-iching.service';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { IChingGroundingAdapter } from './adapters/iching-grounding.adapter';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('DrawsIchingService', () => {
  const orchestrator = { executeFeature: vi.fn().mockResolvedValue('Mock Narrative') } as unknown as AiFeatureExecutionOrchestrator;
  const groundingAdapter = { getGroundingContext: vi.fn().mockResolvedValue('Mock Context') } as unknown as IChingGroundingAdapter;
  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  } as unknown as SupabaseClient;

  const service = new DrawsIchingService(orchestrator, groundingAdapter, mockSupabaseClient);

  it('should generate correctly from castArray', async () => {
    const user = { userId: '123', email: 'test@example.com' };
    const result = await service.drawIChing(
      user as any,
      '127.0.0.1',
      'What is my fortune?',
      [7, 7, 7, 7, 7, 7]
    );

    // 7 is Thiếu Dương -> 111111 which is Hexagram 1 (Thuần Càn)
    expect(result.baseHexagram.id).toBe('1');
    expect(result.changedHexagram).toBeUndefined(); // no changing lines
    expect(result.narrative).toBe('Mock Narrative');
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('iching_draws');
  });

  it('should throw error if castArray length is not 6', async () => {
    const user = { userId: '123', email: 'test@example.com' };
    await expect(service.drawIChing(user as any, '127.0.0.1', 'Q', [7, 7, 7])).rejects.toThrow('Mảng gieo quẻ (cast_array) phải chứa đúng 6 hào.');
  });
});
