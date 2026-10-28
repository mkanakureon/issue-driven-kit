#!/usr/bin/env node
// install.mjs — キット自身のコミットのフック（中継の commit-msg・pre-commit）を、git の hooks/ に入れる。
//   node scripts/git-hooks/install.mjs      # リポジトリの直下で回す
// 中継は `git rev-parse --git-common-dir` の hooks/ に LF で書き、実行の権限（0o755）を付ける。core.hooksPath は変えない。
// 同じ中身なら何もしない。違う中身の同名のファイルがあれば、上書きせず中身を出して止まる。最後の行は Result: PASS／Result: FAIL。
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fail = (why) => { console.log(`Result: FAIL (${why})`); process.exit(1); };

const relay = (name) => `#!/bin/sh
# scripts/git-hooks/install.mjs が書いた中継。本体は各 worktree の scripts/git-hooks/
h="scripts/git-hooks/${name}.mjs"
[ -f "$h" ] || { echo "${name}: $h が無い（この worktree はまだ入っていない）。検査を飛ばす" >&2; exit 0; }
n="$(command -v node)"
for c in "$PROGRAMFILES/nodejs/node.exe" "/c/Program Files/nodejs/node.exe" /opt/homebrew/bin/node /usr/local/bin/node; do
  [ -n "$n" ] && break; [ -x "$c" ] && n="$c"
done
[ -n "$n" ] || { echo "${name}: node が見つからない。PATH に Node.js を入れた新しい窓でコミットする（導入ガイド 1 章）" >&2; exit 1; }
exec "$n" "$h" "$@"
`;

const r = spawnSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' });
if (r.status !== 0) fail(`git rev-parse --git-common-dir が失敗した（git のリポジトリの直下で回す）: ${r.stderr.trim()}`);
const hooks = join(resolve(r.stdout.trim()), 'hooks');
const names = ['commit-msg', 'pre-commit'];

// 先に全部見て、違う中身の同名があれば 1 つも書かずに止まる
const clash = names.filter((n) => existsSync(join(hooks, n)) && readFileSync(join(hooks, n), 'utf8') !== relay(n));
if (clash.length) {
  for (const n of clash) console.log(`違う中身の ${join(hooks, n)} がある（上書きしない。要らなければ消してから回し直す）:\n${readFileSync(join(hooks, n), 'utf8')}`);
  fail(`違う中身の同名のフック: ${clash.join(', ')}`);
}
mkdirSync(hooks, { recursive: true });
for (const n of names) {
  const p = join(hooks, n);
  if (existsSync(p)) console.log(`変化なし: ${p}`);
  else { writeFileSync(p, relay(n)); console.log(`書いた: ${p}`); }
  chmodSync(p, 0o755);
}
console.log('Result: PASS');
