# Issue の無人実行のまとめ（20261028-141451）

`scripts/issue-run/issue-run.mjs` が自動で書いた。リポジトリ mkanakureon/issue-driven-kit・作業場所 issue-driven-kit（main）・ログ `.issue-run/logs/20261028-141451/`

| Issue | 結果 | 分 | 時刻 | 回 | コミット | 断られたツール |
|---|---|---|---|---|---|---|
| #33 仕様 1.1 と issue-run.md を今の動きに合わせる: 前回の claude-working は対象が 1 件以上の実行でだけ外れ、0 件なら残る・--issue で外す（#28 の未採用の改善） | PASS | 3 | 2026-10-28 14:15〜14:18 | 1 | 1 |  |

## #33 仕様 1.1 と issue-run.md を今の動きに合わせる: 前回の claude-working は対象が 1 件以上の実行でだけ外れ、0 件なら残る・--issue で外す（#28 の未採用の改善） — PASS

- `7c09899 docs: 仕様 1.1 と Node 版の issue-run.md を今の動きに合わせる（前回の claude-working は対象が 1 件以上の実行でだけ外れ、0 件なら残る・--issue で外す。Issue #33）`

### 結果: 合格
| 合格の条件 | 判定 | 根拠（コマンドと結果） |
|---|---|---|
| 仕様 1.1 の claude-working を外す文が「1 件以上」「0 件」「--issue」を書く | 合格 | `shared/spec/issue-run-spec.md` 1.1 の 1 行に 3 つとも入っている（判定役が確かめた） |
| Node 版 issue-run.md のラベルの表の claude-working の行が --issue と仕様 1.1 を指す | 合格 | `editions/node/files/docs/guides/working/issue-run.md` 39 行目 |
| 直下の issue-run.md が Node 版の写しと同じ | 合格 | `node editions/node/install.mjs --target . --update` → `Result: PASS`。`cmp` で差なし（判定役） |
| 脚本と Unity 版を変えない | 合格 | `git show HEAD --stat` は 4 ファイル（`.issue-kit/version`・issue-run.md 2 つ・仕様）だけ |
| キットの試験が全部通る | 合格 | `node scripts/test.mjs` → `Result: PASS 53/53`（skipped 1） |

### やったこと
- 脚本で今の動きを確かめた：Node `issue-run.mjs` も Unity `issue-run.ps1` も、対象 0 件だと札を外す所より前で終わる。`--issue` を付けると札を見ずにその Issue を対象にし、そのあと前回の札を外す。
- 仕様 1.1 の札を外す文を、今の動きに合わせて書き直した。
- Node 版 issue-run.md のラベルの表の `claude-working` の行に、残ったときの外し方と「仕様 1.1」を足した。
- install.mjs --update で直下に入れ直した。
- 判定は別のエージェントにさせた。5 つとも合格で、新しい文に事実の誤りは無かった。

### コミット
- 7c09899 docs: 仕様 1.1 と Node 版の issue-run.md を今の動きに合わせる（Issue #33）

### 選んだこと（自分で決めた点・違っていたときの戻し方）
- 表の行は、導入ガイド 6.1 と同じ順（次の実行で外れる → 0 件なら残る → --issue）で 1 文に書いた。違っていたら、その行を 7c09899 の前の文に戻して直す。

### やらなかったこと・断られた操作
- Unity 版の文書・脚本・見本は変えていない（Issue の「やらないこと」）。断られた操作は無い。

### 未採用の改善（気づいたがブロッカーでないもの。直さない）
- Node 版では `--issue` でも書き込みの権限を確かめる。Issue を書いた人に権限が無いとその回も対象 0 件になり、札は外れない。仕様にはこの場合を書いていない（判定役の指摘。起こりにくい）。

