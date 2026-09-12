import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SynthesisController } from './synthesis.controller';
import { SynthesisService } from './synthesis.service';
import { BadRequestException } from '@nestjs/common';

describe('SynthesisController', () => {
  let controller: SynthesisController;
  let service: SynthesisService;

  const mockService = {
    generateSynthesis: vi.fn(),
    getExistingSynthesis: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = mockService as unknown as SynthesisService;
    controller = new SynthesisController(service);
  });

  describe('generateSynthesis', () => {
    it('throws BadRequestException if userId is missing', async () => {
      const req = { authenticatedUser: undefined } as any;
      await expect(controller.generateSynthesis({}, req)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if body is invalid', async () => {
      const req = { authenticatedUser: { userId: 'user-123' } } as any;
      await expect(controller.generateSynthesis({ chartId: 'not-a-uuid' }, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls service and returns result on valid payload', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const req = { authenticatedUser: { userId: 'user-123' } } as any;
      const mockResult = {
        chartId: validUuid,
        consensusScore: 90,
        summary: 'Luận giải tổng hợp',
      };
      mockService.generateSynthesis.mockResolvedValue(mockResult);

      const result = await controller.generateSynthesis(
        {
          chartId: validUuid,
          includeBazi: true,
          includeNumerology: true,
          focusAreas: ['career', 'wealth'],
        },
        req,
      );

      expect(mockService.generateSynthesis).toHaveBeenCalledWith(
        expect.objectContaining({ chartId: validUuid }),
        'user-123',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getExistingSynthesis', () => {
    it('throws BadRequestException if user is not authenticated', async () => {
      const req = { authenticatedUser: undefined } as any;
      await expect(controller.getExistingSynthesis('uuid', req)).rejects.toThrow(BadRequestException);
    });

    it('returns { exists: false } when no synthesis exists', async () => {
      const req = { authenticatedUser: { userId: 'user-123' } } as any;
      mockService.getExistingSynthesis.mockResolvedValue(null);

      const result = await controller.getExistingSynthesis('uuid', req);
      expect(result).toEqual({ exists: false });
    });

    it('returns existing synthesis when available', async () => {
      const req = { authenticatedUser: { userId: 'user-123' } } as any;
      const mockData = { chartId: 'uuid', consensusScore: 88 };
      mockService.getExistingSynthesis.mockResolvedValue(mockData);

      const result = await controller.getExistingSynthesis('uuid', req);
      expect(result).toEqual(mockData);
    });
  });
});
