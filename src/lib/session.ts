import fs from 'fs';
import path from 'path';

export const SESSIONS_PATH = path.join(process.cwd(), 'src', 'data', 'sessions.json');

export function readSessions(): Record<string, { userId: string; created: string }> {
  try {
    const raw = fs.readFileSync(SESSIONS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeSessions(obj: Record<string, { userId: string; created: string }>) {
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify(obj, null, 2), 'utf-8');
}

function makeId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
}

export function createSession(userId: string) {
  const sessions = readSessions();
  const sid = makeId();
  sessions[sid] = { userId, created: new Date().toISOString() };
  writeSessions(sessions);
  return sid;
}

export function getUserId(sessionId?: string | null) {
  if (!sessionId) return null;
  const sessions = readSessions();
  const rec = sessions[sessionId];
  return rec ? rec.userId : null;
}

export function invalidateSession(sessionId?: string | null) {
  if (!sessionId) return false;
  const sessions = readSessions();
  if (sessions[sessionId]) {
    delete sessions[sessionId];
    writeSessions(sessions);
    return true;
  }
  return false;
}

export function rotateSession(oldSessionId?: string | null) {
  const userId = getUserId(oldSessionId);
  if (!userId) return null;
  invalidateSession(oldSessionId);
  return createSession(userId);
}
