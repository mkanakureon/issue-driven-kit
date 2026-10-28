#!/usr/bin/env node
// pre-commit.mjs — git の pre-commit フックの本体（中継の .git/hooks/pre-commit から呼ばれる）。
//   node scripts/git-hooks/pre-commit.mjs
// git を呼んでステージした物（足す・変える・ignore に当たる・大きさ）を集め、lib.mjs の checkStaged を呼ぶ。
// 外れがあれば外れたファイルと理由を標準エラーに出して終了コード 1。環境変数（GIT_INDEX_FILE など）はそのまま子の git に渡す。
import { spawnSync } from 'node:child_process';
import { checkStaged } from './lib.mjs';

const fail = (why) => { console.error(`pre-commit: ${why}`); process.exit(1); };
const git = (args, input) => spawnSync('git', args, { encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024 });
const list = (filter) => {
  const r = git(['diff', '--cached', '--name-only', '--no-renames', `--diff-filter=${filter}`, '-z']);
  if (r.status !== 0) fail(`git diff --cached が失敗した: ${r.stderr}`);
  return r.stdout.split('\0').filter(Boolean);
};

const added = list('A');
const changed = list('AM');
let ignored = [];
if (added.length) {
  const r = git(['check-ignore', '--no-index', '--stdin', '-z'], added.join('\0') + '\0');
  // 0 は当たりあり・1 は当たりなし。それ以外は誤り
  if (r.status !== 0 && r.status !== 1) fail(`git check-ignore が失敗した（終了コード ${r.status}）: ${r.stderr}`);
  ignored = r.stdout.split('\0').filter(Boolean);
}
const sizes = {};
for (const p of list('ACM')) {
  const r = git(['cat-file', '-s', `:${p}`]);
  if (r.status !== 0) fail(`git cat-file -s :${p} が失敗した: ${r.stderr}`);
  sizes[p] = Number(r.stdout.trim());
}
const { errors, warnings } = checkStaged({ added, changed, ignored, sizes });
for (const w of warnings) console.error(`pre-commit: 警告 ${w}`);
if (errors.length) {
  console.error('pre-commit: ステージした物に入れてはいけないものがある（scripts/git-hooks/lib.mjs）');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
