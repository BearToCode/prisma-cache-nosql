import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

/** @type {import('rollup').RollupOptions} */
export default {
	input: './src/index.ts',
	external: ['@prisma/client', 'chalk', 'object-hash'],
	output: {
		dir: 'dist',
		exports: 'named',
		preserveModules: true,
		sourcemap: true
	},
	plugins: [
		typescript(),
		dts({
			tsconfig: './tsconfig.json'
		})
	]
};
