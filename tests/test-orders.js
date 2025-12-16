/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const ORDERS = path.join(process.cwd(), 'src', 'data', 'orders.json');

function read() { try { return JSON.parse(fs.readFileSync(ORDERS, 'utf8')); } catch { return []; } }
function write(o) { fs.writeFileSync(ORDERS, JSON.stringify(o, null, 2)); }

const before = read();
const testOrder = { id: `ot_${Date.now()}`, userId: 'u_test', total: 1.0, status: 'processing', tracking: '', address: 'test', items: [{ id: 'p_test', name: 'Test', qty: 1 }], date: new Date().toISOString().slice(0, 10) };
before.unshift(testOrder);
write(before);
const after = read();
if (!after.find(o => o.id === testOrder.id)) {
  console.error('Order insert failed');
  process.exit(2);
}
// cleanup
const cleaned = after.filter(o => o.id !== testOrder.id);
write(cleaned);
process.exit(0);
