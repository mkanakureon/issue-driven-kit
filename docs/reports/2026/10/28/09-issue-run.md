# Issue の無人実行のまとめ（20261028-202246）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261028-202246/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #39 仕様 1.1 の claude-working を外す段落の「札」を claude-working と名指しする（1 章の札＝claude-run と読み分ける。#34 の未採用の改善） | PASS | 3 | 2026-10-28 20:23〜20:26 | 1 | 1 |  |
| #40 手順書 4.4: check の文言（文字列）の中に書いたパスも守るファイルになることを足す（#35 の下書きでのつまずき） | PASS | 3 | 2026-10-28 20:26〜20:29 | 1 | 1 |  |

## #39 仕様 1.1 の claude-working を外す段落の「札」を claude-working と名指しする（1 章の札＝claude-run と読み分ける。#34 の未採用の改善） — PASS

- `91fab22 docs: 仕様 1.1 の段落の「札」を名指しにする`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 1.1 の `claude-working` を外す段落に「札」が無く `claude-working` と名指し | 合格 | `grep -n 札 shared/spec/issue-run-spec.md` → 22・27 行目（1 章の表）だけ。38 行目に `claude-working` が 5 か所 |
| 段落の中身（1 件以上・0 件・--issue・1.2）は残す | 合格 | `git show 91fab22` の差分は 38 行目の語の言い換えだけ。4 つの語は残っている |
| 1 章の表の「札」の行は変えない | 合格 | 差分は 38 行目の 1 行だけ。22 行目 `\| 札 \| …` はそのまま |
| 仕様のほかを変えない | 合格 | `git show --stat 91fab22` → `shared/spec/issue-run-spec.md` だけ。`git status --short` は空 |
| キットの試験が全部通る | 合格 | `node scripts/test.mjs` → `Result: PASS 83/83`（skipped 2） |

判定は別のエージェントが差分とログを読んで行った（5 件とも合格）。

### やったこと
- `shared/spec/issue-run-spec.md` 38 行目の「札」を言い換えた。`claude-working` を指す 5 か所は `claude-working` にし、「`--issue` は札を見ずに」は `claude-run` にした。文の組み立ては変えていない。

### コミット
- 91fab22 docs: 仕様 1.1 の段落の「札」を名指しにする

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 「`--issue` は札を見ずに」の「札」は 1 章の「札」（claude-run の対象。27 行目の「札を見ない」と同じ）を指すので、`claude-working` ではなく `claude-run` にした。段落に「札」を残すと条件 1 に当たらないため。違っていたら 38 行目のその語だけ直す。

### やらなかったこと・断られた操作
- なし

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `--issue` は `claude-run` だけでなく除外のラベル・開いているかも見ない（`lib.mjs` の `skip` が既定で空）。38 行目の「`claude-run` を見ずに」と 27 行目の「札を見ない」は、それより少し狭く書いている。


## #40 手順書 4.4: check の文言（文字列）の中に書いたパスも守るファイルになることを足す（#35 の下書きでのつまずき） — PASS

- `819538c docs: 手順書 4.4 に check の文言のパスも守られることを足す`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 手順書 4.4 の「直させるファイルは変数を通して指す」の行に、`check` の文言（文字列）の中のパスも守るファイルになると書いてある | 合格 | 138 行目に「`check(…, '…')` の文言（文字列）の中に書いたパスも同じで、守るファイルになる（文言には名前だけを書くか、パスを書かない）。」を足した（別のエージェントが差分で確かめた） |
| 同じ行の「注釈の中に書いたパスも守るファイルになる」が残っている | 合格 | 同じ行に残っている。足したのは 1 文だけ（単語単位の差分で確かめた） |
| 直下の手順書が Node 版の写しと同じ | 合格 | `node editions/node/install.mjs --target . --update` → `update docs/guides/procedures/issue-goal-setting.md`・`Result: PASS`。`cmp` で 2 つのファイルが同じ |
| Unity 版・`scripts/`・`tests/`・`shared/` を変えない | 合格 | コミット 819538c で変わったのは 3 つだけ（2 つの手順書と `.issue-kit/version`）。`git status --short` は空 |
| キットの試験が全部通る | 合格 | `node scripts/test.mjs` → tests 85・pass 83・fail 0・skipped 2・`Result: PASS 83/83` |

### やったこと
- `editions/node/files/docs/guides/procedures/issue-goal-setting.md` の 4.4（138 行目）に 1 文を足した。
- `install.mjs --update` で直下の `docs/guides/procedures/` へ入れ直した（`.issue-kit/version` も変わった）。
- 試験を全部回し、別のエージェントに差分を読ませて判定させた（全部の条件が合格）。

### コミット
- 819538c docs: 手順書 4.4 に check の文言のパスも守られることを足す

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 足す文は Issue の「先に決めておくこと」の例文をそのまま使った（違っていたら 819538c の 1 文を直す）。

### やらなかったこと・断られた操作
- 断られた操作は無い。最初のコミットはフックに止められた（感想の行を `#35` で始めたので、git が注釈として捨てた）。行の頭を「Issue #35」にして直した。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- コミットのひな形に「行を `#` で始めると git が注釈として捨てる」と添えておけば、同じつまずきを防げる（`scripts/git-hooks/lib.mjs` の TEMPLATE）。

