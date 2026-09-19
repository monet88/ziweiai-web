import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EmailIdentityGuard } from '../auth/identity.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    deleteAccount: ReturnType<typeof vi.fn>;
    getWalletBalance: ReturnType<typeof vi.fn>;
    updateFcmToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      deleteAccount: vi.fn(),
      getWalletBalance: vi.fn(),
      updateFcmToken: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(EmailIdentityGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register FCM token successfully', async () => {
    service.updateFcmToken.mockResolvedValue(undefined);
    const mockUser = { userId: 'user-uuid-123' } as any;

    const res = await controller.updateFcmToken(mockUser, {
      token: 'valid_fcm_token',
      platform: 'android',
    });

    expect(res).toEqual({ success: true });
    expect(service.updateFcmToken).toHaveBeenCalledWith('user-uuid-123', 'valid_fcm_token', 'android');
  });

  it('should reject invalid FCM token payload', async () => {
    const mockUser = { userId: 'user-uuid-123' } as any;

    await expect(controller.updateFcmToken(mockUser, { token: '' })).rejects.toThrow(
      'Invalid payload: token is required',
    );
  });
});
