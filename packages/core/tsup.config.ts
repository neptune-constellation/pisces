import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', 'i18n/index': 'src/i18n/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  target: 'node22',
});
