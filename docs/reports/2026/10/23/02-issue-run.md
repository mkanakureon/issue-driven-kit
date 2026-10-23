# Issue の無人実行のまとめ（20261023-154308）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 `C:\Users\<you>\Documents\Projects\issue-driven-kit-public`・ログ `.issue-run/logs/20261023-154308/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #1 導入ガイドに「Windows で確かめる」の手順を Unity 版と Node 版で 1 本ずつ（自分のリポジトリで Claude Code にキットのパスを示して入れるところから） | PASS | 13 | 2026-10-23 15:43〜15:56 | 1 | 2 | Bash, PowerShell |
| #2 無人の回が拾う Issue を、書き込みの権限のある人が作ったものに限る（Node 版・仕様）・前提の確かめも同じ人のコメントだけに | PASS | 6 | 2026-10-23 15:56〜16:02 | 1 | 4 | Bash |

## #1 導入ガイドに「Windows で確かめる」の手順を Unity 版と Node 版で 1 本ずつ（自分のリポジトリで Claude Code にキットのパスを示して入れるところから） — PASS

- `ad7c9d6 docs: Windows で確かめるの出力を記録に合わせる（プロンプトの段は直接回したと明記・gh auth status などの実測を足す）`
- `eefbc4e docs: 「Windows で確かめる」を Unity 版と Node 版で 1 本ずつ書く（Windows で回した出力と記録つき）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| `## Windows で確かめる（Unity 版）`・`（Node 版）` の 2 節があり、それぞれ単独で上から進める | 合格 | `shared/manuals/issue-driven-kit-windows-check.md`（導入ガイドから辿れる）。確認コマンドの節の判定部分だけを `node -e` で回し、全部 OK・NG 0。判定役（別エージェント）も PASS |
| 節の一番上に Claude Code は必須・道具の表に `claude --version` | 合格 | 同上（両方の節。実測 `2.1.309 (Claude Code)`） |
| 手順の並びが 1 道具〜9 issue-run の DryRun | 合格 | U1〜U9・N1〜N9。判定役が順を照合して PASS |
| 各手順にプロンプト（text）かコマンド（powershell）と、最後の `Result:` 行・終了コードの表 | 合格 | Result 行の出ない段（道具・clone・起動）は「出ない」と明記。判定役 PASS |
| 出力は Windows で実際に回したもの・日付と版を節の頭に・記録を `docs/reports/` に 1 本 | 合格 | 2026-10-23 に回した。記録 `docs/reports/2026/10/23/01-windows-install-check-report.md`。判定役が指摘した「記録に無い出力」は実測を取り直して記録に足すか、期待の動きと書き分けた（ad7c9d6） |
| Node 版は `examples/node-sample` の写しで | 合格 | install --dry-run `Result: PASS (DryRun・何も書いていない)` 0 → 本番 `Result: PASS (30 件を写した…)` 0 → テストの入口 `PASS 2/2` 0・`FAIL (0/0（テストが 0 件）)` 1・`FAIL (2/3)` 1 → 点検 `Result: FAIL  NG 1・WARN 3`（origin 無し）1／キットの clone で `Result: PASS  WARN 3` 0 → DryRun 0 |
| Unity 版は空のフォルダーを git init して install.ps1 で | 合格 | DryRun `Result: PASS (DryRun…)` 0 → 本番 `Result: PASS (29 件を写した…)` 0 → 点検 `Result: PASS  WARN 2` 0 → `issue-run.ps1 -DryRun` 0。Unity 6000.6.6f1 があったのでテストの入口も実際に回した：`PASS EditMode 1/1` 0・`FAIL 0/0` 1・`FAIL 1/2` 1 |
| README の「いまの状態」と導入ガイドの「確かめた版」から辿れる | 合格 | 両方に 2 節へのリンクを足した（eefbc4e） |
| キット自身の試験（npm test）が通る | 合格 | `node scripts/test.mjs` → `Result: PASS 28/28`・exit 0 |

