import { terser } from "rollup-plugin-terser";

export default {
	input: 'src/timeliner.js',
	output: [
		{ file: "build/index.js", format: "cjs" },
		{ file: "build/timeliner.min.js", plugins: [terser()] },
		{ file: "build/index.es.js", format: "esm" }
	]
};