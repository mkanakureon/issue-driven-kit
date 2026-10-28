// git-hooks.test.mjs — キット自身のコミットのフック（scripts/git-hooks/）の試験。npm のパッケージは使わない。
// 設計書: docs/design/commit-message-hooks-design.md の 6 章。
//   単体            lib.mjs の checkMessage（M1〜M5）・checkStaged（P1〜P3）
//   使い捨ての git  mkdtemp のリポジトリに scripts/git-hooks/ を写して install.mjs を回し、git commit・git merge が止まるか通るか
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, cpSync, writeFileSync, readFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { checkMessage, checkStaged, MB } from '../scripts/git-hooks/lib.mjs';

const kit = join(dirname(fileURLToPath(import.meta.url)), '..');
const codes = (list) => [...new Set(list.map((s) => s.slice(0, 2)))];
const TAIL = '\n\n確かめ: node scripts/test.mjs → Result: PASS 1/1\n\n---\n感想。\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n';
const msg = (subject, body = '直した理由。') => `${subject}\n\n${body}${TAIL}`;
const EXAMPLE = `fix: 指示文の確かめの行を testRunner に合わせる

決め打ちで「（vitest）」と書いていたので、node --test のリポジトリでも vitest と出ていた。
- lib.mjs に testRunnerOf と workspaceStateText を足した
- issue-run.mjs は package.json を読んでそれを呼ぶだけにした
（Issue #35）

確かめ: node scripts/test.mjs → Result: PASS 55/55

---
決め打ちの 1 語でも、Claude が読む文では効いてしまう。

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
`;

// ---- 単体（checkMessage） ----

test('フック: 3 章の例そのままは通る', () => {
  assert.deepEqual(checkMessage(EXAMPLE), []);
});

test('フック: 範囲つきの件名は通る', () => {
  assert.deepEqual(checkMessage(msg('feat(hooks): フックを足す')), []);
});

test('フック: 説明が 40 字は通り 41 字は M2', () => {
  assert.deepEqual(checkMessage(msg(`docs: ${'あ'.repeat(40)}`)), []);
  assert.deepEqual(codes(checkMessage(msg(`docs: ${'あ'.repeat(41)}`))), ['M2']);
  assert.match(checkMessage(msg(`docs: ${'あ'.repeat(41)}`))[0], /^M2: 説明が 41 字（40 字まで）$/);
});

test('フック: 種類の無い件名は M1', () => {
  assert.deepEqual(codes(checkMessage(msg('予告編を直した'))), ['M1']);
  assert.deepEqual(codes(checkMessage(msg('style: 形を直した'))), ['M1']);
});

test('フック: 2 行目が空でないと M3', () => {
  assert.deepEqual(codes(checkMessage(`fix: 直した\n直した理由。${TAIL}`)), ['M3']);
});

test('フック: 確かめの行が無いと M4', () => {
  assert.deepEqual(codes(checkMessage('fix: 直した\n\n直した理由。\n\n---\n感想。\n')), ['M4']);
});

test('フック: 本文が確かめの行だけなら M4', () => {
  assert.deepEqual(codes(checkMessage('fix: 直した\n\n確かめ: なし（文書のみ）\n\n---\n感想。\n')), ['M4']);
});

test('フック: --- が無いと M5', () => {
  assert.deepEqual(codes(checkMessage('fix: 直した\n\n直した理由。\n\n確かめ: なし（文書のみ）\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n')), ['M5']);
});

test('フック: --- の後が Co-Authored-By だけなら M5', () => {
  assert.deepEqual(codes(checkMessage('fix: 直した\n\n直した理由。\n\n確かめ: なし（文書のみ）\n\n---\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nsigned-off-by: a <a@example.invalid>\n')), ['M5']);
});

test('フック: Merge・Revert・fixup! は検査しない', () => {
  for (const s of ["Merge branch 'lane-a'", 'Revert "fix: 直した"', 'Reapply "fix: 直した"', 'fixup! fix: 直した', 'squash! fix: 直した', 'amend! fix: 直した']) {
    assert.deepEqual(checkMessage(`${s}\n`), [], s);
  }
});

