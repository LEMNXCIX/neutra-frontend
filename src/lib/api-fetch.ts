export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status === 401) {
    // dispatch a global event so client code can react (e.g., auto logout)
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    } catch {
      // ignore
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error || res.statusText || 'Request failed';
    const e = new Error(err) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res;
}
