import { verifyJwt } from './jwt';
import fs from 'fs';
import path from 'path';
import { getUserId as getUserIdFromSession } from './session';

export function extractTokenFromRequest(req: Request) {
  // Check Authorization header first
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (auth && typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
      return auth.slice(7).trim();
    }
  } catch { }

  // Fallback to cookie
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const pairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
    for (const p of pairs) {
      const [k, ...v] = p.split('=');
      if (k === 'neutra_jwt') return decodeURIComponent(v.join('='));
    }
  } catch { }

  return null;
}

export function verifyToken(token: string) {
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

export function requireAdminFromRequest(req: Request): { ok: true; userId: string } | { ok: false } {
  // Try JWT
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifyToken(token as string);
    if (payload && payload.sub) {
      const uid = String(payload.sub);
      // check users.json
      try {
        const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
        const raw = fs.readFileSync(USERS_PATH, 'utf-8');
        type User = { id: string; name: string; email: string; password?: string; isAdmin?: boolean };
        const users = JSON.parse(raw) as Array<User>;
        const me = users.find((u: User) => u.id === uid);
        if (me && me.isAdmin) return { ok: true, userId: uid };
      } catch { }
    }
  }

  // Fallback to session cookie
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const pairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
    let rawSid: string | undefined;
    for (const p of pairs) {
      const [k, ...v] = p.split('=');
      if (k === '_neutra_sid') rawSid = decodeURIComponent(v.join('='));
    }
    const uid = getUserIdFromSession(rawSid || null);
    if (!uid) return { ok: false };
    const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
    const raw = fs.readFileSync(USERS_PATH, 'utf-8');
    type User = { id: string; name: string; email: string; password?: string; isAdmin?: boolean };
    const users = JSON.parse(raw) as Array<User>;
    const me = users.find((u: User) => u.id === uid);
    if (me && me.isAdmin) return { ok: true, userId: uid };
  } catch { }

  return { ok: false };
}

export function getUserFromRequest(req: Request): { ok: true; user: { id: string } } | { ok: false } {
  // Try JWT
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifyToken(token as string);
    if (payload && payload.sub) {
      return { ok: true, user: { id: String(payload.sub) } };
    }
  }

  // Fallback to session cookie
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const pairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
    let rawSid: string | undefined;
    for (const p of pairs) {
      const [k, ...v] = p.split('=');
      if (k === '_neutra_sid') rawSid = decodeURIComponent(v.join('='));
    }
    const uid = getUserIdFromSession(rawSid || null);
    if (uid) {
      return { ok: true, user: { id: uid } };
    }
  } catch { }

  return { ok: false };
}

