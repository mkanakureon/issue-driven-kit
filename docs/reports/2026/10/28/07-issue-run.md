# Issue の無人実行のまとめ（20261028-162803）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261028-162803/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #34 仕様の書き込みの権限の書き方を今の動きと GitHub の値に合わせる: --issue でも権限を確かめて札が残る・permission の値に maintain は無い（#33・#2 の未採用の改善） | PASS | 2 | 2026-10-28 16:28〜16:30 | 1 | 1 |  |
| #35 無人の回（Node 版）: 指示文の確かめの行を issueKit.testRunner に合わせる（いまは決め打ちで「（vitest）」。#2 の未採用の改善） | PASS | 6 | 2026-10-28 16:30〜16:37 | 1 | 2 |  |
| #36 導入ガイド 1.3 の「確かめ方（両方）」に Unity 版の点検 issue-run-doctor.ps1 を並べる（#32 の未採用の改善） | PASS | 2 | 2026-10-28 16:37〜16:39 | 1 | 1 |  |

## #34 仕様の書き込みの権限の書き方を今の動きと GitHub の値に合わせる: --issue でも権限を確かめて札が残る・permission の値に maintain は無い（#33・#2 の未採用の改善） — PASS

- `83e8361 docs: 仕様 1.1 に --issue でも権限を確かめて札が残ることを、1.2 に permission の値は admin・write・read・none だけで Maintain は write・Triage は read と返ることを書く（Issue #34）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 1.1 の `claude-working` を外す文に、`--issue` でも 1.2 の権限を確かめ、権限が無いと対象 0 件で札が残ると書く | 合格 | Issue の check 2 本だけを仕様に当てて true・true。脚本の `targetIssues()`（`ONE_ISSUE` でも `selectTargets` に `canWrite` を渡す）と、対象 0 件で札を外す前に止まることを判定役が確かめた |
| 1.2 の「書き込みの権限」の行が値として `write`・`admin` を書き、`maintain` を書かない。Maintain は `write`・Triage は `read`・`role_name` を書く | 合格 | check 2 本を当てて true・true |
| 1 章の表の「札」の行に `` `maintain` `` が無い | 合格 | check を当てて true |
| 脚本・試験・見本・説明書を変えない | 合格 | `git show --stat 83e8361` で変わったのは `shared/spec/issue-run-spec.md` だけ。作業ツリーはきれい |
| キットの試験が全部通る | 合格 | `node scripts/test.mjs` → `Result: PASS 53/53` |

判定役（別のエージェント）の見立ても全部合格。新しい文の事実の誤りも無い。

### やったこと
- `shared/spec/issue-run-spec.md` を次のとおり直した。
  - 1 章の「札」の行から、権限の値の並びを外した。権限の中身は 1.2 にだけ書く。
  - 1.1 に「`--issue` の起動でも 1.2 の書き込みの権限は確かめるので、作った人に権限が無いと対象 0 件になり、札は外れずに残る」を足した。
  - 1.2 の行を「`write` か `admin`」にした。値は `admin`・`write`・`read`・`none` だけで、Maintain は `write`、Triage は `read` として返る（ロールの名前は `role_name` の欄）ことも書いた。

### コミット
- 83e8361 docs: 仕様 1.1・1.2 の権限の書き方を直す（Issue #34）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 「札」の行は値を並べ直さずに、1.2 を指すだけにした。契約を 1 か所に置くため（CLAUDE.md 原則5）。違っていたら `git revert 83e8361` で戻す。

### やらなかったこと・断られた操作
- 確認コマンドを丸ごと回すことはしていない（指示どおり）。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- 仕様の「札」が、1 章の表では `claude-run`、1.1 の段落では `claude-working` を指していて、意味が二通りある。
- `lib.mjs` の `WRITE_PERMISSIONS` に、返ってこない値の `'maintain'` が残っている。Issue で変えないと決めてある。


## #35 無人の回（Node 版）: 指示文の確かめの行を issueKit.testRunner に合わせる（いまは決め打ちで「（vitest）」。#2 の未採用の改善） — PASS

- `a6fb86a fix: 無人の回（Node 版）の確かめの行で、package.json が読めないときも vitest として扱う（Issue #35）`
- `f5fec37 fix: 無人の回（Node 版）の指示文の確かめの行を package.json の issueKit.testRunner に合わせる（node なら node --test・無いか vitest なら vitest。Issue #35）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| Node 版 `issue-run.mjs` に決め打ちの「node scripts/test.mjs（vitest）」が残っていない | 合格 | `grep -c "test.mjs（vitest）" editions/node/files/scripts/issue-run/issue-run.mjs` → 0 |
| 試験 `指示文の確かめの行: testRunner が node なら node --test と書く`・`…無いか vitest なら vitest と書く` があって通る | 合格 | `node scripts/test.mjs --filter '指示文の確かめの行'` → `Result: PASS 2/2`。全体の実行でも両方 ✔ |
| 直下の `scripts/issue-run/issue-run.mjs`・`lib.mjs` が Node 版の写しと同じ | 合格 | `node editions/node/install.mjs --target . --update` で入れ直した → `cmp` で両方同じ |
| Unity 版と見本を変えない | 合格 | `git diff --stat 83e8361 HEAD -- editions/unity/files shared/fixtures` → 差なし |
| キットの試験が全部通る | 合格 | `node scripts/test.mjs` → `Result: PASS 55/55`（a6fb86a の後に回した） |

判定は別のエージェントに頼んだ。差分（f5fec37）と全体のテストのログを読ませて、5 つの条件全部と「先に決めておくこと」が合格。そこで指摘された「package.json が読めないときに例外になる」点は a6fb86a で直し、テストを回し直した。

### やったこと
- `lib.mjs` に、ふつうの関数を 2 つ足した。`testRunnerOf(pkgText)` は package.json の文字列から issueKit.testRunner を返す（無い・null・JSON として読めないときは vitest）。`workspaceStateText(testRunner)` は、node なら「node --test」、それ以外なら「vitest」と書いた作業場所の行を返す。
- `issue-run.mjs` の `workspaceState()` は、package.json を読んで上の 2 つを呼ぶだけにした。読むのに失敗したときも vitest として扱う。
- `tests/node.test.mjs` に、名前の決まった試験を 2 本足した。
- `install.mjs --update` で直下へ入れ直した。`.issue-kit/version` も更新される（#25 と同じ）。

### コミット
- f5fec37 fix: 無人の回（Node 版）の指示文の確かめの行を package.json の issueKit.testRunner に合わせる（Issue #35）
- a6fb86a fix: 無人の回（Node 版）の確かめの行で、package.json が読めないときも vitest として扱う（Issue #35）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- testRunner の値が node でも vitest でもない（例: jest）ときは、vitest と書くようにした。test.mjs はその値を FAIL にするが、指示文は既定に合わせた。違っていたら `workspaceStateText` の分け方を直す。
- `--dry-run` で実物の指示文を見る確かめはできなかった（いま動いている issue-run が居て、すぐ終了した）。代わりに関数の試験で確かめた。

### やらなかったこと・断られた操作
- 断られた操作はない。push・Issue への書き込みはしていない。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- 指示文の雛形 `editions/node/files/.claude/issue-run/prompt.md` の 47 行目も「`node scripts/test.mjs`（vitest）で」と決め打ちになっている。Issue の「やらないこと」（指示文のほかの文）に当たるうえ、直すと直下の `.claude/` も変わるので、手を付けなかった。
- `scripts/test.mjs` は、JSON として読めない package.json や知らない testRunner の値を FAIL にするが、指示文の行は vitest と書く。普通の使い方では差は出ない。


## #36 導入ガイド 1.3 の「確かめ方（両方）」に Unity 版の点検 issue-run-doctor.ps1 を並べる（#32 の未採用の改善） — PASS

- `afd48e9 docs: 導入ガイド 1.3 の「確かめ方（両方）」の最初の文に Unity 版の点検 issue-run-doctor.ps1 を並べる（Issue #36）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 1.3「確かめ方（両方）」の最初の文に `doctor.mjs` と `issue-run-doctor.ps1` の両方 | OK | 143 行の最初の「。」より前に `node scripts/issue-run/doctor.mjs`（Unity 版は `pwsh -NoProfile -File Scripts/issue-run-doctor.ps1`）がある（判定役が読んで確認） |
| 「新しい窓で確かめる意味があるのは Node 版の点検だけ」の文が残る | OK | 143 行にそのまま残る（判定役が確認） |
| 説明書のほか（editions/・scripts/・tests/・shared/spec/・shared/fixtures/）を変えない | OK | `git show --stat afd48e9` は `shared/manuals/issue-driven-kit-install-guide.md` の 1 行だけ。`git status --porcelain` は空 |
| キットの試験が全部通る | OK | `node scripts/test.mjs` → pass 55・fail 0・skipped 1、`Result: PASS 55/55` |

### やったこと
- `shared/manuals/issue-driven-kit-install-guide.md` 1.3 の「確かめ方（両方）」の最初の文で、`node scripts/issue-run/doctor.mjs` の後ろに括弧「（Unity 版は `pwsh -NoProfile -File Scripts/issue-run-doctor.ps1`）」を 1 つ足した（形は 5.2 の点検と同じ）。段落のほかの文は変えていない。
- 判定は別のエージェントにさせた（差分と実行結果だけを読ませ、確認コマンドは回させていない）。結果は全部 OK。

### コミット
- afd48e9 docs: 導入ガイド 1.3 の「確かめ方（両方）」の最初の文に Unity 版の点検 issue-run-doctor.ps1 を並べる（Issue #36）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 括弧の文言は Issue の「先に決めておくこと」の例どおりにした（違っていたら afd48e9 を revert）。

### やらなかったこと・断られた操作
- なし（断られた操作なし）。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- なし。

