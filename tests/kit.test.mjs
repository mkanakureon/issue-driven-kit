// kit.test.mjs — キット自身の試験（node --test tests/）。npm のパッケージは使わない。
// 合格の条件の正: docs/design/issue-driven-kit-basic-design.md の 1.2（K-1〜K-8）。
//   K-1  共有の部品と Unity 版の部品が全部ある
//   K-3  （Unity 側）Unity 版の読み取りの関数が、見本を答えどおりに読み、Node 版の見本の js の塊を確認コマンドにしない … Windows と pwsh があるときだけ
//   K-4  Unity 版を空の git の作業場所に入れると、参照（KaedeScapeBuii）と同じ物ができる … 環境変数 KIT_UNITY_REFERENCE があるときだけ
//   共有の決まり（原則・進め方の決まり）が、各版の CLAUDE.md にそのまま入っている
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const kit = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(kit, p), 'utf8').replace(/^﻿/, '').replace(/\r/g, '');
const hasPwsh = process.platform === 'win32' && spawnSync('pwsh', ['-NoProfile', '-Command', 'exit 0']).status === 0;

const unityFiles = [
  'CLAUDE.md',
  '.claude/issue-run/prompt.md', '.claude/issue-run/settings.json', '.claude/issue-run/stop-hook.ps1',
  ...['commit', 'design-cycle', 'document-authoring', 'file-header', 'github-issue', 'lane-sync', 'pr', 'push', 'save-report']
    .map((s) => `.claude/skills/${s}/SKILL.md`),
  '.github/ISSUE_TEMPLATE/claude-run.md', '.gitattributes', '.gitignore',
  'Scripts/issue-run.ps1', 'Scripts/issue-run-doctor.ps1', 'Scripts/Sync-Lanes.ps1', 'Scripts/unity-test.ps1',
  'Docs/Guides/README.md',
  'Docs/Guides/Working/issue-run.md', 'Docs/Guides/Working/issue-driven-development.md',
  'Docs/Guides/Working/worktree-lanes.md', 'Docs/Guides/Working/github-repo.md',
  'Docs/Guides/Procedures/issue-goal-setting.md', 'Docs/Guides/Procedures/unity-test-procedure.md',
  'Docs/Guides/Decisions/test-plan.md', 'Docs/Guides/Decisions/genai-cli-mcp-policy.md',
];
const sharedFiles = [
  'shared/spec/issue-run-spec.md',
  'shared/claude-md/principles.md', 'shared/claude-md/conventions.md',
  'shared/manuals/issue-driven-guide-for-teams.md', 'shared/manuals/issue-driven-prompt-manual.md',
  'shared/manuals/prompt-suggestions-guide.md', 'shared/manuals/issue-driven-repo-setup.md',
  'shared/manuals/issue-driven-kit-install-guide.md',
  'shared/reading/why-suggestions-worked.md', 'LICENSE',
  'docs/design/issue-driven-kit-basic-design.md',
  'editions/unity/install.ps1',
  ...Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, '0'))
    .flatMap((n) => [`shared/fixtures/issues/${n}.md`, `shared/fixtures/issues/${n}.expected.json`]),
];

test('K-1 共有の部品と Unity 版の部品が全部ある', () => {
  const missing = [...sharedFiles, ...unityFiles.map((f) => `editions/unity/files/${f}`)].filter((p) => !existsSync(join(kit, p)));
  assert.deepEqual(missing, [], `無い: ${missing.join(', ')}`);
});

test('Unity 版の files/ には、一覧に無い物が入っていない', () => {
  const root = join(kit, 'editions/unity/files');
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [relative(root, join(d, e.name)).replaceAll('\\', '/')]);
  const extra = walk(root).filter((f) => !unityFiles.includes(f));
  assert.deepEqual(extra, [], `一覧に無い: ${extra.join(', ')}`);
});

test('共有の決まりが、各版の CLAUDE.md にそのまま入っている', () => {
  for (const block of ['shared/claude-md/principles.md', 'shared/claude-md/conventions.md']) {
    const text = read(block).trim();
    for (const edition of readdirSync(join(kit, 'editions'))) {
      const md = join('editions', edition, 'files/CLAUDE.md');
      if (!existsSync(join(kit, md))) continue;
      assert.ok(read(md).includes(text), `${md} に ${block} が無い（版の CLAUDE.md の決まりを変えたら shared/ も同じに直す）`);
    }
  }
});

test('見本の答えの形', () => {
  for (const d of ['shared/fixtures/issues', 'shared/fixtures/issues-node']) {
    for (const f of readdirSync(join(kit, d)).filter((f) => f.endsWith('.expected.json'))) {
      const e = JSON.parse(read(`${d}/${f}`));
      for (const k of ['source', 'items', 'checkLang', 'check', 'prerequisites', 'tracked', 'protected']) assert.ok(k in e, `${d}/${f} に ${k} が無い`);
      assert.ok(e.items.length > 0 && e.check.length > 0, `${d}/${f} の条件か確認コマンドが空`);
    }
  }
});

