# Issue 駆動キット（issue-driven-kit）

Claude Code に GitHub の Issue を**合格するまで無人で**進めさせる仕組み（Issue 駆動）を、自分のリポジトリに入れるためのキットです。元は、作者の Unity のリポジトリ KaedeScapeBuii（private）で、撮影ツールを空のプロジェクトから EXE まで作ったときの仕組み（Issue 13 件が全部合格）です。

> [!IMPORTANT]
> **いまの状態（2026-10-28）**
> - **Unity 版**は使えます（KaedeScapeBuii で Issue 13 件が合格した実物の写し）。
> - **Node 版**（Windows・Mac・Node.js だけ）は、**Windows で確かめました**（キットの試験・見本のプロジェクトに入れてテストの入口を 3 つで回す・点検・DryRun。キット自身も Node 版で Issue 駆動にしています）。
> - **Windows で確かめた手順**（自分のリポジトリで Claude Code にキットのパスを示して入れるところから、点検と DryRun まで。出力つき）は、版ごとに 1 本ずつあります：[Windows で確かめる（Unity 版）](shared/manuals/issue-driven-kit-windows-check.md#windows-で確かめるunity-版)・[Windows で確かめる（Node 版）](shared/manuals/issue-driven-kit-windows-check.md#windows-で確かめるnode-版)。
> - **Node 版は Mac（macOS 15.8.1 arm64）でも確かめました**（入れる脚本・テストの入口・点検・DryRun・無人の回で Issue 4 件が 1 回目で合格。#3）。版は導入ガイドの「[確かめた版](shared/manuals/issue-driven-kit-install-guide.md#確かめた版)」、ほかの Mac で確かめる手順は「[付録 D キットの受け入れの確かめ（Mac）](shared/manuals/issue-driven-kit-install-guide.md#付録-d-キットの受け入れの確かめmac)」にあります。

## 版を選ぶ

| | **Unity 版** | **Node 版**（Windows・Mac で確かめた） |
|---|---|---|
| 向いているリポジトリ | Unity のプロジェクト | Node.js＋TypeScript（テストは vitest） |
| 動く OS | Windows | Windows・Mac |
| 脚本 | PowerShell 7 | Node.js 22.14.0 だけ（PowerShell は使わない） |
| 入れ方 | `pwsh editions\unity\install.ps1 -Target <リポジトリ> -DryRun` → `-DryRun` を外して本番 | `node editions/node/install.mjs --target <リポジトリ> --dry-run` → 本番 |

手順の全部（道具・clone・自分のリポジトリ・入れる・確かめる・最初の Issue）と、各手順で Claude Code に入力するプロンプトは、**導入ガイド [`shared/manuals/issue-driven-kit-install-guide.md`](shared/manuals/issue-driven-kit-install-guide.md)** にあります。

## 中身

| 置き場 | 中身 |
|---|---|
| `shared/spec/issue-run-spec.md` | 無人の Issue 実行の仕様の正（2 つの版はこれを実装する） |
| `shared/fixtures/issues/`・`issues-node/` | 見本（Issue の本文と、読み取りの答え。Unity 版と Node 版）。2 つの版が同じに読むか・ほかの版の確認コマンドを読まないかを試験で見る |
| `shared/claude-md/` | 両方の版の `CLAUDE.md` に同じ文で入る決まり（原則・進め方の決まり） |
| `shared/manuals/` | 使う人向けの説明書（導入ガイド・Windows で確かめる手順・チーム向けガイド・プロンプトの手順書・提案の説明書・新しいリポジトリに入れる手順書） |
| `shared/reading/` | 読み物（なぜ提案が効いたか）。元のリポジトリの記録そのもの（作業の記録・プロンプトの記録・事例）は private なので、このキットには入れていない |
| `editions/unity/` | Unity 版：`files/`（利用先に写す物）と `install.ps1` |
| `editions/node/` | Node 版：`files/`（利用先に写す物）と `install.mjs` |
| `examples/node-sample/` | Node 版の見本のプロジェクト（TypeScript＋vitest）。キットの試験 K-5 が、これに Node 版を入れて回す |
| `docs/design/` | キットの基本設計（決めること D1〜D12・作る順 K1〜K6） |
| `tests/` | キット自身の試験（`npm test`＝`node --test`） |

## キット自身の試験

```text
npm test
```

Windows で PowerShell 7 があるときは Unity 版の試験も回ります。環境変数 `KIT_UNITY_REFERENCE` に KaedeScapeBuii のパスを入れると、Unity 版を入れた結果が元のリポジトリと同じかも見ます（元のリポジトリは private なので、作者の PC だけで回る試験です）。

## ライセンス

[MIT](LICENSE)。

このリポジトリは公開です。作者の private のリポジトリの中身は入れていません（抜いた物は [`shared/SOURCE.md`](shared/SOURCE.md)）。

- **開発の途中の履歴は private に残しています。** キット自身を Issue 駆動で仕上げた Issue #1〜#5 と、その無人の回の記録です。
- **記録の番号について：** 説明書の中の「記録 22/01」「P54」のような呼び名は、作者の private の記録の番号です。記録そのものは入れていませんが、説明書はそれだけで読めるように書いてあります。

---

> この文書は Claude Opus 5.5 が生成しました。内容の正確性は人間のレビューを経て確認してください。
