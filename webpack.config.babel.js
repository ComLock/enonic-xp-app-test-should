/* eslint-disable no-console */
//──────────────────────────────────────────────────────────────────────────────
// Imports
//──────────────────────────────────────────────────────────────────────────────
import glob from 'glob';
import path from 'path';
//import {CleanWebpackPlugin} from 'clean-webpack-plugin';
//import EsmWebpackPlugin from '@purtuga/esm-webpack-plugin';
/*import jssCamelCase from 'jss-camel-case';
import jssDefaultUnit from 'jss-default-unit';
//import jssGlobal from 'jss-global';
import jssNested from 'jss-nested';
import jssPropsSort from 'jss-props-sort';
import jssVendorPrefixer from 'jss-vendor-prefixer';*/
//import MiniCssExtractPlugin from 'mini-css-extract-plugin';
//import postcssPresetEnv from 'postcss-preset-env';
//import TerserPlugin from 'terser-webpack-plugin';
//import UglifyJsPlugin from 'uglifyjs-webpack-plugin'; // Supports ECMAScript2015
import webpack from 'webpack';

//──────────────────────────────────────────────────────────────────────────────
// Common
//──────────────────────────────────────────────────────────────────────────────
//const MODE = 'production';
const MODE = 'development';

const JS_EXTENSION_GLOB_BRACE = '*.{es,es6,mjs,jsx,flow,js}';
const ASSETS_PATH_GLOB_BRACE = '{site/assets,assets}';

const SRC_DIR = 'src/main/resources';
const DST_DIR = 'build/resources/main';

const context = path.resolve(__dirname, SRC_DIR);
const outputPath = path.join(__dirname, DST_DIR);

//'mjs',
//'jsx',
//'esm',
const serverSideExtensions = [
	'es',
	'es6',
	//'ts',
	//'tsx',
	'js',
	'json'
];

const stats = {
	colors: true,
	entrypoints: false,
	hash: false,
	//maxModules: 0, // Removed in Webpack 5
	modules: false,
	moduleTrace: false,
	timings: false,
	version: false
};
const WEBPACK_CONFIG = [];

//──────────────────────────────────────────────────────────────────────────────
// Functions
//──────────────────────────────────────────────────────────────────────────────
//const toStr = (v) => JSON.stringify(v, null, 4);
const dict = (arr) => Object.assign(...arr.map(([k, v]) => ({ [k]: v })));

//──────────────────────────────────────────────────────────────────────────────
// Server-side Javascript
//──────────────────────────────────────────────────────────────────────────────
const ALL_JS_ASSETS_GLOB = `${SRC_DIR}/${ASSETS_PATH_GLOB_BRACE}/**/${JS_EXTENSION_GLOB_BRACE}`;
//console.log(`ALL_JS_ASSETS_GLOB:${toStr(ALL_JS_ASSETS_GLOB)}`);

const ALL_JS_ASSETS_FILES = glob.sync(ALL_JS_ASSETS_GLOB);
//console.log(`ALL_JS_ASSETS_FILES:${toStr(ALL_JS_ASSETS_FILES)}`);

const SERVER_JS_FILES = glob.sync(`${SRC_DIR}/**/${JS_EXTENSION_GLOB_BRACE}`, {
	ignore: ALL_JS_ASSETS_FILES
});
//console.log(`SERVER_JS_FILES:${toStr(SERVER_JS_FILES)}`);

