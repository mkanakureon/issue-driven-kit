// node-sample.test.mjs — 基本設計の K-5（見本）。examples/node-sample を一時のフォルダーに写して Node 版を入れ、npm ci してから、テストの入口と確認の手伝いを通しで回す。
// npm ci はネットから vitest を取ってくる。ネットにつながらないときだけ飛ばす（飛ばした試験は合格に数えない）。一時のフォルダーは最後に消す。
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const kit = join(dirname(fileURLToPath(import.meta.url)), '..');
const sample = join(kit, 'examples', 'node-sample');
// 外から node --test で呼ばれた印は子へ渡さない（子が結果を親へ送らないように）
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const node = (args, cwd) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env });
const lastResult = (r) => `${r.stdout}`.trim().split(/\r?\n/).filter((l) => l.startsWith('Result:')).at(-1) ?? '';
const NETWORK = /ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH/;

// 見本を写して git の作業場所にし、Node 版を入れて npm ci する。2 本の試験で 1 回だけ。ネットが無ければ { skip }
// 準備が落ちたら、その誤りを 2 本目でも同じに投げる（壊れたフォルダーで回さない）
let prepared;
function prepare() {
  if (prepared?.error) throw prepared.error;
  if (prepared) return prepared;
  const dir = mkdtempSync(join(tmpdir(), 'kit-sample-'));
  prepared = { dir };
  try { setup(dir); } catch (e) { prepared.error = e; throw e; }
  return prepared;
}
function setup(dir) {
  cpSync(sample, dir, { recursive: true, filter: (src) => !/[\\/]node_modules([\\/]|$)/.test(src) });
  assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0, 'git init');
  const inst = node([join(kit, 'editions/node/install.mjs'), '--target', dir], dir);
  assert.equal(inst.status, 0, inst.stdout + inst.stderr);
  const ci = spawnSync('npm ci --no-audit --no-fund', { cwd: dir, encoding: 'utf8', env, shell: true });
  if (ci.status !== 0) {
    const out = `${ci.stdout}${ci.stderr}`;
    if (NETWORK.test(out)) prepared.skip = `npm ci がネットにつながらない: ${out.trim().split(/\r?\n/).at(-1)}`;
    else assert.fail(`npm ci が落ちた:\n${out}`);
  }
}
after(() => { if (prepared) rmSync(prepared.dir, { recursive: true, force: true }); });

test('K-5 見本のプロジェクトに Node 版を入れると、テストの入口が全部・0 件・わざと落とすの 3 つとも正しい', (t) => {
  const { dir, skip } = prepare();
  if (skip) return t.skip(skip);
  const entry = join(dir, 'scripts/test.mjs');
  // 全部: 見本の 2 本が通る
  let r = node([entry], dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(lastResult(r), 'Result: PASS 2/2', r.stdout);
  // 0 件: 無い名前で絞ると FAIL
  r = node([entry, '--filter', 'どれにも当たらない名前'], dir);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(lastResult(r), /^Result: FAIL \(0\/0/, r.stdout);
  // わざと落とす: 落ちる試験を 1 本足すと FAIL
  const bad = join(dir, 'test/fail.test.ts');
  writeFileSync(bad, "import { it, expect } from 'vitest';\nit('わざと落とす', () => { expect(1).toBe(2); });\n");
  try {
    r = node([entry], dir);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.equal(lastResult(r), 'Result: FAIL (2/3)', r.stdout);
  } finally { rmSync(bad, { force: true }); }
});

test('K-5 見本のプロジェクトで確認の手伝いがテストの名前を読める', (t) => {
  const { dir, skip } = prepare();
  if (skip) return t.skip(skip);
  assert.ok(existsSync(join(dir, 'scripts/issue-run/check-lib.mjs')), 'check-lib.mjs が入っていない');
  // Issue の確認コマンドと同じ形で、見本の直下から check-lib を使う
  const check = (names) => node(['--input-type=module', '-e', [
    "import { runTests, requireTests, done } from './scripts/issue-run/check-lib.mjs';",
    'runTests();',
    `requireTests(${JSON.stringify(names)});`,
    'done();',
  ].join('\n')], dir);
  // ある名前は通る（「describe > テスト」の最後の部分でも、全部でもよい）
  let r = check(['足し算ができる', 'add > マイナスも足せる']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /OK {2}テスト 足し算ができる/);
  assert.match(r.stdout, /OK {2}テスト add > マイナスも足せる/);
  // 無い名前は NG
  r = check(['足し算ができる', '無い名前のテスト']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /NG {2}テストが無い: 無い名前のテスト/);
  assert.doesNotMatch(r.stdout, /NG {2}テスト 足し算ができる/);
});
