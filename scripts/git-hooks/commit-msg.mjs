#!/usr/bin/env node
// commit-msg.mjs — git の commit-msg フックの本体（中継の .git/hooks/commit-msg から呼ばれる）。
//   node scripts/git-hooks/commit-msg.mjs <メッセージのファイル>
// メッセージを読んで lib.mjs の checkMessage を呼び、外れた項目とひな形を標準エラーに出す。外れがあれば終了コード 1。
import { readFileSync } from 'node:fs';
import { checkMessage, TEMPLATE } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('commit-msg: メッセージのファイルが渡されていない'); process.exit(1); }
const bad = checkMessage(readFileSync(file, 'utf8'));
if (bad.length) {
  console.error('commit-msg: コミットメッセージが決まりの形でない（scripts/git-hooks/lib.mjs）');
  for (const b of bad) console.error(`  ${b}`);
  console.error(`\nひな形:\n${TEMPLATE}`);
  process.exit(1);
}
