import typescript from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy'
import node from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-bundle-size'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'iife',
  },
  plugins: [
    typescript({
      typescript: require('typescript'),
      objectHashIgnoreUnknownHack: true,
    }),
    node(),
    terser({
      output: {
        ecma: 8,
      },
      compress: {},
      mangle: {
        module: true,
        toplevel: true,
        properties: true,
      },
      module: true,
      toplevel: true,
    }),
    size(),
    copy({
      targets: [
        'src/index.html',
      ],
      outputFolder: 'dist',
    }),
  ],
}
