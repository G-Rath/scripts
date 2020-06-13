#!/usr/bin/env node

/** @type {module:fs} */
const fs = require('fs');

const packagesToRemove = process.argv.slice(2);

/** @type {string} */
let packageLock;

try {
  packageLock = JSON.parse(fs.readFileSync('package-lock.json').toString());
} catch {
  console.warn('could not read package-lock.json');
  process.exit();
}

let removedCount = 0;

fs.writeFileSync(
  'package-lock.json',
  JSON.stringify(
    packageLock,
    (key, value) => {
      if (packagesToRemove.includes(key) && typeof value === 'object') {
        removedCount++;

        return undefined;
      }

      return value;
    },
    2
  )
);

console.log(`removed ${removedCount} instances of ${packagesToRemove}`);
