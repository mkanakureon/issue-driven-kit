# Issue の無人実行のまとめ（20261026-223745）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261026-223745/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #14 基本設計の「導入ガイドの手順 3」を手順 4 に直す（vitest の追加・テストのアセンブリは手順 4）・Node 版 issue-driven-development.md 6.2 の 4 に Windows のトークンの置き場所と `!` の注意を足す（#11・#13 の未採用の改善） | PASS | 2 | 2026-10-26 22:38〜22:40 | 1 | 2 |  |
| #15 入れる脚本: dirty を測るとき、キットの .issue-kit/version の差を数えない（キット自身に 2 回入れ直すと、前の回の版のファイルだけで true になる）（Node 版・Unity 版） | PASS | 5 | 2026-10-26 22:40〜22:45 | 1 | 1 | Bash |

## #14 基本設計の「導入ガイドの手順 3」を手順 4 に直す（vitest の追加・テストのアセンブリは手順 4）・Node 版 issue-driven-development.md 6.2 の 4 に Windows のトークンの置き場所と `!` の注意を足す（#11・#13 の未採用の改善） — PASS

- `7dd3838 chore: Issue #14 の写しを入れ直した版を .issue-kit/version に記録`
- `5bef267 docs: 基本設計の「導入ガイドの手順 3」を手順 4 に直し、Node 版 issue-driven-development.md 6.2 の 4 に Windows のトークンの置き場所と `!` の注意を足す（Issue #14）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 基本設計に「導入ガイドの手順 3」が残らず、3.4 の見出し・3.4 の vitest の段落・4.2 のテストのアセンブリの段落が手順 4 | 合格 | `grep -n 導入ガイドの手順 docs/design/issue-driven-kit-basic-design.md` → 120・129・152 行がすべて「手順 4」で、「手順 3」は 0 件 |
| `install.mjs` の頭書きは「手順 4」のまま | 合格 | `git diff 0b5ea22..HEAD` に `editions/node/install.mjs` が無い。7 行目は「導入ガイドの手順 4」 |
| Node 版 6.2 の 4 に Windows のユーザーの環境変数・`!`/TTY の注意があり、zprofile・外のターミナル・貼らない、も残っている | 合格 | 98 行に「Windows はユーザーの環境変数、Mac は `~/.zprofile` に `export`」と「`!` を付けて…端末（TTY）が無く…止まる」がある。`issue-run.md` 準備 3 と同じ言い方 |
| 直下と Node 版が同じ中身 | 合格 | `node editions/node/install.mjs --target . --update` → `Result: PASS`。判定役の `git hash-object` は両方とも f2f28867… |
| キット自身の試験が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 47/47` |
| Unity 版・脚本・tests・package.json を変えない | 合格 | 差分は 4 ファイル（基本設計・issue-driven-development.md の 2 つ・.issue-kit/version）だけ。`git status --short` は空 |

判定は別のエージェントが差分とログを読んで行い、6 項目とも合格でした。

### やったこと
- 基本設計の「導入ガイドの手順 3」3 か所（3.4 の見出し・3.4 の vitest の段落・4.2 のテストのアセンブリの段落）を「手順 4」に直した。
- `editions/node/files/docs/guides/working/issue-driven-development.md` の 6.2 の 4 に、`issue-run.md` 準備 3 と同じ言い方で、Windows のユーザーの環境変数と `!` の注意を足した。
- `node editions/node/install.mjs --target . --update` で直下の写しを入れ直した。

### コミット
- 5bef267 docs: 基本設計の「導入ガイドの手順 3」を手順 4 に直し、Node 版 issue-driven-development.md 6.2 の 4 に Windows のトークンの置き場所と `!` の注意を足す（Issue #14）
- 7dd3838 chore: Issue #14 の写しを入れ直した版を .issue-kit/version に記録

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- `!` の注意は 6.2 の 4 の終わり（「→ 新しい窓。」の後ろ）に置いた。準備 3 と並びをそろえたいなら、98 行の文の順を入れ替えるだけで戻せる。

### やらなかったこと・断られた操作
- なし（push・Issue への書き込みはしていない）

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `.issue-kit/version` は、入れ直しのときの作業ツリーに `.issue-kit/version` 自身の変更があるため「未コミットの変更あり」と記録される（これまでの回と同じ動き）。


## #15 入れる脚本: dirty を測るとき、キットの .issue-kit/version の差を数えない（キット自身に 2 回入れ直すと、前の回の版のファイルだけで true になる）（Node 版・Unity 版） — PASS

- `f5cecf0 fix: 入れる脚本の dirty で、キットの .issue-kit/version の差を数えない（Node 版・Unity 版。基本設計 3.4・導入ガイドにも書く）（Issue #15）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 2 つの脚本とも dirty の `git status --porcelain` で `.issue-kit/version` を数えない | 満たす | `editions/node/install.mjs`・`editions/unity/install.ps1` に `-- . ':(exclude).issue-kit/version'` を足した（コミット f5cecf0）。別のエージェントが差分を見て判定 |
| 基本設計 3.4 の dirty の段落に書いてある | 満たす | 確認コマンドと同じ正規表現を 3.4 の節だけに当てて `true` になった |
| 導入ガイドの `.issue-kit/version` の説明に書いてある | 満たす | 同じ正規表現をガイドに当てて `true`（「キットの版を上げる」の段とフォルダーの図） |
| 3 本の試験があって通る | 満たす | `node scripts/test.mjs --filter dirty` → 6 本とも ✔・`Result: PASS 5/5`。Unity 版は pwsh で回った（skip なし） |
| キット自身の試験が通る | 満たす | `node scripts/test.mjs` → `tests 50 / pass 49 / fail 0 / skipped 1`（ネットの要る見本の試験。前からある skip）・`Result: PASS 49/49` |
| 守る所を変えない | 満たす | `git diff --stat HEAD~1 HEAD` で変わったのは 6 ファイル（設計書・2 つの脚本・ガイド・2 つの試験）だけ |

### やったこと
- 2 つの脚本の dirty を測る `git status --porcelain` に、git のパスの指定で `.issue-kit/version` を外す指定を足した（いつも外す。分岐はなし）。
- 試験を 2 本足した: `tests/node.test.mjs`（Node 版）と `tests/kit.test.mjs`（Unity 版。`hasPwsh` が無ければ skip）。どちらも、2 回目に入れ直す前に `git status --porcelain` が `M .issue-kit/version` だけであることを assert で確かめてから、`dirty === false` を確かめる。
- 基本設計 3.4 と導入ガイド（説明の段・フォルダーの図）に、同じ段落の 1 文として書いた。
- 合否は別のエージェントが判定した。差分と試験のログを読ませ、6 条件すべて「満たす」だった。

### コミット
- f5cecf0 fix: 入れる脚本の dirty で、キットの .issue-kit/version の差を数えない（Node 版・Unity 版。基本設計 3.4・導入ガイドにも書く）（Issue #15）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 導入ガイドのフォルダーの図の `dirty` の行にも同じ断りを足した（説明の段だけでよければ、その行を元に戻す）。

### やらなかったこと・断られた操作
- 直す前の脚本で新しい試験が落ちることを `git stash` で確かめようとしたが、断られた。代わりに、試験の手順（版のファイルの差だけがあることを assert で確かめる）から、直す前なら落ちることを判定役に読ませて確かめた。
- キット直下の `.issue-kit/version` は書き直していない（Issue の「やらないこと」）。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- なし

