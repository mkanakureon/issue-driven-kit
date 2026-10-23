# 生成 AI の CLI と MCP をどう使うか — 方針

- 決めた日: 2026-10-22（ユーザーの指示「重要な決めごとなので Docs/Guides に」）
- 対象: このリポジトリ（KaedeScapeBuii・Unity 6000.6.6f1）で、Claude Code などの生成 AI が使う道具（CLI・MCP）
- これが正。変えるときはこの文書を書き換える（追記で例外を足さない）
- 元にした事実: kaedevn（UE）の運用（6 章）と、このリポジトリの Scape M1（Issue #5〜#9）の結果

---

## 0. 結論（先に）

| # | 決めごと | ひとことで |
|---|---|---|
| G1 | **AI が触る口は「コマンドとファイル（JSON・PNG・ログ）」にする** | MCP が無くても全部できる形を保つ |
| G2 | **Issue の無人実行（`issue-run`）では MCP を使わない** | エディタを閉じたバッチモードだけで、作る・確かめる・書き出す |
| G3 | **Unity エディタを操る MCP は、いまは入れない** | 入れるときは対話の時だけ・使い方の規則つき（3 章） |
| G4 | **自作の MCP は「AI に EXE を操らせる」必要が出たときだけ作る** | 道具を数個に絞り、他の道具を全部外して動かす（4 章） |
| G5 | **EXE とエディタの中に生成 AI を入れない** | 実行時に API を呼ばない。画像を見るのは Claude Code が PNG を読む |
| G6 | **権限は狭めるだけ・定額プランだけ** | `deny` で断る。`--dangerously-skip-permissions` は使わない。API キーをファイルに置かない |

M1 は G1・G2 のとおりに作り、MCP を 1 つも使わずに合格した（Issue #5〜#9・合計 54 分・どれも 1 回）。

---

## 1. 言葉

| 言葉 | 意味 |
|---|---|
| CLI | コマンドで動かす道具。ここでは `claude`（Claude Code）・`gh`（GitHub）・`Scripts/*.ps1`・Unity のバッチモード（`-batchmode -executeMethod`）・EXE の起動引数（`-scape-autoshot`） |
| MCP | Model Context Protocol。AI に「道具」を足す決まり。MCP のサーバーが道具（例: 「シーンに物を置く」）を出し、AI がそれを呼ぶ。サーバーは別のプロセスで、相手（エディタ・EXE）が起動している間だけ使える |
| 無人の回 | `Scripts/issue-run.ps1` が Issue ごとに `claude -p` を起動して、人なしで進める回（`Docs/Guides/Working/issue-run.md`） |
| 契約面 | AI と道具の境目。「何を渡せば何が返るか」が決まっている所 |

---

## 2. なぜ「コマンドとファイル」か（G1・G2）

### 2.1 無人の回と、エディタを操る MCP は両立しない

- 無人の回はテストも書き出しも Unity の**バッチモード**で回す。バッチモードは、**エディタがそのフォルダーを開いていると動かない**（`unity-test.ps1` が `Result: BLOCKED`）。
- エディタを操る MCP は、**エディタが開いている間しか**使えない。
- だから、エディタを操る MCP に頼る作り方をすると、無人の回が回らなくなる。kaedevn も同じ規則にした:「**MCP はエディタ起動中のみ・ビルドはエディタ終了中のみ**。配置セッションとビルドセッションを分ける」（kaedevn `Docs/Guides/Working/ue-stage-tooling.md` 7 章）。

### 2.2 合否は機械で読めるファイルで決める

- 合格の条件は確認コマンドの終了コードと `Result:` 行で決める（CLAUDE.md 原則4）。
- テストの結果は XML、撮影は PNG の大きさと `autoshot-result.json`、書き出しは `build-report.json`。どれもファイルなので、無人の回の確認コマンドが読める。MCP の返答は会話の中にしか残らず、確認コマンドから読めない。

### 2.3 M1 での実際（MCP を使わずにできたこと）

| やりたいこと | 使った口（コマンドとファイル） | 作った Issue |
|---|---|---|
| シーンを作る（テストワールド 2 つ） | `-executeMethod KaedeScapeBuii.ScapeEditor.TestWorldBuilder.BuildFromCommandLine`（シーンの YAML を手で書かない） | #8 |
| テストを回す | `Scripts/unity-test.ps1`（結果は `Logs/UnityTest/<時刻>/*-results.xml`） | #5〜#9 |
| EXE を書き出す | `Scripts/build-scape-exe.ps1 -Id test-outdoor,test-indoor`（`build-report.json`） | #9 |
| EXE で撮れるか確かめる | `<ID>.exe -batchmode -scape-autoshot`（PNG 3 枚・JSON・`autoshot-result.json`・ログの `SCAPE-AUTOSHOT PASS`） | #6・#9 |
| 画像を見る | Claude Code が PNG をそのまま読む（Read ツールは画像を読める） | — |

