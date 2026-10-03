// Run with: node --test scripts/verify-demo-persona.cjs
// Exercise overlapping API requests without starting Next.js or touching the demo DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');
const { NextRequest } = require('next/server');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, ...rest) {
  const resolved = request.startsWith('@/') ? path.join(__dirname, '..', 'src', request.slice(2)) : request;
  return originalResolve.call(this, resolved, parent, ...rest);
};
require.extensions['.ts'] = function loadProjectTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};

const { route, ok } = require('../src/lib/api.ts');
const { currentDemoPersona, DEMO_PERSONA_COOKIE } = require('../src/lib/demoPersona.ts');

test('permintaan dari dua browser tidak saling mengganti peran', async () => {
  const handler = route('GET /api/test-persona', async (request) => {
    await new Promise((resolve) => setTimeout(resolve, request.cookies.get(DEMO_PERSONA_COOKIE)?.value === 'SITI' ? 20 : 1));
    return ok({ actor: currentDemoPersona() });
  });
  const browser = (persona) => new NextRequest('http://localhost/api/test-persona', {
    headers: persona ? { cookie: `${DEMO_PERSONA_COOKIE}=${persona}` } : {},
  });

  const responses = await Promise.all([
    handler(browser('SITI'), {}),
    handler(browser('HENDRA'), {}),
    handler(browser(), {}),
    handler(browser('NAMA_TIDAK_VALID'), {}),
  ]);
  const actors = await Promise.all(responses.map(async (response) => (await response.json()).data.actor));
  assert.deepEqual(actors, ['SITI', 'HENDRA', 'BUDI', 'BUDI']);
});
