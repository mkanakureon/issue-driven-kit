# Issue の無人実行のまとめ（20261027-155607）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261027-155607/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #23 手順書 4.4 の base の注意に、外したときの短所（自分でコミットした変更は見えない）と代わりのやり方（コミットの文の Issue # で絞る）を足す（#20 の未採用の改善） | PASS | 3 | 2026-10-27 15:56〜15:58 | 1 | 2 |  |
| #24 無人の回（Node 版）: finishRun の知らせも try で囲み、投げたら窓に 1 行出して終わる（#22 の未採用の改善） | PASS | 4 | 2026-10-27 15:59〜16:02 | 1 | 2 |  |

## #23 手順書 4.4 の base の注意に、外したときの短所（自分でコミットした変更は見えない）と代わりのやり方（コミットの文の Issue # で絞る）を足す（#20 の未採用の改善） — PASS

- `b5623ae chore: #23 の後のキットで入れ直し、.issue-kit/version の dirty を false にする（Issue #23）`
- `28f7ea2 docs: 手順書 4.4 の base の注意に、外すと自分でコミットした変更は見えないことと、コミットの文の Issue # で絞る代わりのやり方を足す（Issue #23）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 4 章に `base` と「自分でコミットした」の両方がある行 | OK | 4.4 の `gitClean` の `base` の箇条書き（editions/node/files 側 141 行）に追記。別のエージェントが 4 章を切り出して確認し、1 行が合う |
| 4 章に `--grep` と `Issue #` の両方がある行 | OK | 同じ行に `git log --grep='Issue #<番号>）' --name-only --format=`。判定役が実際に `--grep='Issue #23）'` を回し、#23 の 3 ファイルが出ることも確かめた |
| 直下の写しが editions/node/files の物と同じ | OK | `node editions/node/install.mjs --target . --update` → `Result: PASS`。CR を除いて `cmp` が SAME。判定役も BOM と CRLF をそろえて比べ、true |
| `npm test` が通る | OK | `node scripts/test.mjs` → `Result: PASS 52/52`（fail 0・skipped 1） |
| scripts/・tests/・editions/unity/・shared/・package.json を変えない | OK | `git diff b74203e HEAD --stat` に出るのは `.issue-kit/version` と手順書 2 つだけ。`git status` は空 |

### やったこと
- `editions/node/files/docs/guides/procedures/issue-goal-setting.md` の 4.4 の `base` の注意の終わりに、Issue の推しの言い回しで 2 文を足した。1 文目は、`base` を外すとその Issue が自分でコミットした変更が見えないこと。2 文目は、コミットの文の `（Issue #<番号>）` を `git log --grep` で絞る代わりのやり方。
- 入れる脚本で直下へ写した。
- 入れ直して `.issue-kit/version` の dirty を false にした。

### コミット
- 28f7ea2 docs: 手順書 4.4 の base の注意に…足す（Issue #23）
- b5623ae chore: #23 の後のキットで入れ直し、.issue-kit/version の dirty を false にする（Issue #23）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 文は Issue の推しの言い回しのまま、いまの箇条書きの最後に足した（違っていたら 28f7ea2 を revert）。
- `.issue-kit/version` の dirty を false に戻すコミットを分けた。#20〜#22 の後と同じ形にそろえた（要らなければ b5623ae を revert）。

### やらなかったこと・断られた操作
- なし（push・Issue への書き込みはしていない）

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- 足した文の「作業ツリーの未コミットの変更だけを見る」は、前の文の括弧の中と重なる。「ただし `base` を外すと、その Issue が自分でコミットした変更は見えない。」に縮められる。今回は Issue の推しの言い回しに合わせた。
- 確認コマンドの中で `git log --grep` の出力を使う見本（`spawnSync` と `check`）は無い。Issue で、この回ではやらないと決めてある。


## #24 無人の回（Node 版）: finishRun の知らせも try で囲み、投げたら窓に 1 行出して終わる（#22 の未採用の改善） — PASS

- `9e0266c chore: #24 の後のキットで入れ直し、.issue-kit/version の dirty を false にする（Issue #24）`
- `d1c44b6 fix: 無人の回（Node 版）の finishRun で知らせも try で囲み、投げたら窓に「知らせを出せなかった」の 1 行を出して終わる（Issue #24）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| `finishRun` の中で `notify()` を try で囲み、投げたら「知らせを出せなかった」で始まる 1 行を出す | 合格 | 確認コマンドの静的な部分（正規表現 `/try\s*\{\s*notify\(\)/`・語を含む）だけを `node -e` で回した → `true true` |
| 試験「終わりの片付け: 知らせが投げても、窓に 1 行出して終わる」があって通る。前からの 2 本も名前を変えずに通る | 合格 | `node scripts/test.mjs` → 3 本とも ✔ |
| 直下の写し `scripts/issue-run/lib.mjs` が `editions/node/files/` の物と同じ | 合格 | `cmp` → same。静的な比べ → `true` |
| キット自身の試験（`npm test`）が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 53/53`（飛ばしたのは pwsh の要る K-4 の 1 本） |
| `editions/unity/`・`shared/`・`package.json` を変えない | 合格 | `git diff --stat b5623ae HEAD -- editions/unity shared package.json` → 空 |

判定は別のエージェントが差分とログを読んで行い、5 つとも PASS。

### やったこと
- `editions/node/files/scripts/issue-run/lib.mjs` の `finishRun`：`notify()` を `` try { notify(); } catch (e) { log(`知らせを出せなかった: ${e?.message ?? e}`); } `` にした。まとめ・runs.log の行と同じ形。頭の注釈も直した。
- `tests/node.test.mjs`：偽の関数 `fakeFinish` に、知らせの後に呼ぶ `notify` を引数で渡せるようにした（既定は何もしない）。試験「終わりの片付け: 知らせが投げても、窓に 1 行出して終わる」を足した。
- `node editions/node/install.mjs --target . --update` で直下の `scripts/issue-run/lib.mjs` に写した。

### コミット
- d1c44b6 fix: 無人の回（Node 版）の finishRun で知らせも try で囲み、投げたら窓に「知らせを出せなかった」の 1 行を出して終わる（Issue #24）
- 9e0266c chore: #24 の後のキットで入れ直し、.issue-kit/version の dirty を false にする（Issue #24）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 新しい試験は、`fakeFinish` に第 2 引数を足す形で今の偽の関数を使い回した（前からの 2 本は中身を変えていない）。違っていれば d1c44b6 の試験の部分を戻す。
- 前の Issue と同じやり方で、コミットした後に入れ直して `.issue-kit/version` を dirty: false にした。要らなければ 9e0266c を revert する。

### やらなかったこと・断られた操作
- なし（push・Issue への書き込みはしていない）。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- 新しい試験は、偽の知らせが `calls.push('notify')` をした後に投げる。そのため確かめているのは「知らせを呼んだ」ことまでで、知らせが最後までやり終えたことは見ていない（今回の目的にはこれで足りる）。