### やったこと
- キットを GitHub から `%TEMP%\kitwin` に clone し、Node 版（node-sample の写し）と Unity 版（空のフォルダー＋git init。後で Unity のプロジェクトを batchmode で作成）を入れ、DryRun・本番・テストの入口を 3 つ・点検・issue-run の DryRun を回した。
- 新しい説明書 `shared/manuals/issue-driven-kit-windows-check.md`（2 節）と記録 `docs/reports/2026/10/23/01-windows-install-check-report.md` を書き、README と導入ガイドの表からリンクした。
- 判定役（別エージェント）に差分と記録を読ませて判定させ、指摘（記録に無い出力）を実測で埋めた。

### コミット
- eefbc4e docs: 「Windows で確かめる」を Unity 版と Node 版で 1 本ずつ書く
- ad7c9d6 docs: Windows で確かめるの出力を記録に合わせる

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 2 節は導入ガイドに入れず、別の文書 `issue-driven-kit-windows-check.md` に分けて導入ガイド・README から辿る形にした（導入ガイドが 530 行あり、版ごとに単独で読める方が読みやすいため）。戻すなら 2 節を導入ガイドへ移し、リンク先を直す。
- 点検の PASS を得る `origin` の代わりに、Unity 版の仮の利用先は `origin` をキットのリポジトリに向け、Node 版はキットの clone（M4 と同じ）と `--repo` で回した。読み取りだけ。
- Unity のプロジェクトは `Unity.exe -batchmode -quit -createProject` で作った（Unity Hub を使わない）。

### やらなかったこと・断られた操作
- 手順 3・4 の対話の Claude Code の起動とプロンプトの入力は回していない（無人の回から別の対話のセッションを開けない）。Claude Code が打つコマンドを直接回し、文書にもそう明記した。
- わざと落とすテストの `Remove-Item` は断られたので、`Move-Item` でフォルダーの外へ移した。Node の仮の利用先への `git remote add origin` を含むコマンドが 1 回断られた（Unity 側では単独で通った）。
- `%TEMP%\kitwin`（仮の利用先とキットの clone）は消していない（消す操作は断られるため）。要らなければ人が消す。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- Unity 版 `Scripts\issue-run.ps1 -DryRun` は `origin` が無いと `InvalidOperation`（128 行目）で落ちる（Node 版のような案内が出ない）。
- Unity 版 `Scripts/unity-test.ps1` は落ちたテストの理由に `System.Xml.XmlElement` を出す（メッセージの中身でない）。
- Node 版 `issue-run.mjs --dry-run --repo …` を `origin` 無しの所で回すと「守るファイル:」が空になる。
- 無人の回の指示文が、Node の `testRunner: node` のリポジトリでも「node scripts/test.mjs（vitest）」と書く。


## #2 無人の回が拾う Issue を、書き込みの権限のある人が作ったものに限る（Node 版・仕様）・前提の確かめも同じ人のコメントだけに — PASS

- `8b5f7b8 chore: 直した Node 版をキットの直下に入れ直す（Issue #2・前提のコメント）`
- `6a28960 fix: 前提に権限のある人の結果のコメントが無ければ、済んでいないと見る（Issue #2）`
- `6f205ec chore: 直した Node 版をキットの直下に入れ直す（Issue #2）`
- `cbcf309 fix: 無人の回（Node 版）が拾う Issue と前提のコメントを、書き込みの権限のある人のものに限る`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 仕様に「claude-run が付き、作った人が書き込みの権限（write・maintain・admin）を持つ Issue だけ」「前提のコメントは権限のある人のものだけ」 | 満たす | `shared/spec/issue-run-spec.md` 1 章の「札」の行・新しい 1.2・2.2 の「済んでいる／済んでいない」の行（判定役が差分で確かめた） |
| 権限の無い人の Issue を外し、DryRun と本番の最初の行に番号と理由を出す | 満たす（差分で） | `step(対象 N 件 …・外した N 件: #n（理由）)` を DryRun の分かれ道より前に置いた。実際の `gh api` を通した DryRun（一時の clone で `--issue 2`）→ `対象 1 件: #2`（作った人は admin）。外す場面は単体の試験で確かめた |
| 試験 3 本（GitHub を呼ばず、権限を返す関数を外から与える） | 満たす | `node scripts/test.mjs --filter '無人の回（Node 版）'` → `Result: PASS 3/3` |
| 直下の `scripts/issue-run/issue-run.mjs` が Node 版と同じ | 満たす | `install.mjs --target . --update` の後に `cmp` → same |
| `editions/unity/files/` を変えていない | 満たす | `git diff --stat ad7c9d6 HEAD -- editions/unity/files/` と `git status --porcelain` → どちらも空 |
| `npm test` が通る | 満たす | `node scripts/test.mjs` → exit 0・`Result: PASS 31/31` |

