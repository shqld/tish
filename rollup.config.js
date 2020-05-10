import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import external from 'rollup-plugin-auto-external'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

const isDev = process.env.BUILD_ENV === 'development'

/** @type {import('rollup').RollupOptions} */
const config = {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [
        resolve({
            extensions: ['.ts'],
        }),
        commonjs(),
        replace({
            'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
        }),
        external(),
        babel({
            exclude: 'node_modules/**',
            extensions: ['.ts'],
        }),
        !isDev && terser(),
    ],
}

export default config
