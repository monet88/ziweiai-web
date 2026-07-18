import { createHmac, createSign, generateKeyPairSync } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiEnv } from '../../config/env';
import { SupabaseAuthService } from './supabase-auth.service';

function encodeBase64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signHs256(payload: Record<string, unknown>, secret: string): string {
  const header = encodeBase64UrlJson({ alg: 'HS256', typ: 'JWT' });
  const body = encodeBase64UrlJson(payload);
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function signEs256(payload: Record<string, unknown>, kid: string) {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const header = encodeBase64UrlJson({ alg: 'ES256', kid, typ: 'JWT' });
  const body = encodeBase64UrlJson(payload);
  const signature = createSign('SHA256')
    .update(`${header}.${body}`)
    .end()
    .sign({ key: privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url');

  return {
    jwk: publicKey.export({ format: 'jwk' }),
    token: `${header}.${body}.${signature}`,
  };
}

function signRs256(payload: Record<string, unknown>, kid: string) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const header = encodeBase64UrlJson({ alg: 'RS256', kid, typ: 'JWT' });
  const body = encodeBase64UrlJson(payload);
  const signature = createSign('SHA256')
    .update(`${header}.${body}`)
    .end()
    .sign(privateKey)
    .toString('base64url');

  return {
    jwk: publicKey.export({ format: 'jwk' }),
    token: `${header}.${body}.${signature}`,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('SupabaseAuthService', () => {
  it('verifies a valid HS256 bearer token payload', async () => {
    const token = signHs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      apiEnv.SUPABASE_JWT_SECRET,
    );

    const user = await new SupabaseAuthService().verifyAccessToken(token);
    expect(user.userId).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(user.email).toBe('user@example.com');
  });

  it('normalizes empty anonymous email to null (Supabase anon token phát email="")', async () => {
    // Token ẩn danh của Supabase mang email="" (chuỗi rỗng) chứ không phải vắng mặt → nếu để
    // nguyên thì authenticatedUserSchema (z.email()) reject. Coalesce "" → null cho anon đi qua.
    const token = signHs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        email: '',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      apiEnv.SUPABASE_JWT_SECRET,
    );

    const user = await new SupabaseAuthService().verifyAccessToken(token);
    expect(user.userId).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(user.email).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = signHs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      apiEnv.SUPABASE_JWT_SECRET,
    );

    await expect(new SupabaseAuthService().verifyAccessToken(token)).rejects.toThrow('JWT expired.');
  });

  it('verifies a valid ES256 bearer token against the Supabase JWKS endpoint', async () => {
    const kid = 'test-key-id';
    const { jwk, token } = signEs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      kid,
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            keys: [
              {
                ...jwk,
                alg: 'ES256',
                kid,
                use: 'sig',
              },
            ],
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          },
        ),
      ),
    );

    const user = await new SupabaseAuthService().verifyAccessToken(token);
    expect(user.userId).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(user.email).toBe('user@example.com');
  });

  it('verifies a valid RS256 bearer token against the Supabase JWKS endpoint', async () => {
    const kid = 'test-rsa-key-id';
    const { jwk, token } = signRs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      kid,
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            keys: [
              {
                ...jwk,
                alg: 'RS256',
                kid,
                use: 'sig',
              },
            ],
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          },
        ),
      ),
    );

    const user = await new SupabaseAuthService().verifyAccessToken(token);
    expect(user.userId).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(user.email).toBe('user@example.com');
  });

  it('coalesces concurrent JWKS fetches for the same kid', async () => {
    const kid = 'shared-kid';
    const { jwk, token } = signEs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      kid,
    );

    let resolveFetch: (() => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve(
              new Response(
                JSON.stringify({
                  keys: [{ ...jwk, alg: 'ES256', kid, use: 'sig' }],
                }),
                {
                  headers: { 'Content-Type': 'application/json' },
                  status: 200,
                },
              ),
            );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const service = new SupabaseAuthService();
    const pending = Promise.all([service.verifyAccessToken(token), service.verifyAccessToken(token)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    if (!resolveFetch) {
      throw new Error('Không thể hoàn tất JWKS fetch trong test.');
    }
    resolveFetch();
    await pending;
  });

  it('rejects stale cached JWK entries when refresh fails', async () => {
    vi.useFakeTimers();
    const kid = 'temporarily-unreachable-kid';
    const { jwk, token } = signEs256(
      {
        sub: '0f8fad5b-d9cb-469f-a165-70867728950e',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      kid,
    );

    const service = new SupabaseAuthService();
    const testService = service as unknown as {
      jwksByKid: Map<string, unknown>;
      jwksFetchedAt: number;
    };
    testService.jwksByKid.set(kid, { ...jwk, alg: 'ES256', kid, use: 'sig' });
    testService.jwksFetchedAt = Date.now() - 10 * 60 * 1000;

    const fetchMock = vi.fn(async () => new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(service.verifyAccessToken(token)).rejects.toThrow('Failed to fetch Supabase JWKS: 503');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
