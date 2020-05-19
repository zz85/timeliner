simport { terser } from "rollup-plugin-terser";

export default {
	input: 'src/timeliner.js',
	output: [
		{ file: "build/lib.js", format: "cjs" },
		{ file: "build/timeliner.min.js", plugins: [terser()] },
		{ file: "build/timeliner.js", format: "esm" }
	]
};