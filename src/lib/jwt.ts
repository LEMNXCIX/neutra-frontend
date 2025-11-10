import crypto from 'crypto';

function base64url(input: Buffer) {
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signJwt(payload: Record<string, unknown>, opts?: { secret?: string; expiresIn?: number }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const secret = opts?.secret || process.env.NEUTRA_JWT_SECRET || 'dev_secret_change_me';
  const exp = opts?.expiresIn ? now + opts.expiresIn : now + 60 * 60 * 24; // default 24h
  const body = { ...payload, iat: now, exp };
  const encoded = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(body)))}`;
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest();
  return `${encoded}.${base64url(sig)}`;
}

export function verifyJwt(token: string, opts?: { secret?: string }) {
  try {
    const secret = opts?.secret || process.env.NEUTRA_JWT_SECRET || 'dev_secret_change_me';
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const unsigned = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(unsigned).digest();
    const actualSig = Buffer.from(sigB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && typeof payload.exp === 'number' && payload.exp < now) return null;
  return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
