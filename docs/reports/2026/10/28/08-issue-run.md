# Issue の無人実行のまとめ（20261028-191416）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261028-191416/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #37 Node 版の指示文の雛形 prompt.md の「確かめ方」から決め打ちの「（vitest）」を外す（#35 の未採用の改善） | PASS | 2 | 2026-10-28 19:14〜19:16 | 1 | 1 |  |
| #38 キット自身のコミットのフック: scripts/git-hooks/ の本体 4 つと試験を作る（設計書 commit-message-hooks-design.md 4.1〜4.3・6 章） | PASS | 7 | 2026-10-28 19:16〜19:23 | 1 | 1 | Bash |

## #37 Node 版の指示文の雛形 prompt.md の「確かめ方」から決め打ちの「（vitest）」を外す（#35 の未採用の改善） — PASS

- `1caac7e fix: Node 版の指示文の雛形の「確かめ方」から決め打ちの「（vitest）」を外す（Issue #37）`

### 結果: 合格

| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| Node 版の雛形に「（vitest）」が残っていない | 合格 | `grep -n vitest editions/node/files/.claude/issue-run/prompt.md` で 0 件（判定役が確かめた） |
| 「確かめは」の行がテストの入口・`--filter`・`Result:` を書いたまま | 合格 | 47 行目「- 確かめは `node scripts/test.mjs` で。`--filter <名前>` で…最後の `Result:` 行で読む。」（判定役） |
| 雛形に `{{WORKSPACE_STATE}}` が残っている | 合格 | 8 行目「- 作業場所: {{WORKSPACE_STATE}}」（判定役） |
| 脚本・試験・Unity 版・共有の部品を変えない | 合格 | `git show 1caac7e` で変わったのは雛形の 1 行だけ（判定役） |
| キットの試験が全部通る | 合格 | `node scripts/test.mjs` → `Result: PASS 55/55`（skipped 1・cancelled 0。実装者が回した） |

### やったこと
- `editions/node/files/.claude/issue-run/prompt.md` 47 行目の「`node scripts/test.mjs`（vitest）で。」を「`node scripts/test.mjs` で。」にした。ほかの行は変えていない。
- キットの試験を全部回した（PASS 55/55）。判定は別のエージェントが差分と雛形を読んで行った（条件 1〜4 合格。5 は実装者のログで判定）。

### コミット
- 1caac7e fix: Node 版の指示文の雛形の「確かめ方」から決め打ちの「（vitest）」を外す（Issue #37）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- Issue の「先に決めておくこと」のとおり、「（vitest）」を消すだけにした（戻すなら `git revert 1caac7e`）。

### やらなかったこと・断られた操作
- 直下への入れ直し（`install.mjs --target . --update`）はしていない（Issue の指示どおり。統合のセッションで人が行う）。
- 開始時からあった `.issue-kit/version` の変更には触れていない（コミットにも入れていない）。
- 断られた操作は無い。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- 無人の回の指示文（直下の `.claude/issue-run/prompt.md` から作られたもの）にはまだ「（vitest）」が残っている。入れ直せば直る。


## #38 キット自身のコミットのフック: scripts/git-hooks/ の本体 4 つと試験を作る（設計書 commit-message-hooks-design.md 4.1〜4.3・6 章） — PASS

- `82c3073 feat: キット自身のコミットを検査するフックの本体と試験`

### 結果: 合格

| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| `scripts/git-hooks/` に `lib.mjs`・`commit-msg.mjs`・`pre-commit.mjs`・`install.mjs` があり、`tests/git-hooks.test.mjs` がある | OK | コミット 82c3073 がこの 5 ファイルだけを足した（`git show 82c3073`） |
| `lib.mjs` が `checkMessage`・`checkStaged` を出す。3 章の形は外れ 0、本文・確かめ・感想の無いメッセージは外れがある | OK | 試験 `フック: 3 章の例そのままは通る` ✔。`fix: 直した\n\nCo-Authored-By…` は M4・M5 になる（判定役がソースで確かめた） |
| `install.mjs` が中継に実行の権限を付ける | OK | `chmodSync(p, 0o755)`（2 本とも。中身が同じときも付ける） |
| 6 章の試験 27 本があって通る | OK | `node scripts/test.mjs --file tests/git-hooks.test.mjs` → `Result: PASS 28/28`。27 本の名前は全部 ✔。`中継に実行の権限が付く` は Windows なので飛ばした。`node が見つからなければ止める` は試験にして ✔ |
| このリポジトリの `.git/hooks/` に中継をまだ入れていない | OK | `ls .git/hooks` → `*.sample` だけ |
| `editions/`・`shared/`・`scripts/issue-run/`・`docs/guides/`・`docs/design/` といまある試験のファイルを変えない | OK | 差分は新しい 5 ファイルだけ。`git status --short` は `M .issue-kit/version` だけ（この回の前から変わっていたもの。触っていない） |
| キットの試験が全部通る | OK | `node scripts/test.mjs` → `Result: PASS 83/83`（skipped 2・EXIT=0） |

