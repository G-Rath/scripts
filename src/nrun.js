#!/usr/bin/env node

'use strict';

const { join } = require('path');
const { spawn } = require('child_process');

const readPackageJsonOrExit = () => {
  try {
    /** @type {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} */
    return require(join(process.cwd(), 'package.json'));
  } catch (error) {
    // if we could not find a `package.json`, don't do anything
    if (error.code === 'MODULE_NOT_FOUND') {
      //  console.warn(process.env);
      process.exit();
    }

    throw error;
  }
};

const { name, scripts = {} } = readPackageJsonOrExit();

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
