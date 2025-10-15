const fs = require('fs');
const path = require('path');

const SESSIONS = path.join(process.cwd(), 'src', 'data', 'sessions.json');

function read() {
  try { return JSON.parse(fs.readFileSync(SESSIONS, 'utf8')); } catch { return {}; }
}

function write(o) { fs.writeFileSync(SESSIONS, JSON.stringify(o, null, 2)); }

console.log('Running session file tests...');
const before = read();
const sid = `t_${Date.now()}`;
before[sid] = { userId: 'u_test', created: new Date().toISOString() };
write(before);
const after = read();
if (!after[sid] || after[sid].userId !== 'u_test') {
  console.error('Session write/read failed');
  process.exit(2);
}
delete after[sid];
write(after);
console.log('Session tests passed');
process.exit(0);
