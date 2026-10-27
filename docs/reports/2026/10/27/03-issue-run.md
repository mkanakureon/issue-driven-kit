# Issue の無人実行のまとめ（20261027-134643）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261027-134643/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #20 文書の手当て: 手順書 4.4・7 章に「gitClean の base は同じ回で先に回る Issue が触るフォルダーに使わない」・導入ガイドの「実際に動いた例」に Mac の結果（#19 の未合格・#5 の未採用の改善） | PASS | 4 | 2026-10-27 13:47〜13:50 | 1 | 1 |  |
| #21 キットの試験: hasPwsh の確かめも runWithRetry を通し、pwsh が無いと判断したら 1 行残す（Unity 版の試験が黙って飛ばされない。#8 の未採用の改善） | PASS | 2 | 2026-10-27 13:50〜13:53 | 1 | 1 |  |
| #22 無人の回（Node 版）: まとめが書けなくても runs.log の 1 行と終わりの知らせは出す（終わりの片付けを lib の finishRun に出す・仕様 6.1。#8 の未採用の改善） | PASS | 5 | 2026-10-27 13:53〜13:57 | 1 | 1 |  |

## #20 文書の手当て: 手順書 4.4・7 章に「gitClean の base は同じ回で先に回る Issue が触るフォルダーに使わない」・導入ガイドの「実際に動いた例」に Mac の結果（#19 の未合格・#5 の未採用の改善） — PASS

- `6a23d35 docs: 手順書 4.4・7 章に「gitClean の base は同じ回で先に回る Issue が触るフォルダーに使わない」を足し、導入ガイドの「実際に動いた例」に Mac の rpg-online-cloudflare の結果を入れる（Issue #20）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 手順書の 4 章に base と「同じ回」の両方がある行 | 合格 | 4.4 に箇条書きを 1 つ足した（Issue の推しの文のまま）。確認コマンドの該当部分だけを回して `ch4 true` |
| 7 章に base と「同じ回」の両方があるチェックの行 | 合格 | 7 章の `--dry-run` の行の前に `- [ ]` を足した。`ch7 true` |
| 直下の写しが同じ中身 | 合格 | `node editions/node/install.mjs --target . --update` → `update docs/guides/procedures/issue-goal-setting.md`・`Result: PASS`。`src === copy` が true |
| 導入ガイドの「実際に動いた例」の行 | 合格 | 「これから」が無い・`rpg-online-cloudflare`・`Mac`・`4 件` が全部ある（true [true,true,true]） |
| `npm test` が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 50/50` |
| scripts/・tests/・editions/unity/・shared/spec/・shared/claude-md/・package.json を変えない | 合格 | `git diff 2b86771..HEAD --stat` は 4 ファイル（.issue-kit/version・手順書 2 つ・導入ガイド）だけ。`git status` は空 |

判定は別のエージェントにさせた（ログと差分を読ませ、確認コマンドは回させていない）。6 件とも PASS。

### やったこと
- `editions/node/files/docs/guides/procedures/issue-goal-setting.md` の 4.4 と 7 章に、`gitClean` の `base` の注意を足した
- `shared/manuals/issue-driven-kit-install-guide.md` の「実際に動いた例」の Node 版の欄を、Mac での結果に直した
- 入れる脚本で直下へ写した（`.issue-kit/version` も変わった）

### コミット
- 6a23d35 docs: 手順書 4.4・7 章に「gitClean の base は同じ回で先に回る Issue が触るフォルダーに使わない」を足し、導入ガイドの「実際に動いた例」に Mac の rpg-online-cloudflare の結果を入れる（Issue #20）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 文は Issue の「先に決めておくこと」の推しをそのまま使った。4.4 では「作業で直す必要のあるファイルを『守る』に入れない」の前に、7 章では `--dry-run` の行の前に置いた。違っていたら 6a23d35 を revert する

### やらなかったこと・断られた操作
- なし（断られた操作は無い）

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `.issue-kit/version` の `dirty` が true のまま（写したのはコミットの前なので）。コミットのあとにもう一度 `--update` すれば消える
- 4.4 の注意は、`base` を外したときの短所（その Issue が自分でコミットした変更が見えなくなる）を書いていない


## #21 キットの試験: hasPwsh の確かめも runWithRetry を通し、pwsh が無いと判断したら 1 行残す（Unity 版の試験が黙って飛ばされない。#8 の未採用の改善） — PASS