test('フック: 全角の確かめ：も通る', () => {
  assert.deepEqual(checkMessage(EXAMPLE.replace('確かめ:', '確かめ：')), []);
});

test('フック: CRLF・コメントの行・切り取り線から後を読み飛ばす', () => {
  const text = `${EXAMPLE}# Please enter the commit message\n# ------------------------ >8 ------------------------\ndiff --git a/x b/x\n`.replace(/\n/g, '\r\n');
  assert.deepEqual(checkMessage(text), []);
  // # の行だけを本文にすると本文が無いことになる（止まる側に倒す）
  assert.deepEqual(codes(checkMessage(`fix: 直した\n\n# 理由\n${TAIL}`)), ['M4']);
});

test('フック: 範囲の中に : があっても説明を正しく数える', () => {
  assert.deepEqual(checkMessage(msg(`fix(a: b): ${'い'.repeat(40)}`)), []);
});

test('フック: 確かめの行が --- の後にあると M4', () => {
  assert.deepEqual(codes(checkMessage('fix: 直した\n\n直した理由。\n\n---\n確かめ: node scripts/test.mjs → Result: PASS 1/1\n感想。\n')), ['M4']);
});

test('フック: --- が 2 本なら最後の後を感想として見る', () => {
  assert.deepEqual(checkMessage('fix: 直した\n\n直した理由。\n---\n本文の区切り。\n\n確かめ: なし（文書のみ）\n\n---\n感想。\n'), []);
  assert.deepEqual(codes(checkMessage('fix: 直した\n\n直した理由。\n\n確かめ: なし（文書のみ）\n\n---\n感想。\n---\n')), ['M5']);
});

test('フック: 空のメッセージは M1', () => {
  assert.deepEqual(codes(checkMessage('')), ['M1']);
  assert.deepEqual(codes(checkMessage('\n# Please enter the commit message\n\n')), ['M1']);
});

// ---- 単体（checkStaged） ----

test('フック: ignore に当たる足したファイルは P1', () => {
  const r = checkStaged({ added: ['.issue-run/x.md', 'a.md'], changed: ['.issue-run/x.md', 'a.md'], ignored: ['.issue-run/x.md'], sizes: { '.issue-run/x.md': 1, 'a.md': 1 } });
  assert.deepEqual(codes(r.errors), ['P1']);
  assert.match(r.errors[0], /\.issue-run\/x\.md/);
});

test('フック: 追跡済みのファイルの更新は P1 で止めない', () => {
  const r = checkStaged({ added: [], changed: ['node_modules/old.js'], ignored: ['node_modules/old.js'], sizes: { 'node_modules/old.js': 1 } });
  assert.deepEqual(r, { errors: [], warnings: [] });
});

test('フック: .env と *.pem は P2', () => {
  for (const p of ['.env', 'app/.env.local', '.env.example', '.dev.vars', 'credentials.json', 'certs/Server.PEM', 'id.key', '.claude/settings.local.json']) {
    assert.deepEqual(codes(checkStaged({ changed: [p] }).errors), ['P2'], p);
  }
  for (const p of ['env.md', 'docs/keys.md', '.claude/settings.json', 'a.pem.md']) {
    assert.deepEqual(checkStaged({ changed: [p] }).errors, [], p);
  }
});

test('フック: 96MB は P3 で止まり 60MB は警告', () => {
  const big = checkStaged({ sizes: { 'big.bin': 96 * MB } });
  assert.deepEqual(codes(big.errors), ['P3']);
  const mid = checkStaged({ sizes: { 'mid.bin': 60 * MB } });
  assert.deepEqual(mid.errors, []);
  assert.deepEqual(codes(mid.warnings), ['P3']);
  assert.deepEqual(checkStaged({ sizes: { 'small.md': 147 * 1024 } }), { errors: [], warnings: [] });
});

