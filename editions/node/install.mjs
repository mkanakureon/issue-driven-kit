#!/usr/bin/env node
// install.mjs — Issue 駆動キットの Node 版を、利用先のリポジトリに写す（Windows・Mac・Node.js だけ）。
// 約束の正: docs/design/issue-driven-kit-basic-design.md の 3.4。導入の手順: shared/manuals/issue-driven-kit-install-guide.md
//   node editions/node/install.mjs --target <リポジトリ> --dry-run   # 写すファイルとぶつかるファイルを出すだけ
//   node editions/node/install.mjs --target <リポジトリ>             # 初めて入れる（既にあるファイルは上書きしない）
//   node editions/node/install.mjs --target <リポジトリ> --update    # 入っている版を上げる（利用先が手を入れるファイルは上書きしない）
// 写すだけ。コミット・push・パッケージの追加はしない（vitest の追加は導入ガイドの手順 4 で Claude Code が行う）。最後の行が Result: PASS／FAIL。
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const EDITION = 'node';
const here = dirname(fileURLToPath(import.meta.url));
const kitRoot = resolve(here, '../..');
const filesRoot = join(here, 'files');
// 利用先が中身を書き足すファイル。--update でも上書きせず、差があれば知らせる
const USER_OWNED = ['CLAUDE.md'];
// 写した後に作る空の置き場（.gitkeep を置く）
const EMPTY_DIRS = ['docs/inspecs', 'docs/reports'];
// .gitignore に無ければ足す行（ファイルごとは写さない。たいてい既にあるため）
const GITIGNORE_LINES = ['.issue-run/'];

const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const target = opt('--target');
const dryRun = a.includes('--dry-run');
const update = a.includes('--update');
const fail = (why) => { console.log(`Result: FAIL (${why})`); process.exit(1); };
const git = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });

if (!target) fail('--target <リポジトリ> が要る');
if (!existsSync(target) || !statSync(target).isDirectory()) fail(`入れる先のフォルダーが無い: ${target}`);
const top = git(target, 'rev-parse', '--show-toplevel');
if (top.status !== 0) fail(`入れる先が git の作業場所でない: ${target}`);
const targetRoot = resolve(top.stdout.trim());
if (resolve(target).toLowerCase() !== targetRoot.toLowerCase()) fail(`入れる先は git の作業場所の直下にする（直下は ${targetRoot}）`);

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const files = walk(filesRoot).map((f) => relative(filesRoot, f).replaceAll('\\', '/')).sort();
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const plan = files.map((rel) => {
  const from = join(filesRoot, rel), to = join(targetRoot, rel);
  let state;
  if (!existsSync(to)) state = 'new';
  else if (hash(from) === hash(to)) state = 'same';
  else if (update && !USER_OWNED.includes(rel)) state = 'update';
  else if (update) state = 'keep';
  else state = 'conflict';
  return { rel, from, to, state };
});

const label = { new: '写す', same: '同じ', update: '上げる', keep: '残す（利用先が手を入れる物。差あり）', conflict: 'ぶつかる（既にあって中身が違う）' };
for (const p of plan) console.log(`${p.state.padEnd(8)} ${p.rel}`);
const gi = join(targetRoot, '.gitignore');
const giText = existsSync(gi) ? readFileSync(gi, 'utf8') : '';
const giMissing = GITIGNORE_LINES.filter((l) => !giText.split(/\r?\n/).map((x) => x.trim()).includes(l));
if (giMissing.length) console.log(`gitignore .gitignore に足す: ${giMissing.join(' ')}`);
const count = {};
for (const p of plan) count[p.state] = (count[p.state] ?? 0) + 1;
console.log(`合計 ${plan.length} 件: ${Object.keys(count).sort().map((k) => `${label[k]} ${count[k]}`).join('・')}`);

const conflicts = plan.filter((p) => p.state === 'conflict');
if (conflicts.length) {
  console.log('既にあって中身が違うファイルがある。上書きしない。中身を足す形にするか、--update で入れ直す:');
  conflicts.forEach((c) => console.log(`  ${c.rel}`));
  fail(`ぶつかる ${conflicts.length} 件`);
}
if (dryRun) { console.log('Result: PASS (DryRun・何も書いていない)'); process.exit(0); }

for (const p of plan.filter((x) => x.state === 'new' || x.state === 'update')) {
  mkdirSync(dirname(p.to), { recursive: true });
  copyFileSync(p.from, p.to);
}
for (const d of EMPTY_DIRS) {
  const full = join(targetRoot, d);
  if (!existsSync(full)) { mkdirSync(full, { recursive: true }); writeFileSync(join(full, '.gitkeep'), ''); }
}
if (giMissing.length) writeFileSync(gi, giText + (giText && !giText.endsWith('\n') ? '\n' : '') + '# Issue 駆動キット（無人の回のログ・テストの結果）\n' + giMissing.join('\n') + '\n', 'utf8');

const c = git(kitRoot, 'rev-parse', 'HEAD');
const dirty = !!git(kitRoot, 'status', '--porcelain').stdout.trim();
// キットのリポジトリ（owner/name。キットの origin から）。点検（doctor.mjs）がその既定のブランチの最新と比べる。GitHub でなければ空
const om = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(git(kitRoot, 'remote', 'get-url', 'origin').stdout?.trim() ?? '');
const repo = om ? `${om[1]}/${om[2]}` : '';
const version = { kit: 'issue-driven-kit', edition: EDITION, repo, commit: c.status === 0 ? c.stdout.trim() : '', dirty, installedAt: new Date().toISOString(), files };
mkdirSync(join(targetRoot, '.issue-kit'), { recursive: true });
writeFileSync(join(targetRoot, '.issue-kit', 'version'), JSON.stringify(version, null, 2) + '\n', 'utf8');

const written = plan.filter((p) => p.state === 'new' || p.state === 'update').length;
console.log(`Result: PASS (${written} 件を写した・版 ${EDITION}・キット ${version.commit.slice(0, 8)}${dirty ? '（未コミットの変更あり）' : ''})`);
process.exit(0);
