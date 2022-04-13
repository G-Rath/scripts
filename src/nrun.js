#!/usr/bin/env node

'use strict';

const { join } = require('path');
const { spawn } = require('child_process');
/** @type {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} */
const { name, scripts = {} } = require(join(process.cwd(), 'package.json'));

const scriptArgs = process.argv.slice(2);

if (!scriptArgs.length) {
  console.log(`Scripts for "${name}":`);
  Object.keys(scripts).forEach(scriptName => {
    console.log(' '.repeat(1), scriptName);
    console.log(' '.repeat(3), scripts[scriptName]);
  });

  process.exit(0);
}

const scriptName = scriptArgs.shift() || '';
const scriptCommand = scripts[scriptName];

if (!scriptName || !scriptCommand) {
  console.error(`Unknown script "${scriptName}" for package "${name}"`);

  process.exit(1);
}

const escapedArgs = scriptArgs.map(arg => `${arg.replace(/"/g, '\\"')}`);

console.warn('> nrun.js', scriptName);
console.warn('>', scriptCommand, ...escapedArgs);

spawn(
  'npm', //
  ['run', '--silent', scriptName, '--', ...escapedArgs],
  { stdio: 'inherit' }
).on('close', process.exit);
