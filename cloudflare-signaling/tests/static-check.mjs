import fs from 'node:fs';
import assert from 'node:assert/strict';

const worker = fs.readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
const wrangler = fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

assert.match(worker, /service:\s*"belote-signaling"/);
assert.match(worker, /guests\.length\s*>=\s*3/);
assert.match(worker, /\[1,\s*2,\s*3\]\.includes\(message\.seat\)/);
assert.match(worker, /message\.type\s*===\s*"reject"/);
assert.match(worker, /String\(message\.auth/);
assert.match(worker, /validSessionDescription/);
assert.match(wrangler, /belote-p2p/);
assert.match(wrangler, /belote\.qqnd\.fyi\/api\/\*/);
assert.match(wrangler, /SignalingRoom/);

console.log('Belote signaling static checks passed.');
