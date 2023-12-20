import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

/** @type {import('rollup').RollupOptions} */
export default [
	{
		input: './src/index.ts',
		external: ['@prisma/client', 'chalk', 'object-hash'],
		output: {
			dir: 'dist',
			preserveModules: true,
			exports: 'named',
			sourcemap: true
		},
		plugins: [typescript()]
	},
	{
		input: './src/index.ts',
		output: {
			dir: 'dist',
			exports: 'named',
			preserveModules: true,
			sourcemap: true
		},
		plugins: [
			dts(),
			// Use typescript only to resolve aliases
			typescript({
				noEmit: true
			})
		]
	}
];
