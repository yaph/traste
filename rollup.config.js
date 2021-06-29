import {terser} from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';

import * as meta from './package.json';


const config = {
    input: 'src/index.js',
    external: Object.keys(meta.dependencies),
    output: {
        file: `dist/${meta.name}.js`,
        format: 'umd',
        name: 'traste',
        globals: {
            'd3-selection': 'd3',
            '@tonaljs/tonal': 'Tonal'
        },
        banner: `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`
    },
    plugins: [
        babel()
    ]
};

export default [
    config,
    {
        ...config,
        output: {
            ...config.output,
            file: `dist/${meta.name}.min.js`
        },
        plugins: [
            ...config.plugins,
            terser({
                output: {
                    preamble: config.output.banner
                }
            })
        ]
    }
];
