import { Injectable } from '@nestjs/common';
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';
import { authenticatedUserSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { apiEnv } from '../../config/env';

interface JwtHeaderShape {
  alg?: string;
  kid?: string;
}

interface JwtPayloadShape {
  sub?: string;
  email?: string;
  exp?: number;
}

interface JwkShape {
  [key: string]: string | boolean | string[] | undefined;
  alg?: string;
  crv?: string;
  kid?: string;
  kty?: string;
  use?: string;
  x?: string;
  y?: string;
}

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

function toBase64UrlBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

function encodeBase64Url(value: Buffer): string {
  return value.toString('base64url');
}

@Injectable()
export class SupabaseAuthService {
  private jwksByKid = new Map<string, JwkShape>();
  private jwksFetchPromise: Promise<void> | null = null;
  private jwksFetchedAt = 0;

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new Error('Malformed JWT.');
    }

    const header = JSON.parse(toBase64UrlBuffer(encodedHeader).toString('utf8')) as JwtHeaderShape;
    const signedContent = `${encodedHeader}.${encodedPayload}`;

    if (header.alg === 'HS256') {
      this.verifyHs256Signature(signedContent, encodedSignature);
    } else if (header.alg === 'ES256' || header.alg === 'RS256') {
      await this.verifyAsymmetricSignature(header, signedContent, encodedSignature);
    } else {
      throw new Error('Unsupported JWT algorithm.');
    }

    const payload = JSON.parse(toBase64UrlBuffer(encodedPayload).toString('utf8')) as JwtPayloadShape;
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      throw new Error('JWT expired.');
    }

    // Anon JWT (Supabase anonymous sign-in, decision 0009) phát email="" (chuỗi rỗng),
    // không phải null. z.email() reject chuỗi rỗng → chuẩn hoá "" về null để anon user
    // parse qua authenticatedUserSchema. User email thường vẫn giữ nguyên email thật.
    return authenticatedUserSchema.parse({
      userId: payload.sub,
      email: payload.email || null,
    });
  }

  private verifyHs256Signature(signedContent: string, encodedSignature: string): void {
    const expectedSignature = encodeBase64Url(
      createHmac('sha256', apiEnv.SUPABASE_JWT_SECRET).update(signedContent).digest(),
    );

    const actualBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new Error('JWT signature mismatch.');
    }
  }

  private async verifyAsymmetricSignature(
    header: JwtHeaderShape,
    signedContent: string,
    encodedSignature: string,
  ): Promise<void> {
    if (!header.kid) {
      throw new Error('Missing JWT kid.');
    }

    const jwk = await this.getJwkByKid(header.kid);
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
    const signature = toBase64UrlBuffer(encodedSignature);
    const verifier = createVerify('SHA256').update(signedContent).end();

    // ECDSA (ES256) signatures are IEEE P1363 fixed-width r||s; RSA (RS256) uses PKCS#1 v1.5.
    const isValid =
      header.alg === 'ES256'
        ? verifier.verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)
        : verifier.verify(publicKey, signature);

    if (!isValid) {
      throw new Error('JWT signature mismatch.');
    }
  }

  private async getJwkByKid(kid: string): Promise<JwkShape> {
    const cached = this.jwksByKid.get(kid);
    if (cached && this.isJwksCacheFresh()) {
      return cached;
    }

    await this.refreshJwks();

    const resolved = this.jwksByKid.get(kid);
    if (!resolved) {
      throw new Error(`Unknown JWT kid: ${kid}`);
    }

    return resolved;
  }

  private isJwksCacheFresh(): boolean {
    return this.jwksFetchedAt > 0 && Date.now() - this.jwksFetchedAt < JWKS_CACHE_TTL_MS;
  }

  private async refreshJwks(): Promise<void> {
    if (!this.jwksFetchPromise) {
      this.jwksFetchPromise = (async () => {
        const response = await fetch(`${apiEnv.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch Supabase JWKS: ${response.status}`);
        }

        const payload = (await response.json()) as { keys?: JwkShape[] };
        const nextJwksByKid = new Map<string, JwkShape>();
        for (const jwk of payload.keys ?? []) {
          if (jwk.kid) {
            nextJwksByKid.set(jwk.kid, jwk);
          }
        }
        this.jwksByKid = nextJwksByKid;
        this.jwksFetchedAt = Date.now();
      })().finally(() => {
        this.jwksFetchPromise = null;
      });
    }

    await this.jwksFetchPromise;
  }
}