// ---- 使い捨てのリポジトリ ----

// 子の PATH の頭に、いまの node のフォルダーを足す（PATH が古いセッションでも中継が node を見つけられるように）
const env = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}` };
delete env.GIT_INDEX_FILE;
const g = (dir, ...args) => spawnSync('git', ['-C', dir, '-c', 'user.name=kit-test', '-c', 'user.email=kit-test@example.invalid', '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8', env });
const install = (dir) => spawnSync(process.execPath, [join(dir, 'scripts/git-hooks/install.mjs')], { cwd: dir, encoding: 'utf8', env });
const GOOD = msg('fix: 直した');

// git init し、.gitignore を最初のコミットにして、scripts/git-hooks/ を写して入れる（写した本体はコミットしない）
function repo(t) {
  const dir = mkdtempSync(join(tmpdir(), 'kit-hooks-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.equal(g(dir, 'init', '-q').status, 0);
  writeFileSync(join(dir, '.gitignore'), 'node_modules/\n.issue-run/\nscripts/\n');
  assert.equal(g(dir, 'add', '.gitignore').status, 0);
  assert.equal(g(dir, 'commit', '-q', '-m', 'chore: 最初').status, 0);
  cpSync(join(kit, 'scripts/git-hooks'), join(dir, 'scripts/git-hooks'), { recursive: true });
  const r = install(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return dir;
}
const put = (dir, p, text = 'x\n') => { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), text); };
const commit = (dir, message, ...extra) => g(dir, 'commit', '-q', '-m', message, ...extra);

test('フック: 入れた後、形でないコミットは止まり、形のコミットは通る', (t) => {
  const dir = repo(t);
  put(dir, 'a.md');
  g(dir, 'add', 'a.md');
  const bad = commit(dir, 'fix: 直した');
  assert.equal(bad.status, 1, bad.stderr);
  assert.match(bad.stderr, /M4/);
  assert.match(bad.stderr, /ひな形/);
  const ok = commit(dir, GOOD);
  assert.equal(ok.status, 0, ok.stderr);
});

test('フック: add -f した ignore のファイルのコミットは止まる', (t) => {
  const dir = repo(t);
  put(dir, '.issue-run/log.md');
  assert.equal(g(dir, 'add', '-f', '.issue-run/log.md').status, 0);
  const r = commit(dir, GOOD);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /P1/);
});

test('フック: 名前の付け替えで ignore の場所や .env へ動かしても止まる', (t) => {
  const dir = repo(t);
  put(dir, 'a.js');
  put(dir, 'b.txt');
  g(dir, 'add', 'a.js', 'b.txt');
  assert.equal(commit(dir, GOOD).status, 0);
  mkdirSync(join(dir, 'node_modules'));
  assert.equal(g(dir, 'mv', 'a.js', 'node_modules/a.js').status, 0);
  const r1 = commit(dir, GOOD);
  assert.equal(r1.status, 1, r1.stderr);
  assert.match(r1.stderr, /P1/);
  assert.equal(g(dir, 'reset', '-q').status, 0);
  rmSync(join(dir, 'node_modules'), { recursive: true, force: true });
  assert.equal(g(dir, 'checkout', '--', 'a.js').status, 0);
  assert.equal(g(dir, 'mv', 'b.txt', '.env').status, 0);
  const r2 = commit(dir, GOOD);
  assert.equal(r2.status, 1, r2.stderr);
  assert.match(r2.stderr, /P2/);
});

test('フック: --only のコミットでもステージした物を見る', (t) => {
  const dir = repo(t);
  put(dir, '.issue-run/log.md');
  assert.equal(g(dir, 'add', '-f', '.issue-run/log.md').status, 0);
  const r = commit(dir, GOOD, '--only', '.issue-run/log.md');
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /P1/);
});

test('フック: git merge --no-edit のマージは通る', (t) => {
  const dir = repo(t);
  const main = g(dir, 'rev-parse', '--abbrev-ref', 'HEAD').stdout.trim();
  assert.equal(g(dir, 'checkout', '-q', '-b', 'lane').status, 0);
  put(dir, 'lane.md');
  g(dir, 'add', 'lane.md');
  assert.equal(commit(dir, GOOD).status, 0);
  assert.equal(g(dir, 'checkout', '-q', main).status, 0);
  put(dir, 'main.md');
  g(dir, 'add', 'main.md');
  assert.equal(commit(dir, GOOD).status, 0);
  const r = g(dir, 'merge', '--no-edit', 'lane');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(g(dir, 'log', '-1', '--format=%s').stdout, /^Merge /);
});

test('フック: 本体が無い worktree では検査を飛ばす', (t) => {
  const dir = repo(t);
  rmSync(join(dir, 'scripts/git-hooks'), { recursive: true, force: true });
  put(dir, 'a.md');
  g(dir, 'add', 'a.md');
  const r = commit(dir, '形でない');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /検査を飛ばす/);
});

const hooksDir = (dir) => join(dir, '.git', 'hooks');

test('フック: 入れる脚本を 2 回回しても同じ・違う中身の同名があれば止まる', (t) => {
  const dir = repo(t);
  const before = ['commit-msg', 'pre-commit'].map((n) => readFileSync(join(hooksDir(dir), n), 'utf8'));
  const again = install(dir);
  assert.equal(again.status, 0, again.stdout);
  assert.match(again.stdout, /変化なし/);
  assert.doesNotMatch(again.stdout, /書いた/);
  assert.deepEqual(['commit-msg', 'pre-commit'].map((n) => readFileSync(join(hooksDir(dir), n), 'utf8')), before);
  assert.ok(!before[0].includes('\r'), '中継は LF');
  writeFileSync(join(hooksDir(dir), 'commit-msg'), '#!/bin/sh\necho mine\n');
  const clash = install(dir);
  assert.equal(clash.status, 1);
  assert.match(clash.stdout.trim().split('\n').at(-1), /^Result: FAIL/);
  assert.match(clash.stdout, /echo mine/);
  assert.equal(readFileSync(join(hooksDir(dir), 'commit-msg'), 'utf8'), '#!/bin/sh\necho mine\n');
});

test('フック: 中継に実行の権限が付く', { skip: process.platform === 'win32' && 'Windows では実行の権限を見ない' }, (t) => {
  const dir = repo(t);
  for (const n of ['commit-msg', 'pre-commit']) assert.notEqual(statSync(join(hooksDir(dir), n)).mode & 0o111, 0, n);
});

// 中継の sh を、PATH に node が無く、よくある場所の候補も無い状態で回す（候補の行だけ無い場所に差し替えた写しで）
function findSh() {
  if (process.platform !== 'win32') return existsSync('/bin/sh') ? '/bin/sh' : null;
  const exec = spawnSync('git', ['--exec-path'], { encoding: 'utf8' }).stdout?.trim();
  if (!exec) return null;
  const sh = join(exec, '..', '..', '..', 'usr', 'bin', 'sh.exe');
  return existsSync(sh) ? sh : null;
}
const sh = findSh();

test('フック: node が見つからなければ止める', { skip: !sh && 'sh が見つからない' }, (t) => {
  const dir = repo(t);
  const relay = readFileSync(join(hooksDir(dir), 'commit-msg'), 'utf8');
  const noCandidates = relay.replace(/^for c in .*; do$/m, 'for c in /no-such-dir/node; do');
  assert.notEqual(noCandidates, relay, '候補の行を差し替えられる');
  writeFileSync(join(dir, 'relay.sh'), noCandidates);
  put(dir, 'msg.txt', GOOD);
  const r = spawnSync(sh, ['relay.sh', 'msg.txt'], { cwd: dir, encoding: 'utf8', env: { ...env, PATH: dirname(sh), PROGRAMFILES: '' } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /node が見つからない/);
});