### 2.4 人もAIも同じ口を使う

コマンドとファイルなら、人がターミナルで打っても、AI が打っても、無人の回が打っても同じ結果になる。kaedevn の言い方では「入口はコンソールコマンドとコマンドレットと JSON ファイル。人が Output Log から叩いても、MCP のコンソール実行ツールから叩いても同じ」（`ue-stage-tooling.md` 5 章）。MCP を入れるときも、MCP から**この口を呼ぶ**形にし、MCP だけにある機能を作らない。

---

## 3. Unity エディタを操る MCP（G3）

### 3.1 いまの決定: 入れない

- いまは要らない。M1 の作業は全部 2.3 の口でできた。
- Unity のエディタを操る MCP（Unity 公式のもの・他の人が作ったもの）は、このリポジトリでは入れておらず、**版・道具の範囲・Unity 6000.6 で動くかを確かめていない**（7 章）。
- kaedevn では、UE 公式の MCP は「**使うが必須にしない**」とした。決め手は、MCP がエディタの全部の機能を AI に出してしまう（`AllToolsets`）ことだった。そこで AI に開く口は自分のコマンドと JSON に限った（`ue-stage-tooling.md` 2 章 行 10）。

### 3.2 入れるとしたら（この規則で）

kaedevn で UE 公式の MCP を使って分かったことを、そのまま規則にする（kaedevn `Docs/Guides/Working/claude-code-ue-plugin.md` 3〜4 章）。

| 規則 | 理由（kaedevn で起きたこと） |
|---|---|
| 対話のセッションだけで使う。無人の回では使わない | 2.1 |
| 呼ぶ前に、**どのプロジェクトのエディタにつながっているか**を読み取りの道具で確かめる | 接続先は「いま起動しているエディタ」で、「この worktree のエディタ」ではない。別のレーンから呼ぶと、別のレーンのエディタを操ってしまう |
| 道具は 1 つずつ順に呼ぶ（並べて投げない） | エディタの処理は 1 本の流れ（UE ではゲームスレッド）で動く |
| 操る前に保存し、終わったらまた保存する | MCP の編集は元に戻せないことがある |
| 撮影は MCP の画面取り込みを使わず、自分のコードで PNG をファイルに書く | kaedevn は `CaptureViewport` を使わないと決めた。画面を通すと色がずれる。Scape も RenderTexture から PNG を書く（M1 の `ShotCapturer`） |
| `--dangerously-skip-permissions` は使わない | MCP はエディタに広く直に触れる |
| 「道具が見えない」を「エディタが止まった」と思い込まない | 道具の一覧を読み直せば戻ることがある |

---

## 4. 自作の MCP（G4）

### 4.1 作るのはこのときだけ

**EXE を起動したまま、AI に「歩く・向く・撮る」を操らせたい**とき。Scape では、基本設計書 10 章の D9（アセットごとの「いい場所・いい視点」の候補を AI にどう探させるか）で B を選んだときにあたる。

推しは D9 の A で、MCP は要らない。候補の位置・向き・焦点距離を JSON にして `-scape-autoshot` に渡し、撮れた PNG を Claude Code が読んで候補を出す。無人の回でも回る。B は「探しながら決めたい」ときの手。

### 4.2 作るときの形（kaedevn の `adv_player` を手本に）

kaedevn は、AI に初めて遊ぶ人の役をさせる試験のために、自作の MCP のゲートウェイを作った（`Tools/adv-player-gateway/`・`Scripts/adv-player-launch.ps1`）。そこで決めたこと:

| 決めたこと | 中身 |
|---|---|
| 道具を絞る | 出す道具は 4 つだけ（`action`・`state`・`notebook`・`report`）。ファイルの取得・URL・git・デバッグの道具は出さない |
| 他の道具を外す | `claude -p` に `--tools ""`（組み込みの道具なし）・`--strict-mcp-config --mcp-config <ゲートウェイだけの設定>`・`--disable-slash-commands`（スキルなし）・`--setting-sources ""` を付ける |
| 余計な情報を見せない | 空の設定フォルダー（`CLAUDE_CONFIG_DIR`・`HOME`）と、`.git` も CLAUDE.md も無い一時フォルダーで起動する。環境変数は消してから要るものだけ渡す |
| 相手は起動側が決める | EXE・データ・ログの置き場は起動の引数で決める。AI の側からは指せない |
| 記録は AI から見えない所へ | 呼ばれた道具と返答を `--log-dir` に残す |
| 隔離を確かめてから始める | 起動前の点検で、実際に送られた中身から隔離を確かめる。確かめられなければ、正式な結果にしない |

Scape で作るなら、出す道具は「移る・向く・焦点距離・撮る・状態を読む」くらいにする。中では、2 章の口（`ScapeCommand`・`ShotService`）を呼ぶだけにする。MCP にしかない機能を作らない（2.4）。