- `220e065 test: tests/kit.test.mjs の hasPwsh の確かめも runWithRetry を通し、Windows で pwsh が無いと判断したら 1 行残す（Issue #21）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| `hasPwsh` の確かめが `runWithRetry` を通す | 合格 | `tests/kit.test.mjs:22` は `const hasPwsh = process.platform === 'win32' && runWithRetry(() => spawnSync('pwsh', …)).status === 0;` |
| Windows で偽なら「pwsh が無いので Unity 版の試験を飛ばす」の 1 行を残す | 合格 | `tests/kit.test.mjs:23` は `if (process.platform === 'win32' && !hasPwsh) console.error('pwsh が無いので Unity 版の試験を飛ばす（…）')` |
| Unity 版の試験が飛ばされずに通る（requireTests の 4 本が PASS・飛ばしは 1 本以下） | 合格 | `node scripts/test.mjs` を回した後の junit.xml で、4 本とも skipped も failure も無い。`<skipped` は 1 本だけ（K-4。KIT_UNITY_REFERENCE が要る） |
| キット自身の試験が通る | 合格 | `node scripts/test.mjs` → tests 51・pass 50・fail 0・skipped 1、`Result: PASS 50/50` |
| editions/・scripts/・shared/・docs/・package.json を変えない | 合格 | `git show 220e065 --stat` に出るのは `tests/kit.test.mjs` だけ。`git status` に未コミットの変更なし |

判定は別のエージェントがした（差分と junit.xml を読んだだけ。確認コマンドは回していない）。結果は全部 OK。

### やったこと
- `tests/kit.test.mjs` の `hasPwsh` を、`runWithRetry` を通して pwsh を起動する形にした（Issue の推しの形どおり）。`runWithRetry` で作る `pwsh` の定義の後へ移した。
- Windows で `hasPwsh` が偽のときに、`pwsh が無いので Unity 版の試験を飛ばす（…）` を console.error で 1 行残すようにした。Windows でないときは、いまどおり黙って飛ばす。

### コミット
- 220e065 test: tests/kit.test.mjs の hasPwsh の確かめも runWithRetry を通し、Windows で pwsh が無いと判断したら 1 行残す（Issue #21）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 1 行の中身に、何で確かめたか（`pwsh -NoProfile -Command "exit 0"` が 0 で終わらない）を入れた。違っていたら、220e065 の 23 行目の括弧の中を直す。

### やらなかったこと・断られた操作
- なし（push はしていない。Issue への書き込みはスクリプトがする）

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- なし


## #22 無人の回（Node 版）: まとめが書けなくても runs.log の 1 行と終わりの知らせは出す（終わりの片付けを lib の finishRun に出す・仕様 6.1。#8 の未採用の改善） — PASS

- `7985578 fix: 無人の回（Node 版）の終わりの片付けを lib の finishRun に出し、まとめが書けなくても runs.log の 1 行（まとめは -）と知らせを出す。仕様 6.1・手引きに決まりを書く（Issue #22）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| lib.mjs が finishRun（4 つの関数）を出し、まとめが投げても runs.log（`-`）と知らせを呼び、「まとめを書けなかった」の 1 行を出す | 満たす | `editions/node/files/scripts/issue-run/lib.mjs` の `export function finishRun({ writeSummary, appendRunsLog, notify, log })`。試験で呼ばれた順 `['summary','runs.log -','notify']` と窓の行 `まとめを書けなかった: ENOSPC: …` を確かめた |
| 2 本の試験があって通る | 満たす | `node scripts/test.mjs --filter '終わりの片付け'` → 2 本とも ✔、`Result: PASS 2/2` |
| issue-run.mjs の finally が finishRun を使う | 満たす | 最後の `} finally {` の中に `L.finishRun({`（試験でも確かめる） |
| 直下の写しが同じ中身 | 満たす | `node editions/node/install.mjs --target . --update` → `Result: PASS`。判定役の `git diff --no-index` で差は無かった |
| 仕様 6.1 に「まとめを書けなかった」の決まり | 満たす | `shared/spec/issue-run-spec.md` 6.1 の表の行と表の下の 1 文 |
| npm test が通る | 満たす | `node scripts/test.mjs` → `Result: PASS 52/52`（1 本は飛ばした） |
| Unity 版・shared/claude-md・shared/manuals・package.json を変えない | 満たす | `git diff 220e065 HEAD --stat` に出てこない |

判定は別のエージェントが、試験のログと差分を読んで行った（全部「満たす」）。

### やったこと
- `lib.mjs` に `finishRun` を足した（まとめ → runs.log → 知らせ。まとめが書けなければパスは `-` にし、窓に 1 行出す。runs.log に足せなくても知らせは出す）
- `issue-run.mjs` の `finally` を `finishRun` に通した。終了コードは前のまま（`aborted ? 1 : 0`）
- 仕様 6.1 と手引き `docs/guides/working/issue-run.md` の runs.log の説明に「まとめを書けなかった回は `-`」を足した
- `tests/node.test.mjs` に 2 本の試験を足した（偽の関数で書いた）
- 直下へ写し直した（`.issue-kit/version` も更新した）

### コミット
- 7985578 fix: 無人の回（Node 版）の終わりの片付けを lib の finishRun に出す…（Issue #22）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 手引き `docs/guides/working/issue-run.md` の「0 件なら `-`」も同じ決まりに合わせて直した（作る物の説明なので範囲の中とした）。要らなければ、その 1 行を戻して写し直す
- `finishRun` はまとめの相対パス（書けなければ `-`）を返すようにした。使わないので、戻すならその return を消すだけでよい

### やらなかったこと・断られた操作
- 断られた操作は無い。push・Issue への書き込みはしていない

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `finishRun` の中では `notify()` を try で囲んでいない。`finishNotice` は純粋な関数で、osascript には前から try があるので、投げる余地は小さい

