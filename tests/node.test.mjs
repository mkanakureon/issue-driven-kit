// node.test.mjs — Node 版の試験（node --test）。基本設計の K-2・K-3（Node 側）と、外に触らない部品。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const kit = join(dirname(fileURLToPath(import.meta.url)), '..');
const nodeRoot = join(kit, 'editions/node');
const lib = await import('../editions/node/files/scripts/issue-run/lib.mjs');
const read = (p) => readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

test('K-2 Node 版に PowerShell が出てこない', () => {
  const files = walk(nodeRoot);
  const ps1 = files.filter((f) => f.toLowerCase().endsWith('.ps1')).map((f) => relative(kit, f));
  assert.deepEqual(ps1, [], `.ps1 がある: ${ps1.join(', ')}`);
  const bad = [];
  for (const f of files) {
    const lines = read(f).split('\n');
    lines.forEach((l, i) => {
      // pwsh という言葉・powershell の実行は不可。Claude の道具を断る設定の「PowerShell(…)」だけは許す（Windows の Claude Code の道具の名前）
      if (/\bpwsh\b/i.test(l) || /powershell(?!\()/i.test(l)) bad.push(`${relative(kit, f)}:${i + 1}: ${l.trim().slice(0, 80)}`);
    });
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('K-3（Node 側）見本を Unity 版と同じに読む', () => {
  const dir = join(kit, 'shared/fixtures/issues');
  let n = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.expected.json'))) {
    const exp = JSON.parse(read(join(dir, f)));
    // Unity 版の見本の確認コマンドの塊（pwsh）を、Node 版の塊（js）に置き換えて読ませる。中身の読み方は同じでなければならない
    const body = read(join(dir, f.replace('.expected.json', '.md'))).replace(/^```(pwsh|powershell)\s*$/gm, '```js');
    const c = lib.parsePassCriteria(body);
    assert.deepEqual(c.items, exp.items, `${f} items`);
    assert.equal(c.check, exp.check, `${f} check`);
    assert.deepEqual(lib.parsePrerequisites(body), exp.prerequisites, `${f} prerequisites`);
    const tracked = new Set(exp.tracked.map((p) => p.toLowerCase()));
    const prot = lib.protectedFiles(c.check, {
      isFile: (p) => tracked.has(p.replaceAll('\\', '/').replace(/^(\.\/|\/)+/, '').toLowerCase()),
      isTracked: (rel) => tracked.has(rel.toLowerCase()),
    });
    assert.deepEqual(prot, exp.protected, `${f} protected`);
    n++;
  }
  assert.ok(n >= 13, `見本が ${n} 件`);
});

test('K-3（Node 側）Node 版の見本を答えどおりに読む', () => {
  const dir = join(kit, 'shared/fixtures/issues-node');
  let n = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.expected.json'))) {
    const exp = JSON.parse(read(join(dir, f)));
    assert.equal(exp.checkLang, 'js', `${f} checkLang`);
    // Node 版の本文をそのまま読む（塊を置き換えない）
    const body = read(join(dir, f.replace('.expected.json', '.md')));
    const c = lib.parsePassCriteria(body);
    assert.deepEqual(c.items, exp.items, `${f} items`);
    assert.equal(c.check, exp.check, `${f} check`);
    assert.deepEqual(lib.parsePrerequisites(body), exp.prerequisites, `${f} prerequisites`);
    const tracked = new Set(exp.tracked.map((p) => p.toLowerCase()));
    const prot = lib.protectedFiles(c.check, {
      isFile: (p) => tracked.has(p.replaceAll('\\', '/').replace(/^(\.\/|\/)+/, '').toLowerCase()),
      isTracked: (rel) => tracked.has(rel.toLowerCase()),
    });
    assert.deepEqual(prot, exp.protected, `${f} protected`);
    n++;
  }
  assert.ok(n >= 4, `Node 版の見本が ${n} 件`);
});

test('Node 版の言語の塊だけを確認コマンドにする', () => {
  const body = '## 合格の条件\n\n- a が通る\n\n```pwsh\nexit 0\n```\n\n```js\nprocess.exit(0)\n```\n';
  assert.equal(lib.parsePassCriteria(body).check, 'process.exit(0)');
  assert.equal(lib.parsePassCriteria(body, ['pwsh']).check, 'exit 0');   // 言語は差し替えられる（キットの試験から渡す）
  assert.deepEqual(lib.parsePassCriteria('## 合格の条件\n\n```js\nx\n```\n').items, []);
});

test('点で始まるフォルダーの頭の点を取らない', () => {
  const t = new Set(['.github/issue_template/claude-run.md']);
  const prot = lib.protectedFiles('"./.github/ISSUE_TEMPLATE/claude-run.md"', { isFile: () => true, isTracked: (r) => t.has(r.toLowerCase()) });
  assert.deepEqual(prot, ['.github/ISSUE_TEMPLATE/claude-run.md']);
});

test('守るファイル: ファイルのパスを丸ごと変数に入れても守られる', () => {
  const t = new Set(['docs/guides/working/x-design.md']);
  const prot = lib.protectedFiles("const d = 'docs/guides/working/x-design.md';   // 書かせる文書は変数で指す", { isFile: () => true, isTracked: (r) => t.has(r) });
  assert.deepEqual(prot, ['docs/guides/working/x-design.md']);
});

test('守るファイル: フォルダーを変数に入れて組み立てたファイルは守られない', () => {
  const t = new Set(['docs/guides/working/x-design.md']);
  const prot = lib.protectedFiles("const dir = 'docs/guides/working';\nconst d = `${dir}/x-design.md`;", { isFile: (r) => t.has(r), isTracked: (r) => t.has(r) });
  assert.deepEqual(prot, []);
});

test('作業場所の POSIX 形', () => {
  assert.equal(lib.repoPosix('D:\\Unreal Projects\\kaedevn\\'), 'd/Unreal Projects/kaedevn');
  assert.equal(lib.repoPosix('/Users/mk/work/app'), 'Users/mk/work/app');
});

test('開始〜終了の書き方と 1 行目の形', () => {
  assert.equal(lib.formatSpan(new Date(2026, 9, 22, 9, 36), new Date(2026, 9, 22, 9, 42)), '2026-10-22 09:36〜09:42');
  assert.equal(lib.formatSpan(new Date(2026, 9, 22, 23, 50), new Date(2026, 9, 23, 0, 40)), '2026-10-22 23:50〜2026-10-23 00:40');
  const h = lib.headLine({ status: 'PASS', minutes: 6, span: 'x', rounds: 1, commits: 2, folder: 'app', branch: 'main', head: '81093d6c', logDir: '.issue-run/logs/1/' });
  assert.deepEqual(lib.headShasFromComment(h), ['81093d6c']);
});

test('利用上限と認証切れの見分け', () => {
  assert.ok(lib.isLimitError({ is_error: true, api_error: 'usage_limit_reached' }, ''));
  assert.ok(lib.isLimitError(null, "You've hit your session limit · resets 11:30am"));
  assert.ok(!lib.isLimitError({ is_error: false }, 'rate limit'));
  assert.ok(lib.isAuthError('OAuth session expired'));
});

test('報告の「合格」の行', () => {
  assert.ok(lib.reportClaimsPass('## 結果: 合格\n| a |'));
  assert.ok(!lib.reportClaimsPass('## 結果: 未合格'));
});

test('まとめ（Node 版）: 作業場所の絶対パスを書かない', () => {
  const base = { runStamp: '20261024-0859', repo: 'o/app', logDir: '.issue-run/logs/20261024-0859/', aborted: '', results: [] };
  for (const root of ['/Users/someone-mac/work/app', 'C:\\Users\\someone-win\\work\\app', '/Users/someone-mac/work/app/']) {
    const md = lib.summaryMarkdown({ ...base, root, branch: 'main' });
    assert.doesNotMatch(md, /someone|Users/);
    assert.match(md, /作業場所 app（main）/);
  }
  assert.match(lib.summaryMarkdown({ ...base, root: '/Users/someone-mac/x', folder: 'app', branch: 'lane-a' }), /作業場所 app（lane-a）/);
});

test('終わりの知らせ（Node 版）: Mac は通知を出し、ほかはベルだけ', () => {
  const results = [{ number: 7, status: 'PASS' }, { number: 8, status: 'NOT-PASS' }];
  const mac = lib.finishNotice({ platform: 'darwin', results });
  assert.equal(mac.bell, '\x07issue-run 終わり: #7 PASS #8 NOT-PASS');
  assert.deepEqual(mac.osascript, ['-e', 'display notification "issue-run 終わり: #7 PASS #8 NOT-PASS" with title "issue-run"']);
  for (const platform of ['win32', 'linux']) {
    const n = lib.finishNotice({ platform, results });
    assert.equal(n.bell, mac.bell);
    assert.equal(n.osascript, null);
  }
  // 中断の理由の " と \ を逃がす・改行は空白
  const ab = lib.finishNotice({ platform: 'darwin', results: [], aborted: 'gh "x" が C:\\a で失敗\n2 行目' });
  assert.match(ab.bell, /^\x07issue-run 終わり: なし（中断: /);
  assert.equal(ab.osascript[1], 'display notification "issue-run 終わり: なし（中断: gh \\"x\\" が C:\\\\a で失敗 2 行目）" with title "issue-run"');
  // --no-notify
  assert.deepEqual(lib.finishNotice({ platform: 'darwin', results, notify: false }), { bell: '', osascript: null });
  // 脚本は引数 --no-notify を読み、知らせを回の結果に響かせない
  const src = read(join(nodeRoot, 'files/scripts/issue-run/issue-run.mjs'));
  assert.match(src, /args\['no-notify'\]/);
  assert.match(src, /try \{ run\('osascript', notice\.osascript\); \} catch/);
});

test('対象 0 件（Node 版）: 履歴に 1 行残し、直近に合格した Issue を出す', () => {
  assert.equal(lib.runsLogLine({ runStamp: '20261024-085900', count: 0 }), '20261024-085900\t対象 0 件\tなし\t-\n');
  assert.equal(lib.runsLogLine({ runStamp: '20261024-085900', count: 2, results: [{ number: 7, status: 'PASS' }, { number: 8, status: 'NOT-PASS' }], summary: 'docs/reports/2026/10/24/01-issue-run.md' }),
    '20261024-085900\t対象 2 件\t#7 PASS #8 NOT-PASS\tdocs/reports/2026/10/24/01-issue-run.md\n');
  assert.equal(lib.runsLogLine({ runStamp: 's', count: 1, aborted: '認証が\n切れた\tx', summary: 'a.md' }), 's\t対象 1 件\tなし 中断: 認証が 切れた x\ta.md\n');
  assert.equal(lib.latestDoneText([{ number: 7, title: '終わりの知らせ', updatedAt: '2026-10-24T08:59:00Z' }]), '直近に合格した Issue: #7 終わりの知らせ（更新 2026-10-24T08:59:00Z）');
  assert.equal(lib.latestDoneText([]), '直近に合格した Issue: まだ無い');
  // 脚本: 0 件の所で履歴に足してから終わり、claude-done を閉じたものも含めて更新順に 1 件だけ問う。DryRun はその前に終わる
  const src = read(join(nodeRoot, 'files/scripts/issue-run/issue-run.mjs'));
  const zero = src.slice(src.indexOf('if (!targets.length) {'));
  assert.ok(src.indexOf('if (DRY_RUN) {') < src.indexOf('if (!targets.length) {'));
  assert.match(zero.slice(0, zero.indexOf('process.exit(0)')), /appendFileSync\(RUNS_LOG, L\.runsLogLine\(\{ runStamp: RUN_STAMP, count: 0 \}\)/);
  assert.match(zero, /'--state', 'all', '--search', 'sort:updated-desc', '--limit', '1'/);
  assert.match(src, /RUNS_LOG = join\(ROOT, LOG_BASE, 'runs\.log'\)/);
});

// 権限を返す関数を外から与える（GitHub を呼ばない）。読めない人は投げる
const perms = { owner: 'admin', member: 'write', lead: 'maintain', guest: 'read', triager: 'triage' };
const permissionOf = (login) => { if (!(login in perms)) throw new Error('HTTP 404'); return perms[login]; };
const issue = (number, login, labels = ['claude-run']) => ({ number, author: { login }, labels: labels.map((name) => ({ name })) });

test('無人の回（Node 版）: 書き込みの権限の無い人が作った Issue を拾わない', () => {
  const r = lib.selectTargets([issue(3, 'guest'), issue(4, 'triager'), issue(5, 'stranger'), issue(6, undefined)], { canWrite: lib.permissionChecker(permissionOf) });
  assert.deepEqual(r.targets, []);
  assert.deepEqual(r.excluded.map((e) => e.number), [3, 4, 5, 6]);
  assert.match(r.excluded[0].reason, /guest に書き込みの権限が無い（read）/);
  assert.match(r.excluded[2].reason, /stranger の権限が読めない（HTTP 404）/);   // 読めなければ拾わない側
});

test('無人の回（Node 版）: 書き込みの権限のある人が作った Issue は拾う', () => {
  let calls = 0;
  const canWrite = lib.permissionChecker((l) => { calls++; return permissionOf(l); });
  const r = lib.selectTargets([issue(9, 'owner'), issue(2, 'member'), issue(7, 'lead'), issue(8, 'owner', ['claude-run', 'claude-done']), issue(10, 'guest'), issue(11, 'owner')],
    { canWrite, skip: ['claude-working', 'claude-done', 'claude-failed'], max: 3 });
  assert.deepEqual(r.targets.map((t) => t.number), [2, 7, 9]);
  assert.deepEqual(r.excluded.map((e) => e.number), [10]);
  assert.equal(calls, 4);   // 同じ人は 1 回だけ問う
});

test('無人の回（Node 版）: 前提の確かめは書き込みの権限のある人のコメントだけを数える', () => {
  const canWrite = lib.permissionChecker(permissionOf);
  const mine = 'issue-run.mjs: **PASS** — 6 分（x）・1 回・コミット 1 件・作業場所 app（main・HEAD 81093d6c）・ログ y/';
  const fake = 'issue-run.mjs: **PASS** — 1 分（x）・1 回・コミット 1 件・作業場所 app（main・HEAD deadbeef）・ログ y/';
  const comments = [{ author: { login: 'owner' }, body: mine }, { author: { login: 'guest' }, body: fake }, { author: { login: 'stranger' }, body: fake }, { author: { login: 'member' }, body: 'ありがとう' }];
  assert.deepEqual(lib.headShasFromComment(lib.lastRunComment(comments, canWrite).body), ['81093d6c']);
  assert.equal(lib.lastRunComment(comments.slice(1), canWrite), undefined);
});

// ---- 外に触る部品（GitHub と Claude を呼ばない範囲） ----
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const nodeFiles = [
  'CLAUDE.md',
  '.claude/issue-run/prompt.md', '.claude/issue-run/settings.json', '.claude/issue-run/stop-hook.mjs',
  ...['commit', 'design-cycle', 'document-authoring', 'file-header', 'github-issue', 'lane-sync', 'pr', 'push', 'save-report']
    .map((s) => `.claude/skills/${s}/SKILL.md`),
  '.github/ISSUE_TEMPLATE/claude-run.md',
  'scripts/test.mjs',
  ...['issue-run', 'lib', 'proc', 'check-lib', 'doctor', 'sync-lanes'].map((s) => `scripts/issue-run/${s}.mjs`),
  'docs/guides/README.md',
  'docs/guides/working/issue-run.md', 'docs/guides/working/issue-driven-development.md',
  'docs/guides/working/worktree-lanes.md', 'docs/guides/working/github-repo.md',
  'docs/guides/procedures/issue-goal-setting.md', 'docs/guides/procedures/node-test-procedure.md',
  'docs/guides/decisions/test-plan.md', 'docs/guides/decisions/genai-cli-mcp-policy.md',
];

test('K-1（Node 版）部品が全部あり、一覧に無い物が無い', () => {
  const root = join(nodeRoot, 'files');
  const have = walk(root).map((f) => relative(root, f).replaceAll('\\', '/'));
  assert.deepEqual(nodeFiles.filter((f) => !have.includes(f)), [], '無い');
  assert.deepEqual(have.filter((f) => !nodeFiles.includes(f)), [], '一覧に無い');
  assert.ok(existsSync(join(nodeRoot, 'install.mjs')));
  JSON.parse(read(join(root, '.claude/issue-run/settings.json')));
});

const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', ...opts });

test('入れる脚本（Node 版）: DryRun・本番・2 回目・ぶつかるとき', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-node-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    writeFileSync(join(dir, '.gitignore'), 'node_modules/\n');
    const inst = join(nodeRoot, 'install.mjs');
    const dry = node([inst, '--target', dir, '--dry-run']);
    assert.equal(dry.status, 0, dry.stdout + dry.stderr);
    assert.ok(!existsSync(join(dir, 'CLAUDE.md')), 'DryRun なのに書いた');
    const r = node([inst, '--target', dir]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    for (const f of nodeFiles) assert.ok(existsSync(join(dir, f)), `写っていない: ${f}`);
    assert.ok(read(join(dir, '.gitignore')).includes('.issue-run/'), '.gitignore に足していない');
    assert.ok(read(join(dir, '.gitignore')).includes('node_modules/'), '.gitignore の元の行を消した');
    assert.ok(existsSync(join(dir, 'docs/inspecs/.gitkeep')));
    const v = JSON.parse(read(join(dir, '.issue-kit/version')));
    assert.equal(v.edition, 'node');
    assert.ok(!walk(dir).some((f) => f.toLowerCase().endsWith('.ps1')), '.ps1 が入った');
    const again = node([inst, '--target', dir]);
    assert.match(again.stdout, /Result: PASS \(0 件を写した/);
    assert.equal(read(join(dir, '.gitignore')).split('.issue-run/').length, 2, '.gitignore に 2 回足した');
    // ぶつかるとき: 中身の違う既存のファイルは上書きせずに止まる
    writeFileSync(join(dir, 'scripts/test.mjs'), '// mine\n');
    const c = node([inst, '--target', dir]);
    assert.equal(c.status, 1);
    assert.match(c.stdout, /Result: FAIL \(ぶつかる 1 件\)/);
    assert.equal(read(join(dir, 'scripts/test.mjs')), '// mine\n', '上書きした');
    // --update は上げる（CLAUDE.md は利用先の物なので残す）
    writeFileSync(join(dir, 'CLAUDE.md'), '# mine\n');
    const u = node([inst, '--target', dir, '--update']);
    assert.equal(u.status, 0, u.stdout);
    assert.notEqual(read(join(dir, 'scripts/test.mjs')), '// mine\n');
    assert.equal(read(join(dir, 'CLAUDE.md')), '# mine\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('入れる脚本（Node 版）: 既にある CLAUDE.md は残し、キットの物を CLAUDE.kit.md として横に置いて残りを入れる', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-node-aside-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    writeFileSync(join(dir, 'CLAUDE.md'), '# mine\n');
    const inst = join(nodeRoot, 'install.mjs');
    const kitClaude = readFileSync(join(nodeRoot, 'files/CLAUDE.md'));
    // DryRun: 横に置く予定が一覧と合計に出て、何も書かない
    const dry = node([inst, '--target', dir, '--dry-run']);
    assert.equal(dry.status, 0, dry.stdout + dry.stderr);
    assert.match(dry.stdout, /^aside +CLAUDE\.md → CLAUDE\.kit\.md$/m);
    assert.match(dry.stdout, /横に置く（[^）]*） 1/);
    assert.match(dry.stdout, /Result: PASS \(DryRun・何も書いていない\)/);
    assert.ok(!existsSync(join(dir, 'CLAUDE.kit.md')), 'DryRun なのに横に置いた');
    assert.ok(!existsSync(join(dir, 'scripts/test.mjs')), 'DryRun なのに書いた');
    // 本番: CLAUDE.md は元のまま・CLAUDE.kit.md はキットの物・ほかは全部入る
    const r = node([inst, '--target', dir]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Result: PASS \(\d+ 件を写した・横に置いた 1 件/);
    assert.match(r.stdout, /CLAUDE\.kit\.md（CLAUDE\.md に足す）/);
    assert.equal(read(join(dir, 'CLAUDE.md')), '# mine\n', '既にある CLAUDE.md を書き換えた');
    assert.deepEqual(readFileSync(join(dir, 'CLAUDE.kit.md')), kitClaude, 'CLAUDE.kit.md がキットの物と違う');
    for (const f of nodeFiles.filter((f) => f !== 'CLAUDE.md')) assert.ok(existsSync(join(dir, f)), `写っていない: ${f}`);
    const v = JSON.parse(read(join(dir, '.issue-kit/version')));
    assert.ok(!v.files.includes('CLAUDE.kit.md'), '版のファイルに横に置いた名前を入れた');
    // もう一度入れても PASS（何も写さない）
    const again = node([inst, '--target', dir]);
    assert.equal(again.status, 0, again.stdout + again.stderr);
    assert.match(again.stdout, /Result: PASS \(0 件を写した・横に置いた 1 件/);
    assert.equal(read(join(dir, 'CLAUDE.md')), '# mine\n');
    // 横に置いた物が古くなっていれば、キットの物で書き直す
    writeFileSync(join(dir, 'CLAUDE.kit.md'), 'old\n');
    assert.equal(node([inst, '--target', dir]).status, 0);
    assert.deepEqual(readFileSync(join(dir, 'CLAUDE.kit.md')), kitClaude);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('入れる脚本（Node 版）: 利用先が手を入れる物でないファイルがぶつかると、何も書かずに FAIL', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-node-conflict-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    writeFileSync(join(dir, 'CLAUDE.md'), '# mine\n');
    mkdirSync(join(dir, 'scripts'));
    writeFileSync(join(dir, 'scripts/test.mjs'), '// mine\n');
    // .git の外のファイルの一覧（入れる脚本が書いたかを比べる）
    const list = () => walk(dir).map((f) => relative(dir, f).replaceAll('\\', '/')).filter((f) => !f.startsWith('.git/')).sort();
    const before = list();
    const r = node([join(nodeRoot, 'install.mjs'), '--target', dir]);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /Result: FAIL \(ぶつかる 1 件\)/);
    const after = list();
    assert.deepEqual(after, before, '何か書いた');
    assert.ok(!existsSync(join(dir, 'CLAUDE.kit.md')), 'CLAUDE.kit.md を書いた');
    assert.equal(read(join(dir, 'CLAUDE.md')), '# mine\n');
    assert.equal(read(join(dir, 'scripts/test.mjs')), '// mine\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Stop hook（Node 版）: 押し返す・終わらせる・守るファイル・点検の印', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-hook-'));
  try {
    const hook = join(nodeRoot, 'files/.claude/issue-run/stop-hook.mjs');
    const report = join(dir, 'report.md'), protect = join(dir, 'protect.tsv'), state = join(dir, 'state.txt');
    mkdirSync(join(dir, 'test'), { recursive: true });
    writeFileSync(join(dir, 'test/a.test.ts'), 'x');
    writeFileSync(protect, lib.snapshotLines(dir, ['test/a.test.ts']).join('\n') + '\n');
    const env = { ...process.env, ISSUE_RUN_ROOT: dir, ISSUE_RUN_REPORT: report, ISSUE_RUN_PROTECT: protect, ISSUE_RUN_STATE: state, ISSUE_RUN_MAXBLOCKS: '2' };
    const run = () => node([hook], { env, input: '{}' });
    // 報告が無い → 押し返す
    let r = run();
    assert.equal(JSON.parse(r.stdout).decision, 'block');
    assert.match(JSON.parse(r.stdout).reason, /1\/2 回目の押し返し/);
    // 合格と書いたが守るファイルを変えた → 押し返す
    writeFileSync(report, '## 結果: 合格\n');
    writeFileSync(join(dir, 'test/a.test.ts'), 'changed');
    r = run();
    assert.match(JSON.parse(r.stdout).reason, /確認コマンドが使うファイルを変えた: test\/a\.test\.ts/);
    // 上限を超えたら押し返さない
    r = run();
    assert.equal(r.stdout, '');
    // 戻せば終わってよい
    writeFileSync(join(dir, 'test/a.test.ts'), 'x');
    writeFileSync(state, '0');
    r = run();
    assert.equal(r.stdout, '');
    // 点検のとき
    const mark = join(dir, 'probe.txt');
    node([hook], { env: { ...process.env, ISSUE_RUN_PROBE: mark }, input: '{}' });
    assert.ok(existsSync(mark));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('テストの入口（Node 版）: vitest が無ければ FAIL', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-test-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    writeFileSync(join(dir, 'scripts/test.mjs'), readFileSync(join(nodeRoot, 'files/scripts/test.mjs')));
    const r = node([join(dir, 'scripts/test.mjs')], { cwd: dir });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /Result: FAIL \(vitest が無い/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// node --test で回す小さなプロジェクトを作り、テストの入口を回す
function nodeTestProject(tests) {
  const dir = mkdtempSync(join(tmpdir(), 'kit-test-'));
  mkdirSync(join(dir, 'scripts'));
  mkdirSync(join(dir, 'tests'));
  writeFileSync(join(dir, 'scripts/test.mjs'), readFileSync(join(nodeRoot, 'files/scripts/test.mjs')));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module', issueKit: { testRunner: 'node', testFiles: 'tests/*.test.mjs' } }));
  for (const [name, body] of Object.entries(tests)) writeFileSync(join(dir, 'tests', name), `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\n${body}\n`);
  return dir;
}

test('テストの入口（Node 版）: node:test で 0 件なら FAIL', () => {
  const dir = nodeTestProject({ 'a.test.mjs': "test('ひとつめ', () => {});" });
  try {
    let r = node([join(dir, 'scripts/test.mjs'), '--filter', 'どれにも当たらない名前'], { cwd: dir });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /Result: FAIL \(0\/0/);
    // ファイルが 1 本も無いときも FAIL
    rmSync(join(dir, 'tests/a.test.mjs'));
    r = node([join(dir, 'scripts/test.mjs')], { cwd: dir });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /Result: FAIL/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('テストの入口（Node 版）: node:test で名前で絞れる', () => {
  const dir = nodeTestProject({ 'a.test.mjs': "test('通るもの', () => {});\ntest('落ちるもの', () => { assert.fail('x'); });", 'b.test.mjs': "test('別のファイル', () => {});" });
  try {
    const r = node([join(dir, 'scripts/test.mjs'), '--filter', '通るもの'], { cwd: dir });
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout.trim().split(/\r?\n/).at(-1), /^Result: PASS 1\/1$/);
    assert.match(readFileSync(join(dir, '.issue-run/test-results/junit.xml'), 'utf8'), /name="通るもの"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('テストの入口（Node 版）: node:test で落ちる試験があれば FAIL', () => {
  const dir = nodeTestProject({ 'a.test.mjs': "test('通るもの', () => {});\ntest('落ちるもの', () => { assert.fail('x'); });" });
  try {
    let r = node([join(dir, 'scripts/test.mjs')], { cwd: dir });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout.trim().split(/\r?\n/).at(-1), /^Result: FAIL \(1\/2\)$/);
    // 全部通れば PASS
    writeFileSync(join(dir, 'tests/a.test.mjs'), "import { test } from 'node:test';\ntest('通るもの', () => {});\n");
    r = node([join(dir, 'scripts/test.mjs')], { cwd: dir });
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout.trim().split(/\r?\n/).at(-1), /^Result: PASS 1\/1$/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('点検（Node 版）: node:test のプロジェクトで vitest を求めない', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-doctor-'));
  try {
    mkdirSync(join(dir, 'scripts/issue-run'), { recursive: true });
    for (const s of ['doctor', 'proc']) writeFileSync(join(dir, `scripts/issue-run/${s}.mjs`), readFileSync(join(nodeRoot, `files/scripts/issue-run/${s}.mjs`)));
    const pkg = { type: 'module', scripts: { test: 'node scripts/test.mjs' } };
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ ...pkg, issueKit: { testRunner: 'node', testFiles: 'tests/*.test.mjs' } }));
    let r = node([join(dir, 'scripts/issue-run/doctor.mjs')], { cwd: dir });
    assert.doesNotMatch(r.stdout, /vitest が無い|vitest が入っていない/);
    assert.match(r.stdout, /OK {3}テストの仕組み: node --test/);
    // 欄が無ければ今までどおり vitest を求める
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    r = node([join(dir, 'scripts/issue-run/doctor.mjs')], { cwd: dir });
    assert.match(r.stdout, /NG {3}vitest: devDependencies に vitest が無い/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('入れる脚本（Node 版）: 版のファイルにキットのリポジトリを書く', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-ver-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    const r = node([join(nodeRoot, 'install.mjs'), '--target', dir]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    // 期待する値はキットの origin から（GitHub でなければ空）
    const origin = spawnSync('git', ['-C', kit, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).stdout.trim();
    const m = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(origin);
    const v = JSON.parse(read(join(dir, '.issue-kit/version')));
    assert.equal(v.repo, m ? `${m[1]}/${m[2]}` : '');
    if (m) assert.match(v.repo, /^[^/]+\/[^/]+$/);
    assert.match(v.commit, /^[0-9a-f]{40}$/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// editions/node/ を一時のキットに写して git init・コミットし、そのキット自身に入れる（本物のキットの作業ツリーの汚れに左右されない）
const gitIn = (dir, ...args) => spawnSync('git', ['-C', dir, '-c', 'user.name=kit-test', '-c', 'user.email=kit-test@example.invalid', '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' });
function withSelfKit(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'kit-self-'));
  try {
    cpSync(nodeRoot, join(dir, 'editions/node'), { recursive: true });
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    gitIn(dir, 'add', '-A', '-f');
    assert.equal(gitIn(dir, 'commit', '-q', '-m', 'kit').status, 0);
    const install = (...args) => node([join(dir, 'editions/node/install.mjs'), '--target', dir, ...args]);
    const version = () => JSON.parse(read(join(dir, '.issue-kit/version')));
    fn({ dir, install, version });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('入れる脚本（Node 版）: キット自身に入れ直しても、写した物で dirty を true にしない', () => {
  withSelfKit(({ dir, install, version }) => {
    // 初めて入れる: 写した物は未コミットになるが、写す前のキットはきれい
    const r = install();
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(version().dirty, false, r.stdout);
    assert.doesNotMatch(r.stdout, /未コミットの変更あり/);
    gitIn(dir, 'add', '-A', '-f');
    assert.equal(gitIn(dir, 'commit', '-q', '-m', 'install').status, 0);
    // files/ の直しをコミットしてから入れ直す: 写す物があっても false
    writeFileSync(join(dir, 'editions/node/files/scripts/test.mjs'), '// changed\n');
    gitIn(dir, 'add', '-A');
    assert.equal(gitIn(dir, 'commit', '-q', '-m', 'fix').status, 0);
    const u = install('--update');
    assert.equal(u.status, 0, u.stdout + u.stderr);
    assert.match(u.stdout, /^update +scripts\/test\.mjs$/m);
    assert.equal(read(join(dir, 'scripts/test.mjs')), '// changed\n');
    assert.equal(version().dirty, false, u.stdout);
    const head = gitIn(dir, 'rev-parse', 'HEAD').stdout.trim();
    assert.equal(version().commit, head);
  });
});

test('入れる脚本（Node 版）: キットに未コミットの変更があれば dirty を true にする', () => {
  withSelfKit(({ dir, install, version }) => {
    // files/ を直してコミットせずに入れる: commit に写した中身が入っていないので true
    writeFileSync(join(dir, 'editions/node/files/scripts/test.mjs'), '// changed\n');
    const r = install();
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(version().dirty, true, r.stdout);
    assert.match(r.stdout, /未コミットの変更あり/);
  });
});

// 点検をキットの版だけ見る形で回す。最新のコミットは環境変数で与える（GitHub を呼ばない）
function doctorKitVersion(version, latest) {
  const dir = mkdtempSync(join(tmpdir(), 'kit-doctor-ver-'));
  try {
    mkdirSync(join(dir, 'scripts/issue-run'), { recursive: true });
    for (const s of ['doctor', 'proc']) writeFileSync(join(dir, `scripts/issue-run/${s}.mjs`), readFileSync(join(nodeRoot, `files/scripts/issue-run/${s}.mjs`)));
    spawnSync('git', ['init', '-q', dir]);
    spawnSync('git', ['-C', dir, 'remote', 'add', 'origin', 'https://github.com/someone/app.git']);
    if (version) { mkdirSync(join(dir, '.issue-kit')); writeFileSync(join(dir, '.issue-kit/version'), JSON.stringify(version)); }
    const r = node([join(dir, 'scripts/issue-run/doctor.mjs')], { cwd: dir, env: { ...process.env, ISSUE_KIT_LATEST_COMMIT: latest } });
    return r.stdout.split(/\r?\n/).filter((l) => / キットの版: /.test(l));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const oldSha = 'a'.repeat(40), newSha = 'b1c2d3e'.padEnd(40, '0');

test('点検（Node 版）: キットの版が古ければ知らせる', () => {
  const lines = doctorKitVersion({ repo: 'owner/kit', commit: oldSha }, newSha);
  assert.equal(lines.length, 1, lines.join('\n'));
  assert.match(lines[0], /^WARN キットの版: 古い/);
  assert.ok(lines[0].includes('b1c2d3e'), '新しいコミットの短い SHA が無い');
  assert.ok(lines[0].includes('node <キット>/editions/node/install.mjs --target . --update'), '入れ直すコマンドが無い');
  // 読めないときも WARN（NG にしない）
  const none = doctorKitVersion({ repo: 'owner/kit', commit: oldSha }, '');
  assert.match(none[0], /^WARN キットの版: キットの最新を読めない/);
  // リポジトリの無い古い版のファイルも WARN
  assert.match(doctorKitVersion({ commit: oldSha }, newSha)[0], /^WARN キットの版: .*リポジトリが無い/);
});

test('点検（Node 版）: キットの版が新しければ OK', () => {
  const lines = doctorKitVersion({ repo: 'owner/kit', commit: newSha }, newSha);
  assert.equal(lines.length, 1, lines.join('\n'));
  assert.match(lines[0], /^OK {3}キットの版: owner\/kit の最新 b1c2d3e と同じ/);
});