---

## 5. 無人の回の `claude` の使い方（G6）

`Scripts/issue-run.ps1` が `claude -p` に渡しているもの（2026-10-22・Claude Code 2.1.307 で実測）:

```text
claude -p --output-format json --permission-mode auto --permission-prompts none
       --disallowed-tools AskUserQuestion --settings <.claude/issue-run/settings.json から作った設定>
       [--session-id | --resume <id>] [--model <モデル>]
```

| 決めごと | 中身 |
|---|---|
| 指示は標準入力で渡す | 引数で渡すと改行と引用符が壊れる |
| 権限は狭めるだけ | `.claude/issue-run/settings.json` の `deny`（push・履歴の書き換え・削除・Issue への書き込み・CLAUDE.md と `.claude/` の書き換え・`Docs/InSpecs/` の書き換えなど 52 件）。auto mode の判定にまかせない |
| 設定が効いたかを確かめてから始める | `-p` は壊れた設定を黙って無視する。起動前に Stop hook と `deny` が効くことを実際に試す（`probe.json`・`probe-stop-hook.txt`） |
| 返答を「合格」まで終わらせない | Stop hook。報告が「合格」になったら確認コマンドを回す |
| 使わないもの | `--dangerously-skip-permissions` |
| 料金 | 定額プランのログインで回す。API キー（従量課金）をファイルに書かない。kaedevn も「定額プラン内で…別料金は無理」（2026-10-07 ユーザー指示）で同じ |

---

## 6. kaedevn での事実（この方針の元）

| 事柄 | 事実 | 元 |
|---|---|---|
| UE 公式の MCP | プラグイン `unreal-engine-skills-for-claude-code` 3.1.0 を 2026-09-15 に入れた。`.mcp.json` は `"unreal-mcp": {"type":"http","url":"http://127.0.0.1:8000/mcp"}` の 1 つ。全部のテストは MCP を通さず、コマンドの `UnrealEditor-Cmd.exe` で回す | `Docs/Guides/Working/claude-code-ue-plugin.md` |
| MCP の範囲 | 「MCP で出す機能を絞る」つもりだったが、公式の MCP は最初からエディタの全部を出していた（`AllToolsets`）。そこで、AI に開く口を自分のコマンドと JSON に限った | `ue-stage-tooling.md` 2 章 行 10・`Docs/Reports/2026/09/13/01-…` |
| 撮影所 | 参考の PNG を Claude Code が読んで JSON を書く。エディタの中に LLM を作らない。Vision API は使わない | `ue-stage-tooling.md` 1 章・2 章 行 9 |
| 自作の MCP | `adv_player`（4.2）。親の会話やコミットの件名から、遊ぶ役に情報が漏れていたのを断つため | `Docs/CodexReports/2026/10/07/01-…` 18〜20 章 |
| 他の生成 AI | 背景の絵は Midjourney（`--ar 16:9 --niji`）。決まった台詞を大量に作るのは OpenAI の Batch で、ゲームの実行時には API を呼ばない。API キーは環境変数だけで、ファイルに保存しない | `Game/adv/backgrounds.md`・`Tools/adv-dialogue-factory/README.md` |
| RPG ツール | 「AI を必須にしない。GUI だけで全部できることを保つ」。MCP は v1 で作らない | `Docs/Reports/2026/10/13/02-genai-adoption-for-rpg-tool.md` 6 章 |

---

## 7. まだ確かめていないこと

| 事柄 | いまの扱い |
|---|---|
| Unity のエディタを操る MCP（公式・他の人のもの）の版・道具の範囲・Unity 6000.6 での動き | 入れない（G3）。入れたくなったら、先にこれを測って、この文書を書き換える |
| ユーザーの Claude の設定にある MCP（claude.ai のコネクター）が、無人の回の `claude -p` にも載るか | 確かめていない。載っていても、M1 では使われなかった。気になるなら、`issue-run.ps1` に `--strict-mcp-config` を足して外す（未採用の改善） |

---

## 8. 決定を変えるとき

| こうなったら | 見直すもの |
|---|---|
| D9 で B（EXE を AI に操らせる）を選んだ | G4。4.2 の形で作る |
| コマンドとファイルでは作れない作業が出た（例: アセットの見た目を見ながら物を置く） | G3。まず `-executeMethod` の脚本で書けないかを考え、書けないときだけ 3.2 の規則で入れる |
| EXE を外に配る（基本設計書 D6） | G5 は変えない。生成 AI の絵を EXE に入れるなら、配る先の表示の決まり（kaedevn は Fab の「Created with AI」を調べた）を先に確かめる |

> この文書は Claude Opus 5.5 が生成しました。内容の正確性は人間のレビューを経て確認してください。