判定は別のエージェントがした（ログと差分とソースを読み、確認コマンドは回していない）。結果は全部 OK・欠陥なし。

### やったこと

- `scripts/git-hooks/lib.mjs`：`checkMessage`（読む前の整え方、例外、M1〜M5。外れは `M2: 説明が 41 字（40 字まで）` の形）・`checkStaged`（P1〜P3）・ひな形 `TEMPLATE`
- `commit-msg.mjs`：外れた項目とひな形を標準エラーに出し、終了コード 1
- `pre-commit.mjs`：`--no-renames` の A・AM・ACM、`check-ignore --no-index --stdin -z`（0 か 1 なら正常）、`cat-file -s :<パス>`。環境変数はそのまま子の git に渡す
- `install.mjs`：`--git-common-dir` の `hooks/` に、設計書 4.3 の中継を LF で書いて `0o755` を付ける。同じ中身なら「変化なし」。違う中身の同名があれば、1 本も書かずに中身を出して `Result: FAIL`
- `tests/git-hooks.test.mjs`：6 章の 27 本と `フック: node が見つからなければ止める`。使い捨てのリポジトリは `mkdtemp` で作り、子の PATH の頭に `dirname(process.execPath)` を足した

### コミット

- 82c3073 `feat: キット自身のコミットを検査するフックの本体と試験`（このメッセージも `checkMessage` で外れ 0）

### 選んだこと（自分で決めた点・違っていたときの戻し方）

- `フック: node が見つからなければ止める` は**試験にした**。入れた中継を写し、`for c in …` の行だけ無い場所（`/no-such-dir/node`）に差し替えて、Git for Windows の `sh`（Mac・Linux は `/bin/sh`）で回す。PATH は sh のフォルダーだけ、`PROGRAMFILES` は空にする。終了コード 1 と「node が見つからない」を見る。中継には試験用の環境変数を足していない（設計書 4.3 の中身のまま）。sh が無ければ飛ばす。設計書 6 章には、main のセッションがこの方法を書き足す。違っていたら、その試験を消して手で確かめた記録に替える
- M4 の「本文」を数えるとき、末尾の行（`Co-Authored-By:` など）も本文に入れない。止める側に倒した選び方で、Issue の「本文の無いメッセージ」の例もこれで外れる。違っていたら `lib.mjs` の M4 の行から `!TRAILER.test(l)` を外す
- `checkStaged` の入力の形：`added`・`changed` は配列、`ignored` は check-ignore に当たったパスの配列（`added` にあるものだけを P1 にする）、`sizes` は `{ パス: バイト数 }`。戻り値は `{ errors, warnings }`

### やらなかったこと・断られた操作

- このリポジトリの `.git/hooks/` に中継を入れること・CLAUDE.md の文・設計書への書き足し（Issue のとおり、main のセッションの仕事）
- `.issue-kit/version` はこの回の前から変わっていた。触らず、コミットにも入れていない
- 断られた操作：`git config --get core.hooksPath` などを 1 つにまとめたコマンドが断られた（読むだけのもの）。分けて回し直して足りた
- `.issue-run/` に試験のログ（`full-test.log`・`hooks-test.log`・`diff-82c3073.txt`）を置いた。追跡の外なので消していない

### 未採用の改善（気づいたがブロッカーでないもの。直さない）

- 設計書 4.1 の M4 には「末尾の行を本文に数えない」ことが書いていない。main で設計書に書き足すときに、一緒に書くとよい

