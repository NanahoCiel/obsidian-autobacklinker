import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'main.ts',
  output: {
    file: 'main.js',
    format: 'cjs',
    sourcemap: false
  },
  plugins: [
    nodeResolve({ browser: true }),
    typescript({ tsconfig: './tsconfig.json' })
  ],
  treeshake: false
};