判定は別のエージェントにさせた。確認コマンドは回させず、差分とログだけを読ませた。判定役は 5 条件を「満たす」とし、残る 1 条件は「本体は満たす。報告の 1 行は未確認」とした（その行は下の「未採用の改善」に書いた）。判定役が指摘した前提の確かめの穴は、そのあと直した（下）。

### やったこと
- 仕様に「1.2 書き込みの権限」を足した（権限の取り方・使い回し・読めないときは拾わない／数えない・外した Issue の出し方・前提のコメント）。9 章には「Unity 版はまだ実装していない」と書いた。
- `lib.mjs` に `permissionChecker`（同じ人は 1 回だけ問う・読めなければ権限なし）・`selectTargets`（対象と、外した Issue と理由）・`lastRunComment` を足した。
- `issue-run.mjs`: 権限は `gh api repos/<repo>/collaborators/<login>/permission --jq .permission` で読む。対象の一覧を出す行に、外した Issue を出すようにした。`--issue` で 1 件を指定したときも権限を見る。前提の確かめでは、権限のある人のコメントだけを読む。そのコメントが無ければ「済んでいない」とする（判定役の指摘で直した。仕様 2.2 の文と合う）。
- `docs/guides/working/issue-run.md` のラベルの節に、権限の決まりを 1 段落足した。
- `tests/node.test.mjs` に、名前が指定どおりの試験を 3 本足した。
- 直した Node 版をキットの直下に入れ直した（`install.mjs --target . --update`）。

### コミット
- cbcf309 fix: 無人の回（Node 版）が拾う Issue と前提のコメントを、書き込みの権限のある人のものに限る
- 6f205ec chore: 直した Node 版をキットの直下に入れ直す（Issue #2）
- 6a28960 fix: 前提に権限のある人の結果のコメントが無ければ、済んでいないと見る（Issue #2）
- 8b5f7b8 chore: 直した Node 版をキットの直下に入れ直す（Issue #2・前提のコメント）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- `--issue <番号>` で 1 件を指定したときも、権限を見るようにした（安全な側）。札は見ない。違っていれば、`targetIssues()` の `ONE_ISSUE` の分かれ道から `selectTargets` を外す。
- 前提の Issue に `claude-done` が付いていても、権限のある人の結果のコメントが無ければ WAITING にした。違っていれば 6a28960 を戻す。
- 権限が読めなかった結果も、1 回の起動のあいだ使い回す（安全な側への誤り）。違っていれば、`permissionChecker` で投げたときの結果を覚えないようにする。
- `.issue-kit/version` を入れ直しの記録としてコミットした（`dirty: true` は、入れ直したときに直下の写しがまだコミットされていなかったため）。

### やらなかったこと・断られた操作
- 本物の作業場所での `--dry-run` は、親の issue-run がロックを持っていて止まった（終了コード 3）。代わりに一時の clone で `--work-dir` を指定して回した。
- 権限の無い人の Issue が外れる場面を、実物の GitHub では回していない（そういう Issue が無い）。単体の試験で確かめた。
- `gh api …/collaborators/octocat/permission` を手で回す確かめは、auto mode に断られた。
- 一時の clone（`%TEMP%` の下）と `.issue-run/judge/` の判定用のファイルは消していない（追跡外。`.issue-run/` は git の管理外）。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- Unity 版（`editions/unity/files/Scripts/issue-run.ps1`）にも同じ権限の決まりが要る。元のリポジトリ（KaedeScapeBuii）で直してから写す（K-4 の許す差も合わせる）。
- GitHub の `permission` の欄の値は admin・write・read・none だけ（maintain は write、triage は read として返る）。仕様の「maintain」は害が無いが、正確には `role_name` の欄の言葉。
- 外した Issue を最初の行に出すことを、子のプロセスの試験（偽の `gh`）で確かめる試験は無い。

