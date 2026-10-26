# Issue の無人実行のまとめ（20261026-213030）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261026-213030/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #10 入れる脚本: .issue-kit/version の dirty を、写す前のキットの状態で決める（キット自身に入れ直すと、写した物で必ず true になる）・dirty の意味を書く（Node 版・Unity 版） | PASS | 5 | 2026-10-26 21:30〜21:35 | 1 | 1 |  |
| #11 入れる脚本の --update: 基本設計 3.4 の「差を出して止まる」を、脚本の動き（利用先が手を入れる物は残して進む）に合わせ、最後の行に「残した N 件」を出す（Node 版・Unity 版） | PASS | 5 | 2026-10-26 21:36〜21:40 | 1 | 2 |  |
| #12 DryRun（Node 版）: 合格の条件に無人の回で deny されるパス（直下の CLAUDE.md・.claude/・docs/inspecs/）があれば知らせる・手順書に「deny のパスは合格の条件に入れず、人が直す」を書く | PASS | 5 | 2026-10-26 21:40〜21:46 | 1 | 2 |  |
| #13 Mac のシェルの設定を ~/.zprofile 1 つにそろえる（Node.js の PATH と長いトークン）・手引きの claude setup-token も「外のターミナルで・値を貼らない」に（#6 の未採用の改善） | PASS | 5 | 2026-10-26 21:46〜21:51 | 1 | 2 | Bash |

## #10 入れる脚本: .issue-kit/version の dirty を、写す前のキットの状態で決める（キット自身に入れ直すと、写した物で必ず true になる）・dirty の意味を書く（Node 版・Unity 版） — PASS