if (SERVER_JS_FILES.length) {
	const SERVER_JS_ENTRY = dict(SERVER_JS_FILES.map((k) => [
		k.replace(`${SRC_DIR}/`, '').replace(/\.[^.]*$/, ''), // name
		`.${k.replace(`${SRC_DIR}`, '')}` // source relative to context
	]));
	//console.log(`SERVER_JS_ENTRY:${toStr(SERVER_JS_ENTRY)}`);

	const SERVER_JS_CONFIG = {
		context,
		entry: SERVER_JS_ENTRY,
		externals: [
			/^\//
		],
		devtool: false, // Don't waste time generating sourceMaps
		mode: MODE,
		module: {
			rules: [{
				exclude: [
					/\bcore-js\b/,
					/\bwebpack\b/,
					/\bregenerator-runtime\b/,
				],
				test: /\.(es6?|js)$/, // Will need js for node module depenencies
				use: [{
					loader: 'babel-loader',
					options: {
						babelrc: false, // The .babelrc file should only be used to transpile config files.
						comments: false,
						compact: false,
						minified: false,
						plugins: [
							//'import-css-to-jss', // NOTE This will hide the css from MiniCssExtractPlugin!
							//'optimize-starts-with', https://github.com/xtuc/babel-plugin-optimize-starts-with/issues/1
							//'transform-prejss',
							'@babel/plugin-proposal-class-properties',
							'@babel/plugin-proposal-export-default-from',
							'@babel/plugin-proposal-export-namespace-from',
							'@babel/plugin-proposal-object-rest-spread',
							'@babel/plugin-syntax-dynamic-import',
							'@babel/plugin-syntax-throw-expressions',
							'@babel/plugin-transform-classes',
							'@babel/plugin-transform-modules-commonjs',
							'@babel/plugin-transform-object-assign',
							'array-includes'
						],
						presets: [
							[
								'@babel/preset-env',
								{
									corejs: 3,

									// Enables all transformation plugins and as a result,
									// your code is fully compiled to ES5
									forceAllTransforms: true,

									targets: {
										esmodules: true, // Enonic XP doesn't support ECMAScript Modules
										// https://node.green/
										node: '0.10.48'
									},
									//useBuiltIns: false // no polyfills are added automatically
									useBuiltIns: 'entry' // replaces direct imports of core-js to imports of only the specific modules required for a target environment
									//useBuiltIns: 'usage' // polyfills will be added automatically when the usage of some feature is unsupported in target environment
								}
							]
						]
					} // options
				}]
			}]
		}, // module
		optimization: {
			//mangleExports: 'deterministic', // By default optimization.mangleExports: 'deterministic' is enabled in production mode and disabled elsewise.
			mangleExports: false,
			//minimize: false,
			minimizer: [
				/*new TerserPlugin({
					terserOptions: {
						compress: {
							drop_console: false
						},
						keep_classnames: true,
						keep_fnames: true
					}
				})*/
				/*new UglifyJsPlugin({
					parallel: true, // highly recommended
					sourceMap: false
				})*/
			],
			//usedExports: true // Determine used exports for each module and don't generate code for unused exports aka Dead code elimination.
			usedExports: false // Don't determine used exports for each module, no dead code removal
			//usedExports: 'global' // To opt-out from used exports analysis per runtime
		},
		output: {
			path: outputPath,
			filename: '[name].js',
			libraryTarget: 'commonjs'
		}, // output
		performance: {
			hints: false
		},
		plugins: [
			new webpack.ProvidePlugin({
				global: 'myGlobal'
			})
		],
		resolve: {
			alias: {
				myGlobal: path.resolve(__dirname, 'src/main/resources/lib/nashorn/global')
			},
			extensions: serverSideExtensions.map((ext) => `.${ext}`),
			fallback: {
				//buffer: false // Don't polyfill buffer since we're not running in Node? NO, Nashorn doesn't have buffer either.
				buffer: require.resolve('buffer/') // Polyfill buffer since Nashorn doesn't provide it.
			}
		}, // resolve
		stats
	};
	//console.log(`SERVER_JS_CONFIG:${JSON.stringify(SERVER_JS_CONFIG, null, 4)}`);
	WEBPACK_CONFIG.push(SERVER_JS_CONFIG);
}

//──────────────────────────────────────────────────────────────────────────────
// Exports
//──────────────────────────────────────────────────────────────────────────────
//console.log(`WEBPACK_CONFIG:${JSON.stringify(WEBPACK_CONFIG, null, 4)}`);
//process.exit();

export { WEBPACK_CONFIG as default };
