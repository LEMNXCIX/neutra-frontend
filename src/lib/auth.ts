/**
 * Auth Utilities - Simplified to work with external backend
 */

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
      if (k === 'token' || k === 'neutra_jwt') return decodeURIComponent(v.join('='));
    }
  } catch { }

  return null;
}

/**
 * Note: JWT verification is now primarily handled by the backend.
 * This client-side utility can be extended if local decoding is needed.
 */
export function verifyToken(token: string) {
  // If we need to decode the JWT locally without secret verification (just for UI metadata)
  // we could implement a simple base64 decode here.
  // For security critical checks, always use the backend validation route.
  return !!token; 
}
