import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from '../../database/repositories/admin.repository';
import type { AuthenticatedUser } from '@ziweiai/contracts';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const mockService = {
      getRecentTransactions: vi.fn(),
      reconcileTransaction: vi.fn(),
      topupUser: vi.fn(),
    };

    const mockAdminRepo = {
      checkAdminRole: vi.fn().mockResolvedValue('SUPER_ADMIN'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockService,
        },
        {
          provide: AdminRepository,
          useValue: mockAdminRepo,
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

  it('should topup user and log actor email', async () => {
    service.topupUser.mockResolvedValue({ success: true, userId: 'u_123', amount: 50 });
    const mockAdmin: AuthenticatedUser = {
      userId: 'admin-id',
      email: 'admin@ziweiai.com',
      isAnonymous: false,
    };
    const res = await controller.topupUser('u_123', { amount: 50 }, mockAdmin);
    expect(res).toEqual({ success: true, userId: 'u_123', amount: 50 });
    expect(service.topupUser).toHaveBeenCalledWith('u_123', 50, 'admin@ziweiai.com');
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

  it('should ban user and log admin email', async () => {
    (service as any).banUser = vi.fn().mockResolvedValue(true);
    const mockAdmin: AuthenticatedUser = {
      userId: 'admin-id',
      email: 'admin@ziweiai.com',
      isAnonymous: false,
    };
    const res = await controller.banUser('u_123', mockAdmin);
    expect(res).toEqual({ success: true });
    expect((service as any).banUser).toHaveBeenCalledWith('u_123', true, 'admin@ziweiai.com');
  });

  it('should unban user', async () => {
    (service as any).banUser = vi.fn().mockResolvedValue(true);
    const res = await controller.unbanUser('u_123');
    expect(res).toEqual({ success: true });
    expect((service as any).banUser).toHaveBeenCalledWith('u_123', false, undefined);
  });

  it('should update config by key param', async () => {
    (service as any).updateConfig = vi.fn().mockResolvedValue({ success: true, key: 'myKey', value: 999 });
    const res = await controller.updateConfigByKey('myKey', { value: 999 });
    expect(res).toEqual({ success: true, key: 'myKey', value: 999 });
    expect((service as any).updateConfig).toHaveBeenCalledWith('myKey', 999);
  });
});
