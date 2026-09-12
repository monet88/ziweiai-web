import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import https from 'node:https';

export interface AdMobKeyMap {
  [keyId: string]: string; // keyId -> PEM public key
}

export interface AdMobVerificationResult {
  isValid: boolean;
  userId?: string;
  transactionId?: string;
  rewardAmount?: number;
  rewardItem?: string;
  error?: string;
}

const GOOGLE_ADMOB_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class AdMobVerifierService {
  private readonly logger = new Logger(AdMobVerifierService.name);

  private cachedKeys: AdMobKeyMap = {};
  private lastFetchTime = 0;

  constructor() {}

  /**
   * Lấy danh sách Public Keys chính thức từ Google AdMob (có cache 24h)
   */
  async getGooglePublicKeys(forceRefresh = false): Promise<AdMobKeyMap> {
    const now = Date.now();
    if (!forceRefresh && Object.keys(this.cachedKeys).length > 0 && now - this.lastFetchTime < CACHE_TTL_MS) {
      return this.cachedKeys;
    }

    try {
      const keysData = await this.fetchJsonFromUrl(GOOGLE_ADMOB_KEYS_URL);
      if (keysData?.keys && Array.isArray(keysData.keys)) {
        const keyMap: AdMobKeyMap = {};
        for (const item of keysData.keys) {
          if (item.keyId && item.pem) {
            keyMap[String(item.keyId)] = item.pem;
          }
        }
        this.cachedKeys = keyMap;
        this.lastFetchTime = now;
        this.logger.log(`Fetched ${Object.keys(keyMap).length} Google AdMob public keys successfully.`);
        return this.cachedKeys;
      }
      throw new Error('Google returned empty or invalid keys array');
    } catch (err: any) {
      this.logger.error(`Failed to fetch Google AdMob verifier keys: ${err.message}`, err.stack);
      // Fallback về cache cũ nếu có
      if (Object.keys(this.cachedKeys).length > 0) {
        return this.cachedKeys;
      }
      throw err;
    }
  }

  /**
   * Xác thực chữ ký số ECDSA SHA-256 từ Google AdMob SSV Callback
   * @param rawQueryString Chuỗi query string nguyên bản từ URL (ví dụ sau dấu ?)
   * @param queryParams Object chứa các tham số query
   */
  async verifySsvCallback(
    rawQueryString: string,
    queryParams: Record<string, any>,
  ): Promise<AdMobVerificationResult> {
    const signature = queryParams.signature as string | undefined;
    const keyId = queryParams.key_id as string | undefined;

    if (!signature || !keyId) {
      return {
        isValid: false,
        error: 'Thiếu tham số signature hoặc key_id trong callback',
      };
    }

    let keys = await this.getGooglePublicKeys();
    let publicKeyPem = keys[String(keyId)];

    // Nếu keyId chưa có trong cache, refresh 1 lần để đề phòng Google vừa xoay key mới
    if (!publicKeyPem) {
      this.logger.warn(`Key ID ${keyId} not in cache. Refreshing Google keys...`);
      keys = await this.getGooglePublicKeys(true);
      publicKeyPem = keys[String(keyId)];
    }

    if (!publicKeyPem) {
      return {
        isValid: false,
        error: `Không tìm thấy public key tương ứng với key_id: ${keyId}`,
      };
    }

    // Chuẩn hóa signature từ Base64url sang Buffer
    let signatureBuffer: Buffer;
    try {
      const b64 = signature.replace(/-/g, '+').replace(/_/g, '/');
      const padLength = (4 - (b64.length % 4)) % 4;
      const paddedB64 = b64 + '='.repeat(padLength);
      signatureBuffer = Buffer.from(paddedB64, 'base64');
    } catch (e: any) {
      return {
        isValid: false,
        error: `Lỗi giải mã signature base64url: ${e.message}`,
      };
    }

    // Xác định nội dung cần xác thực (content to verify)
    // Theo quy chuẩn AdMob SSV: signature và key_id luôn nằm ở cuối cùng.
    // Nội dung được ký là phần chuỗi query phía trước "&signature="
    let verified = false;

    // Chiến lược 1: Cắt chuỗi raw query trước &signature=
    if (rawQueryString && rawQueryString.includes('&signature=')) {
      const content = rawQueryString.substring(0, rawQueryString.indexOf('&signature='));
      verified = this.verifySignatureWithPem(publicKeyPem, content, signatureBuffer);
    } else if (rawQueryString && rawQueryString.startsWith('signature=')) {
      // Trường hợp hiếm khi signature đứng đầu
      const content = rawQueryString.substring(rawQueryString.indexOf('&') + 1);
      verified = this.verifySignatureWithPem(publicKeyPem, content, signatureBuffer);
    }

    // Chiến lược 2: Nếu Chiến lược 1 thất bại (hoặc URL bị framework decode/reorder),
    // xây dựng lại chuỗi từ các params đã sắp xếp chữ cái loại trừ signature và key_id
    if (!verified) {
      const filteredKeys = Object.keys(queryParams)
        .filter((k) => k !== 'signature' && k !== 'key_id')
        .sort();

      const sortedQuery = filteredKeys
        .map((k) => `${k}=${queryParams[k]}`)
        .join('&');

      verified = this.verifySignatureWithPem(publicKeyPem, sortedQuery, signatureBuffer);
    }

    if (!verified) {
      return {
        isValid: false,
        error: 'Chữ ký số ECDSA không hợp lệ',
      };
    }

    return {
      isValid: true,
      userId: queryParams.custom_data ? String(queryParams.custom_data).trim() : undefined,
      transactionId: queryParams.transaction_id ? String(queryParams.transaction_id).trim() : undefined,
      rewardAmount: queryParams.reward_amount ? Number(queryParams.reward_amount) : undefined,
      rewardItem: queryParams.reward_item ? String(queryParams.reward_item) : undefined,
    };
  }

  /**
   * Helper kiểm tra chữ ký với Node crypto ECDSA SHA256
   */
  private verifySignatureWithPem(publicKeyPem: string, content: string, signatureBuffer: Buffer): boolean {
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(content, 'utf8');
      return verifier.verify(publicKeyPem, signatureBuffer);
    } catch (err: any) {
      this.logger.debug(`Signature verification error: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper fetch JSON qua https chuẩn Node.js
   */
  private fetchJsonFromUrl(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            return reject(new Error(`Status Code: ${res.statusCode}`));
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Set public keys thủ công (hỗ trợ cho unit testing)
   */
  setMockKeys(keys: AdMobKeyMap) {
    this.cachedKeys = keys;
    this.lastFetchTime = Date.now();
  }
}
