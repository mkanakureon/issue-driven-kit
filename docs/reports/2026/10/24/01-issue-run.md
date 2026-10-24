# Issue の無人実行のまとめ（20261024-161318）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 `C:\Users\<you>\Documents\Projects\issue-driven-kit`・ログ `.issue-run/logs/20261024-161318/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #4 確認コマンドの「変数で指す」のこつに、ファイルのパスを丸ごと変数に入れても守られることを足す・DryRun の守るファイルを切らずに読む・キットの例を直す | PASS | 4 | 2026-10-24 16:13〜16:17 | 1 | 1 |  |

## #4 確認コマンドの「変数で指す」のこつに、ファイルのパスを丸ごと変数に入れても守られることを足す・DryRun の守るファイルを切らずに読む・キットの例を直す — PASS

- `aa18752 docs: 変数に入れるのはフォルダーまで・DryRun の守るファイルを切らずに読む・キットの例を直す（Issue #4）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 3 つの issue-goal-setting.md の 4 章に「フォルダーまで」「切らずに全部読み」 | 満たす | 部分の確かめ（正規表現を同じに当てた node の小さな脚本）で 3 つとも true。別のエージェントの判定も満たす |
| 直下と Node 版の issue-goal-setting.md が同じ | 満たす | sha256 が一致（同じ脚本） |
| 3 つの SKILL.md の DryRun の段に「切らずに全部読む」・直下と Node 版が同じ | 満たす | 3 つとも true・ハッシュが一致 |
| ファイルのパスを丸ごと変数に入れた例が直下・Node 版・02.md に残っていない（02.expected.json も合わせる） | 満たす | 正規表現に当たるものが無い。02.expected.json の check も同じ 2 行に直した |
| 試験 2 本があって通る | 満たす | `node scripts/test.mjs` → `Result: PASS 33/33`（skip 1 は K-4） |
| キット自身の試験が通る | 満たす | 同上 |
| issue-run.ps1・issue-run.mjs・lib.mjs を変えていない | 満たす | `git diff --stat` で該当フォルダーの差が無い |

### やったこと
- Node 版・Unity 版の issue-goal-setting.md の 4 章に「変数に入れるのはフォルダーまで」「DryRun の守るファイルを切らずに全部読む」を足した（Unity 版は Issue に書いてあった文のまま）
- 両方の版の github-issue SKILL.md の手順 9 に、守るファイルを切らずに全部読む文を足した
- issue-goal-setting.md の 6 章の例と shared/fixtures/issues-node/02.md・02.expected.json を、フォルダーを変数に入れて組み立てる形に直した
- tests/node.test.mjs に `protectedFiles` の試験を 2 本足した
- `node editions/node/install.mjs --target . --update` で直下に入れ直した

### コミット
- aa18752 docs: 変数に入れるのはフォルダーまで・DryRun の守るファイルを切らずに読む・キットの例を直す（Issue #4）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- Unity 版の「切らずに全部読み」の文は、新しい行にせず、いまの「守るファイルに出る」の行の後ろにつないだ（戻すなら、行を分けるだけ）
- K-4 で許す差は足さなかった。Issue によると、参照のリポジトリでは先に同じ文に直してあるため（違っていたら、K-4 の allowed に理由と一緒に足す）

### やらなかったこと・断られた操作
- K-4 は回していない（KIT_UNITY_REFERENCE が無いのでスキップ）。Unity 版の写しが参照と同じかは、実測で確かめていない
- 確認コマンドを丸ごとは回していない（決まりどおり）

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- shared/fixtures/issues/01.md・02.md と shared/manuals/issue-driven-guide-for-teams.md に「書かせる文書は変数で指す」の注釈が残っている。中身はもうフォルダーを変数に入れる形なので、害は無い

