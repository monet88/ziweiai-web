import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { AdMobVerifierService } from './admob-verifier.service';

describe('AdMobVerifierService', () => {
  let service: AdMobVerifierService;
  let testKeyPair: { publicKey: string; privateKey: string };
  const mockKeyId = '3335741209';

  beforeEach(() => {
    service = new AdMobVerifierService();

    // Sinh cặp khóa EC prime256v1 dùng cho test
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    testKeyPair = { publicKey, privateKey };
    service.setMockKeys({
      [mockKeyId]: publicKey,
    });
  });

  function signContent(content: string, privateKeyPem: string): string {
    const signer = crypto.createSign('SHA256');
    signer.update(content, 'utf8');
    const signature = signer.sign(privateKeyPem);
    return signature.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  it('xác thực thành công callback chuẩn AdMob SSV với query string gốc', async () => {
    const content =
      'ad_network=5450213213286189855&ad_unit=12345678&custom_data=user_123e4567&reward_amount=5&reward_item=XU&timestamp=1726140000000&transaction_id=tx_998877665544';

    const b64urlSig = signContent(content, testKeyPair.privateKey);
    const rawQueryString = `${content}&signature=${b64urlSig}&key_id=${mockKeyId}`;

    const queryParams = {
      ad_network: '5450213213286189855',
      ad_unit: '12345678',
      custom_data: 'user_123e4567',
      reward_amount: '5',
      reward_item: 'XU',
      timestamp: '1726140000000',
      transaction_id: 'tx_998877665544',
      signature: b64urlSig,
      key_id: mockKeyId,
    };

    const result = await service.verifySsvCallback(rawQueryString, queryParams);

    expect(result.isValid).toBe(true);
    expect(result.userId).toBe('user_123e4567');
    expect(result.transactionId).toBe('tx_998877665544');
    expect(result.rewardAmount).toBe(5);
    expect(result.rewardItem).toBe('XU');
  });

  it('từ chối khi chữ ký bị giả mạo hoặc sai private key', async () => {
    // Ký bằng private key khác
    const otherKeyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const content =
      'ad_network=5450213213286189855&ad_unit=12345678&custom_data=user_attacker&reward_amount=5&reward_item=XU&timestamp=1726140000000&transaction_id=tx_fake';

    const fakeSig = signContent(content, otherKeyPair.privateKey);
    const rawQueryString = `${content}&signature=${fakeSig}&key_id=${mockKeyId}`;

    const queryParams = {
      custom_data: 'user_attacker',
      transaction_id: 'tx_fake',
      signature: fakeSig,
      key_id: mockKeyId,
    };

    const result = await service.verifySsvCallback(rawQueryString, queryParams);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Chữ ký số ECDSA không hợp lệ');
  });

  it('từ chối khi nội dung bị thay đổi (tampering) sau khi ký', async () => {
    const originalContent =
      'ad_network=5450213213286189855&ad_unit=12345678&custom_data=user_original&reward_amount=5&reward_item=XU&timestamp=1726140000000&transaction_id=tx_111';

    const signature = signContent(originalContent, testKeyPair.privateKey);

    // Kẻ gian sửa custom_data thành user_hacker
    const tamperedContent =
      'ad_network=5450213213286189855&ad_unit=12345678&custom_data=user_hacker&reward_amount=5&reward_item=XU&timestamp=1726140000000&transaction_id=tx_111';

    const rawQueryString = `${tamperedContent}&signature=${signature}&key_id=${mockKeyId}`;
    const queryParams = {
      custom_data: 'user_hacker',
      transaction_id: 'tx_111',
      signature: signature,
      key_id: mockKeyId,
    };

    const result = await service.verifySsvCallback(rawQueryString, queryParams);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Chữ ký số ECDSA không hợp lệ');
  });

  it('từ chối khi thiếu signature hoặc key_id', async () => {
    const resultNoSig = await service.verifySsvCallback('', { key_id: mockKeyId });
    expect(resultNoSig.isValid).toBe(false);
    expect(resultNoSig.error).toContain('Thiếu tham số');

    const resultNoKey = await service.verifySsvCallback('', { signature: 'sig' });
    expect(resultNoKey.isValid).toBe(false);
    expect(resultNoKey.error).toContain('Thiếu tham số');
  });
});
