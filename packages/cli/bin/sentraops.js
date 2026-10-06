#!/usr/bin/env node
import { runCli } from '../src/cli.js';

runCli(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code || 0;
  },
  (err) => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  }
);
