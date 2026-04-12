#!/usr/bin/env node
import * as esbuild from 'esbuild';

const shared = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'traste',
};

await esbuild.build({ ...shared, outfile: 'dist/traste.js' });
await esbuild.build({ ...shared, outfile: 'dist/traste.min.js', minify: true });