test('K-3（Unity 側）Unity 版の読み取りが見本を答えどおりに読む', { skip: !hasPwsh && 'Windows と pwsh が要る' }, () => {
  const r = spawnSync('pwsh', ['-NoProfile', '-File', join(kit, 'tests/unity/read-fixtures.ps1')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Result: PASS/);
});

test('K-3（Unity 側）Node 版の見本の確認コマンドを読まない', { skip: !hasPwsh && 'Windows と pwsh が要る' }, () => {
  const r = spawnSync('pwsh', ['-NoProfile', '-File', join(kit, 'tests/unity/read-fixtures.ps1'), '-Fixtures', 'issues-node'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Result: PASS/);
});

test('K-4 Unity 版を入れると参照と同じ物ができる', { skip: (!hasPwsh || !process.env.KIT_UNITY_REFERENCE) && 'Windows・pwsh・環境変数 KIT_UNITY_REFERENCE（KaedeScapeBuii のパス）が要る' }, () => {
  const ref = process.env.KIT_UNITY_REFERENCE;
  const dir = mkdtempSync(join(tmpdir(), 'kit-unity-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    const dry = spawnSync('pwsh', ['-NoProfile', '-File', join(kit, 'editions/unity/install.ps1'), '-Target', dir, '-DryRun'], { encoding: 'utf8' });
    assert.equal(dry.status, 0, dry.stdout + dry.stderr);
    assert.ok(!existsSync(join(dir, 'CLAUDE.md')), 'DryRun なのに書いた');
    const r = spawnSync('pwsh', ['-NoProfile', '-File', join(kit, 'editions/unity/install.ps1'), '-Target', dir], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    // 公開の写しは、PC の中のパス（C:\Users\<名前>\）だけ <you> に伏せてある（shared/SOURCE.md）。参照も同じに伏せてから比べる
    const mask = (t) => t.replace(/C:\\Users\\[^\\<>\s]+\\/g, 'C:\\Users\\<you>\\').replace(/C:\/Users\/[^/<>\s]+\//g, 'C:/Users/<you>/').replace(/`c\/Users\/[^/<>\s]+\//g, '`c/Users/<you>/');
    const hash = (p) => createHash('sha256').update(mask(readFileSync(p, 'utf8'))).digest('hex');
    // 参照と違ってよいのは、利用先が書くひな形の CLAUDE.md だけ
    const allowed = new Set(['CLAUDE.md']);
    const differ = unityFiles.filter((f) => !allowed.has(f) && hash(join(dir, f)) !== hash(join(ref, f)));
    assert.deepEqual(differ, [], `参照と違う: ${differ.join(', ')}`);
    const v = JSON.parse(readFileSync(join(dir, '.issue-kit/version'), 'utf8'));
    assert.equal(v.edition, 'unity');
    // もう一度入れると、全部「同じ」で何も書かない
    const again = spawnSync('pwsh', ['-NoProfile', '-File', join(kit, 'editions/unity/install.ps1'), '-Target', dir], { encoding: 'utf8' });
    assert.equal(again.status, 0, again.stdout + again.stderr);
    assert.match(again.stdout, /Result: PASS \(0 件を写した/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('入れる脚本（Unity 版）: 既にある CLAUDE.md・.gitignore は残し、横に .kit を置いて残りを入れる', { skip: !hasPwsh && 'Windows と pwsh が要る' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-unity-aside-'));
  const inst = (...args) => spawnSync('pwsh', ['-NoProfile', '-File', join(kit, 'editions/unity/install.ps1'), '-Target', dir, ...args], { encoding: 'utf8' });
  const files = join(kit, 'editions/unity/files');
  try {
    assert.equal(spawnSync('git', ['init', '-q', dir]).status, 0);
    writeFileSync(join(dir, 'CLAUDE.md'), '# mine\n');
    writeFileSync(join(dir, '.gitignore'), 'Library/\n');
    // DryRun: 横に置く予定が出て、何も書かない
    const dry = inst('-DryRun');
    assert.equal(dry.status, 0, dry.stdout + dry.stderr);
    assert.match(dry.stdout, /^aside +CLAUDE\.md → CLAUDE\.kit\.md$/m);
    assert.match(dry.stdout, /^aside +\.gitignore → \.gitignore\.kit$/m);
    assert.match(dry.stdout, /横に置く（[^）]*） 2/);
    assert.ok(!existsSync(join(dir, 'CLAUDE.kit.md')) && !existsSync(join(dir, '.gitignore.kit')), 'DryRun なのに横に置いた');
    assert.ok(!existsSync(join(dir, 'Scripts/issue-run.ps1')), 'DryRun なのに書いた');
    // 本番: 既にある物は元のまま・横の物はキットの物・ほかは全部入る
    const r = inst();
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Result: PASS \(\d+ 件を写した・横に置いた 2 件/);
    assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), '# mine\n');
    assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), 'Library/\n');
    assert.deepEqual(readFileSync(join(dir, 'CLAUDE.kit.md')), readFileSync(join(files, 'CLAUDE.md')));
    assert.deepEqual(readFileSync(join(dir, '.gitignore.kit')), readFileSync(join(files, '.gitignore')));
    for (const f of unityFiles) assert.ok(existsSync(join(dir, f)), `写っていない: ${f}`);
    assert.deepEqual(readFileSync(join(dir, '.gitattributes')), readFileSync(join(files, '.gitattributes')));
    const v = JSON.parse(readFileSync(join(dir, '.issue-kit/version'), 'utf8'));
    assert.ok(!v.files.some((f) => f.endsWith('.kit') || f.includes('.kit.')), '版のファイルに横に置いた名前を入れた');
    // もう一度入れても PASS（何も写さない）
    const again = inst();
    assert.equal(again.status, 0, again.stdout + again.stderr);
    assert.match(again.stdout, /Result: PASS \(0 件を写した・横に置いた 2 件/);
    // 利用先が手を入れる物でないファイルがぶつかると、何も書かずに FAIL
    rmSync(join(dir, 'CLAUDE.kit.md'));
    writeFileSync(join(dir, 'Scripts/unity-test.ps1'), '# mine\n');
    const c = inst();
    assert.equal(c.status, 1, c.stdout + c.stderr);
    assert.match(c.stdout, /Result: FAIL \(ぶつかる 1 件\)/);
    assert.ok(!existsSync(join(dir, 'CLAUDE.kit.md')), 'FAIL なのに横に置いた');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