- `3303279 fix: 入れる脚本の dirty を、写す前のキットの状態で決める・dirty の意味を基本設計 3.4 と導入ガイドに書く（Issue #10）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 2 つの脚本とも `git status --porcelain`（と `git rev-parse HEAD`）を写す前に見る | 満たす | ソースの位置: Node 版 `'status', '--porcelain'`=4564 < `copyFileSync(p.from, p.to)`=4737。Unity 版 `status --porcelain`=3845 < `Copy-Item -LiteralPath $p.From -Destination $p.To`=4026。どちらも DryRun で止まる行の直後へ動かした |
| 基本設計 3.4 に dirty の意味（写す前のキットに未コミットの変更があった）が書いてある | 満たす | 3.4 の節に `dirty` と `写す前` がある（node で確かめた。true / true） |
| 導入ガイドの `.issue-kit/version` の説明に dirty の意味が書いてある | 満たす | 「キットの版を上げる」の段とフォルダーの図に足した（`/dirty/` が true） |
| 名前を指定した試験 3 本があって通る | 満たす | `node scripts/test.mjs --filter 'dirty'` → `Result: PASS 3/3`（Unity 版は Windows と pwsh 7 で回した）。直しを戻すと「キット自身に入れ直しても」の 2 本が落ちる（出力は「未コミットの変更あり」）。試験が直しの有無を見分けられることを確かめた |
| キット自身の試験（`npm test`）が通る | 満たす | `node scripts/test.mjs` → `Result: PASS 42/42`（fail 0。skip 1 本は K-4 で、環境変数 KIT_UNITY_REFERENCE が要る） |
| 写す部品・仕様・見本・直下の `scripts/`・`package.json` を変えない | 満たす | コミット 3303279 で変えたのは 6 ファイルだけ（install.mjs・install.ps1・基本設計・導入ガイド・tests 2 本）。コミットの後の `git status` はきれい |

別のエージェントが判定した: 全部の条件を満たす。不具合なし。

### やったこと
- `editions/node/install.mjs` と `editions/unity/install.ps1` で、`git rev-parse HEAD` と `git status --porcelain` を、DryRun の後・最初に写す前へ動かした。キット自身に入れるときだけの分岐は作っていない。
- 基本設計 3.4 に段落を 1 つ足した（`commit`・`dirty` は写す前に測る、`dirty` の意味、files/ の直しはコミットしてから入れ直すと `false` になる）。版のファイルに書く項目の並びにも `commit`・`dirty` を足した。
- 導入ガイドの `.issue-kit/version` の説明とフォルダーの図に、`dirty` の意味を足した。
- 試験を足した。一時フォルダーに `editions/<版>/` を写し、`git init` とコミットをして、そのキット自身に入れる形。Node 版は 2 本（`tests/node.test.mjs`）、Unity 版は 1 本（`tests/kit.test.mjs`。コミットしてから入れ直すと false・コミットせずに入れ直すと true も見る）。

### コミット
- 3303279 fix: 入れる脚本の dirty を、写す前のキットの状態で決める・dirty の意味を基本設計 3.4 と導入ガイドに書く（Issue #10）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- Unity 版の試験 1 本の中で、「未コミットの変更があれば true」も確かめた（Unity 版には別の 1 本を作らない）。違っていたら、その 4 行を別の試験へ分ける。
- 試験の一時のキットは `git add -A -f` でコミットする（files/ の中の .gitignore で部品が外れないように）。戻すときは試験の中の 1 行を直す。

### やらなかったこと・断られた操作
- 直下の `.issue-kit/version` は書き直していない（Issue の「やらないこと」）。push もしていない。
- 断られた操作は無い。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- キット自身に入れた後、写した物をコミットせずにもう一度入れ直すと、前の回の写しが残っているので `dirty: true` になる。意味どおりの動きだが、導入ガイドに 1 文あると親切。
- 新しい試験の `gitIn` は、Node 版の試験と Unity 版の試験に 1 つずつ書いてある。試験の共通の部品にまとめてもよい。


## #11 入れる脚本の --update: 基本設計 3.4 の「差を出して止まる」を、脚本の動き（利用先が手を入れる物は残して進む）に合わせ、最後の行に「残した N 件」を出す（Node 版・Unity 版） — PASS

- `c0a57c6 docs: 基本設計 3.4 の --update の行の最後の行の例を「残した N 件」にそろえる（Issue #11）`
- `f80b88d fix: --update で残した物の一覧と最後の行の「残した N 件」を両版の入れる脚本で出し、基本設計 3.4 と導入ガイドを脚本の動き（止まらず、利用先が手を入れる物は残して残りを上げる）に合わせる（Issue #11）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 基本設計 3.4 の `--update` の行に「止まる」が無く、残す・「残した N 件」・それ以外は上書きして上げる、が書いてある（旧文を置き換え） | 合格 | 旧文「差を出して止まる」を置き換えた（f80b88d・c0a57c6）。別のエージェントが確認コマンドの正規表現を行に当てて真と判定 |
| 導入ガイドの引数の表の `--update` の行に「残した N 件」 | 合格 | `| \`--update\`` の行に「残した N 件」（f80b88d）。判定役が確認 |
| 両版の脚本が、最後の行の前に残した物の一覧（キットの物と比べるよう促す 1 行つき）を出し、最後の行に「残した N 件」 | 合格 | `editions/node/install.mjs`・`editions/unity/install.ps1`。新しい 2 本の試験が、出力の末尾の並びと `Result: PASS (1 件を写した・残した 1 件…)`／`(…残した 2 件…)` を確かめて通過 |
| 試験「入れる脚本（Node 版）: --update は…残りを上げる」があって通る | 合格 | `node scripts/test.mjs --filter '入れる脚本'` → ✔・`Result: PASS 10/10` |
| 試験「入れる脚本（Unity 版）: -Update は…残りを上げる」があって通る（pwsh で） | 合格 | 同じ実行で ✔（5133ms。飛ばしていない） |
| キット自身の試験（`npm test`）が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 44/44`（飛ばしたのは 1 本で K-4。環境変数 KIT_UNITY_REFERENCE が要る） |
| `editions/*/files/`・`scripts/`・`shared/spec/`・`shared/fixtures/`・`package.json` を変えない | 合格 | `git diff HEAD~2 --stat` の 6 ファイルはどれも守るファイルの外 |

### やったこと
- 2 つの版の入れる脚本: `keep` が 1 件以上なら、最後の行の前に「利用先が手を入れる物は上書きせずに残した。キットの物（<キット>/editions/<版>/files/<パス>）と比べて、要る所を足す（Claude Code に頼める）:」と残した物の一覧を出す。最後の行に「・残した M 件」（0 件なら出さない）。頭書きの `--update` の行も同じ意味に直した。文言は 2 つの版でそろえた。
- 基本設計 3.4 の `-Update`／`--update` の行と、導入ガイドの引数の表の行を、いまの動きに書き直した。
- 試験を 2 本足した（`tests/node.test.mjs`・`tests/kit.test.mjs`）。
- 判定は別のエージェントにさせた（全部合格）。指摘された基本設計の中の N と M のずれは直した。

### コミット
- f80b88d fix: --update で残した物の一覧と最後の行の「残した N 件」を両版の入れる脚本で出し、基本設計 3.4 と導入ガイドを脚本の動きに合わせる（Issue #11）
- c0a57c6 docs: 基本設計 3.4 の --update の行の最後の行の例を「残した N 件」にそろえる（Issue #11）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 促す 1 行のキットのパスは、PC の中のパスを出さないように `<キット>/editions/<版>/files/<パス>` の文字のまま出す（Issue の書き方どおり）。実のパスを出したくなったら、2 つの脚本のこの 1 行を直す。
- 最後の行の並びは「写した → 残した → 横に置いた」にした（`--update` のときは横に置く物が無いので、2 つが並ぶことは無い）。変えるなら、2 つの脚本の `Result: PASS` の行で順番を入れ替える。

### やらなかったこと・断られた操作
- 断られた操作は無い。push・Issue への書き込みはしていない。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `editions/node/install.mjs` の頭書きは vitest の追加を「導入ガイドの手順 4」と書き、基本設計 3.4 は「手順 3」と書いていて、番号が合わない（この Issue より前からある）。
- 基本設計 3.4 の `--update` の行は、表の 1 つのセルに入れた内容が多くて読みにくい。


## #12 DryRun（Node 版）: 合格の条件に無人の回で deny されるパス（直下の CLAUDE.md・.claude/・docs/inspecs/）があれば知らせる・手順書に「deny のパスは合格の条件に入れず、人が直す」を書く — PASS

- `aaa0bae chore: Issue #12 の写しを入れ直した版を .issue-kit/version に記録`
- `3ba1712 feat: DryRun（Node 版）が合格の条件の中の deny のパス（直下の CLAUDE.md・.claude/・docs/inspecs/）を知らせる・手順書 4.4 と 7 章に「deny のパスは合格の条件に入れず、人が直す」を書く（Issue #12）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 仕様 8 章に deny のパスの知らせ・9 章の表に行（Unity 版はまだ・Node 版はする） | 合格 | `shared/spec/issue-run-spec.md` 8 章に段落、9 章に「DryRun の deny の知らせ（8 章）」の行。判定役が確認コマンドと同じ切り出しで評価して true |
| lib.mjs に `denyEditPaths`・`deniedMentions` | 合格 | 判定役が評価した結果：`denyEditPaths(設定)` は `['CLAUDE.md','.claude/**','docs/inspecs/**']`。直下の CLAUDE.md の例は `['CLAUDE.md']`、inspecs と .claude の例は 2 件、`editions/node/files/.claude/…` は 0 件 |
| DryRun が Issue ごとに 1 行知らせる（起動しない・終了コード 0） | 合格 | `issue-run.mjs` の `if (DRY_RUN)` のループに 2 行足した（設定から読んだ deny のパスで `deniedMentions` を回す）。本物の `--dry-run` は回している最中の回のロックで止まった（別の issue-run が動いている）。代わりに Issue #12 の本文を lib に通して、拾えることを確かめた |
| 直下の lib.mjs・issue-run.mjs が Node 版と同じ | 合格 | `install.mjs --target . --update` で入れ直した。`cmp` で同じ、sha256 も一致 |
| issue-goal-setting.md の 4.4 と 7 章・直下と Node 版が同じ | 合格 | 4.4 と 7 章に 1 行ずつ足した。`cmp` で同じ |
| 試験 3 本があって通る | 合格 | `node scripts/test.mjs` で 3 本とも ✔ |
| キット自身の試験が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 47/47` |
| Unity 版・`.claude/`（直下と Node 版）・docs/inspecs・package.json を変えない | 合格 | `git diff HEAD~2 --stat` にこれらは 0 件。`git status --short` は空 |

判定役（別のエージェント）は、試験のログと差分を読んで、8 つの条件をすべて合格と判定した。

### やったこと
- 仕様 8 章と 9 章に、DryRun の deny の知らせを書いた
- `lib.mjs`（Node 版）に `denyEditPaths` と `deniedMentions` を足した。`issue-run.mjs` の DryRun で、拾った語を「deny のパス」の行に出す
- 手順書の 4.4 に「deny のパスは合格の条件に入れず、人が直す」を、7 章に DryRun の知らせを見る行を書いた
- `tests/node.test.mjs` に試験を 3 本足した。直下の写しは install.mjs --update で入れ直した

### コミット
- 3ba1712 feat: DryRun（Node 版）が合格の条件の中の deny のパスを知らせる・手順書 4.4 と 7 章（Issue #12）
- （その次）chore: `.issue-kit/version` の記録

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 区切りの文字に、Issue が挙げたものに加えて `。`・`;`・`|`・`=`・括弧・かぎ括弧を入れた。戻すときは `deniedMentions` の split の正規表現を狭める
- 返すのは、拾った語そのもの（重複なし）にした。当たった deny のパスを返す形ではない。違っていたら `hits.push(p)` に変える
- 知らせの行には「無人の回では直せない。直す必要があれば人が直す。変えないことを確かめるだけなら無視してよい」と添えた

### やらなかったこと・断られた操作
- 本物の `--dry-run`：回している最中の issue-run のロックで、終了コード 3 になった。代わりに lib に本文を通して確かめた
- 追跡外の `.issue-run/tmp/`（判定役に渡したログと本文）は消していない（`.issue-run/` の下で git の外）

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `CLAUDE.md:` のように後ろに記号が付いた語や、区切りなしで日本語に挟まれた語（`直下のCLAUDE.mdを`）は拾えない。仕様の範囲内
- Unity 版の DryRun の deny の知らせ（元のリポジトリで直してから写す）


## #13 Mac のシェルの設定を ~/.zprofile 1 つにそろえる（Node.js の PATH と長いトークン）・手引きの claude setup-token も「外のターミナルで・値を貼らない」に（#6 の未採用の改善） — PASS

- `b28b040 chore: Issue #13 の写しを入れ直した版を .issue-kit/version に記録`
- `71ecc81 docs: Mac のシェルの設定を ~/.zprofile にそろえ、Node 版の手引きの claude setup-token を「外のターミナルで・値を会話に貼らない」にする（Issue #13）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| `docs/reports/` と `editions/unity/` を除いて `zshrc` が残っていない | 合格 | `git grep -n zshrc -- . ':!docs/reports' ':!editions/unity'` → 一致なし（exit=1） |
| 導入ガイド 1.3 の長いトークンの `export` の行が `~/.zprofile` | 合格 | `shared/manuals/issue-driven-kit-install-guide.md:128`「Mac は `~/.zprofile` に `export`」 |
| 導入ガイドの `~/.zprofile` の行に理由（ログインのシェル） | 合格 | 同 128 行「PATH と長いトークンは、ターミナルの新しい窓（ログインのシェル）が読む `~/.zprofile` にそろえます。」 |
| Node 版 2 本の `claude setup-token` の行に「外のターミナル」「貼らない」・`issue-run.md` 準備 3 の Mac は `~/.zprofile` | 合格 | `editions/node/files/docs/guides/working/issue-run.md:57`・`issue-driven-development.md:98`（判定役が行を読んで正規表現と照合） |
| 直下の `docs/guides/working/` の 2 本が Node 版と同じ | 合格 | `cmp` で 2 本とも同じ（`node editions/node/install.mjs --target . --update` で入れ直し） |
| キット自身の試験が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 47/47` |
| Unity 版・脚本・tests・examples・package.json・仕様・見本を変えない | 合格 | `git diff --stat aaa0bae HEAD` は `.issue-kit/version`・手引き 2 本×2・導入ガイドだけ |

判定は別のエージェントが、実行ログと差分を読んで行った（全条件 PASS）。

### やったこと
- 導入ガイド 1.3 のトークンの置き場所を `~/.zprofile` に変え、そろえる理由を 1 文足した。
- Node 版の `issue-run.md` 準備 3・`issue-driven-development.md` 6.2 の 4 の `claude setup-token` の行を「Claude Code の外のターミナルで回し、出た値は会話に貼らないで、自分で環境変数に入れる」にし、Mac は `~/.zprofile` にした。
- `install.mjs --update` で直下の写しを入れ直し、`.issue-kit/version` を記録した。

### コミット
- 71ecc81 docs: Mac のシェルの設定を ~/.zprofile にそろえ、Node 版の手引きの claude setup-token を「外のターミナルで・値を会話に貼らない」にする（Issue #13）
- b28b040 chore: Issue #13 の写しを入れ直した版を .issue-kit/version に記録

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- Node 版の手引きでは Issue の例の「Windows はもう 1 つの PowerShell」を「Windows はもう 1 つのターミナルの窓」に言い換えた。Node 版に PowerShell の語を入れられないため（基本設計 D2・試験 K-2 が落ちた）。戻すなら 71ecc81 の該当の 2 行を直す。
- そろえる理由の 1 文は手順 1.3 の `export` の行（128 行）に置いた。1.2 に置くなら、その文を 100 行へ移す。

### やらなかったこと・断られた操作
- `git checkout -- .issue-kit/version`（途中で入れ直したときの版のファイルを戻そうとした）は断られた。代わりにコミットの後で `--update` を回し直し、最新のコミットで上書きした。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- `issue-driven-development.md` 6.2 の 4 には Windows のトークンの置き場所（ユーザーの環境変数）と `!`/TTY の説明が無い（`issue-run.md` 準備 3 にはある）。
- `.issue-kit/version` の `dirty` が、入れる脚本の作業ファイルそのもの（`.issue-kit/version`）の差でも true になる。

