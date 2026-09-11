import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const mockService = {
      getRecentTransactions: vi.fn(),
      reconcileTransaction: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get transactions', async () => {
    service.getRecentTransactions.mockResolvedValue([{ id: 'tx_1' }] as any);
    const res = await controller.getTransactions();
    expect(res).toEqual([{ id: 'tx_1' }]);
  });

  it('should reconcile transaction', async () => {
    service.reconcileTransaction.mockResolvedValue({ success: true, transactionId: 'tx_1', targetUserId: 'u_1', xuAdded: 10 });
    const res = await controller.reconcile({ transactionId: 'tx_1', targetUserId: 'u_1' });
    expect(res).toEqual({ success: true, transactionId: 'tx_1', targetUserId: 'u_1', xuAdded: 10 });
  });

  it('should get configs', async () => {
    (service as any).getConfigs = vi.fn().mockResolvedValue({ dailyCheckinXu: 5 });
    const res = await controller.getConfigs();
    expect(res).toEqual({ dailyCheckinXu: 5 });
  });

  it('should update config', async () => {
    (service as any).updateConfig = vi.fn().mockResolvedValue({ success: true, key: 'testKey', value: 123 });
    const res = await controller.updateConfig({ key: 'testKey', value: 123 });
    expect(res).toEqual({ success: true, key: 'testKey', value: 123 });
  });

  it('should get audit logs', async () => {
    (service as any).getAuditLogs = vi.fn().mockResolvedValue({ logs: [{ id: '1', action: 'TOPUP_XU' }], count: 1, page: 1, limit: 50 });
    const res = await controller.getAuditLogs('1', '50');
    expect(res).toEqual({ logs: [{ id: '1', action: 'TOPUP_XU' }], count: 1, page: 1, limit: 50 });
  });
});
