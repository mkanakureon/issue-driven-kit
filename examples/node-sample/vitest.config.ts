// vitest.config.ts — 見本のプロジェクトの vitest の設定。試験は test/ の *.test.ts。
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
});
