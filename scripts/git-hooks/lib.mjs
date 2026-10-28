// lib.mjs — キット自身のコミットを検査するフックの本体（ふつうの関数。git にもファイルにも触らない）。
// 設計書: docs/design/commit-message-hooks-design.md（3 章・4.1・4.2）。コミットメッセージの形の正はこのファイル。
//   checkMessage(text)                              → 外れた項目の配列（'M2: 説明が 41 字（40 字まで）' の形。外れ 0 なら []）
//   checkStaged({ added, changed, ignored, sizes }) → { errors, warnings }（P1〜P3）
//   TEMPLATE                                        外れたときに見せるひな形

export const TYPES = ['feat', 'fix', 'docs', 'test', 'refactor', 'chore'];
export const MAX_SUBJECT = 40;
const SUBJECT = new RegExp(`^(${TYPES.join('|')})(\\([^)]*\\))?: (.+)$`);
const EXEMPT = /^(Merge |Revert "|Reapply "|fixup!|squash!|amend!)/;
const TRAILER = /^(Co-Authored-By|Signed-off-by|Reviewed-by|Helped-by):/i;
const VERIFY = /^確かめ[:：]/;
const SCISSORS = '# ------------------------ >8 ------------------------';

export const TEMPLATE = `種類: 説明（40 字以内。種類は ${TYPES.join('・')}。範囲は任意で 種類(範囲): 説明）

なぜ・変えたことを 1 行以上（細目は「- 」の箇条書き）
（Issue #35）
行を # で始めると、その行は数えない（Issue の番号は「（Issue #35）」のように前に字を置く）

確かめ: node scripts/test.mjs → Result: PASS 55/55（回していなければ「確かめ: なし（文書のみ）」）

---
感想を 1〜3 行

Co-Authored-By: …`;

// CRLF を LF にし、切り取り線から後と # の行を捨て、後ろの空行を落とす
export function normalizeMessage(text) {
  const lines = [];
  for (const l of String(text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    if (l === SCISSORS) break;
    if (!l.startsWith('#')) lines.push(l);
  }
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  return lines;
}

export function checkMessage(text) {
  const lines = normalizeMessage(text);
  if (!lines.length) return ['M1: メッセージが空'];
  const subject = lines[0];
  if (EXEMPT.test(subject)) return [];
  const out = [];
  const m = SUBJECT.exec(subject);
  if (!m) out.push(`M1: 件名が「種類: 説明」の形でない（種類は ${TYPES.join('・')}）`);
  else {
    const n = [...m[3].normalize('NFC')].length;
    if (n > MAX_SUBJECT) out.push(`M2: 説明が ${n} 字（${MAX_SUBJECT} 字まで）`);
  }
  if (lines.length > 1 && lines[1].trim()) out.push('M3: 2 行目が空行でない');
  let sep = -1;
  lines.forEach((l, i) => { if (l.trimEnd() === '---') sep = i; });
  const before = lines.slice(1, sep < 0 ? lines.length : sep);
  const after = sep < 0 ? [] : lines.slice(sep + 1);
  if (!before.some((l) => VERIFY.test(l))) out.push('M4: 最後の --- より前に「確かめ:」の行が無い');
  if (!before.some((l) => l.trim() && !VERIFY.test(l) && !TRAILER.test(l))) out.push('M4: 最後の --- より前に本文（なぜ・変えたこと）が無い');
  if (sep < 0) out.push('M5: 「---」だけの行が無い');
  else if (!after.some((l) => l.trim() && !TRAILER.test(l))) out.push('M5: 最後の --- の後に感想が無い');
  return out;
}

const SECRET_NAMES = [/^\.env$/, /^\.env\..+/, /^\.dev\.vars$/, /^credentials\..+/, /\.pem$/, /\.key$/];
const SECRET_PATHS = ['.claude/settings.local.json'];
export const MB = 1024 * 1024;
export const STOP_SIZE = 95 * MB;
export const WARN_SIZE = 50 * MB;

export function isSecretName(path) {
  const p = path.replaceAll('\\', '/').toLowerCase();
  const base = p.split('/').at(-1);
  return SECRET_PATHS.includes(p) || SECRET_NAMES.some((r) => r.test(base));
}

// added: 今回足すファイル（A）・changed: 足す・変えるファイル（AM）・ignored: check-ignore に当たったパス・sizes: { パス: バイト数 }（ACM）
export function checkStaged({ added = [], changed = [], ignored = [], sizes = {} } = {}) {
  const errors = [];
  const warnings = [];
  const addedSet = new Set(added);
  for (const p of ignored) if (addedSet.has(p)) errors.push(`P1: ${p} は .gitignore に当たる（git add -f で足していないか）`);
  for (const p of changed) if (isSecretName(p)) errors.push(`P2: ${p} は秘密らしい名前（公開のリポジトリ。要るなら名前を変える）`);
  for (const [p, size] of Object.entries(sizes)) {
    const mb = (size / MB).toFixed(1);
    if (size > STOP_SIZE) errors.push(`P3: ${p} が ${mb}MB（95MB まで。GitHub は 100MB で push を断る）`);
    else if (size > WARN_SIZE) warnings.push(`P3: ${p} が ${mb}MB（50MB を超えた）`);
  }
  return { errors, warnings };
}
