// helpers.mjs — キットの試験（tests/*.test.mjs）の共通の部品。*.test.mjs でないので、テストの入口は試験として回さない。
//   gitIn         試験用の名前で、dir の git を回す
//   pwshCrashed   pwsh そのものが落ちたか（0xC0000005 か「Internal CLR error」）
//   runWithRetry  落ちたときだけやり直し、やり直すたびに 1 行残す（外に触らない。試験は偽の run で書く）
import { spawnSync } from 'node:child_process';

export const gitIn = (dir, ...args) => spawnSync('git', ['-C', dir, '-c', 'user.name=kit-test', '-c', 'user.email=kit-test@example.invalid', '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' });

// pwsh そのものが落ちた（試験を並べて回すと、まれに「Fatal error. Internal CLR error.」・0xC0000005 で落ちる）。脚本の結果は見ない
export const pwshCrashed = (r) => r.status === 0xC0000005 || /Internal CLR error/.test(`${r.stdout ?? ''}${r.stderr ?? ''}`);

// run() を 1 回回し、crashed(r) のあいだ tries 回までやり直す。やり直すたびに log へ 1 行（何回目か・終了コード）
export function runWithRetry(run, { crashed = pwshCrashed, tries = 2, log = console.error } = {}) {
  let r = run();
  for (let i = 1; i <= tries && crashed(r); i++) {
    log(`pwsh が落ちたのでやり直す（${i} 回目・終了コード ${r.status}）`);
    r = run();
  }
  return r;
}
