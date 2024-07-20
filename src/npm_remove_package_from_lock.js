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
      if (typeof value === 'object') {
        // handles lockfile v2+ format
        if (key === 'packages') {
          return Object.fromEntries(
            Object.entries(value).filter(([key]) => {
              if (
                packagesToRemove.some(
                  pkg =>
                    key.endsWith(`node_modules/${pkg}`) ||
                    key === `node_modules/${pkg}`
                )
              ) {
                removedCount++;

                return false;
              }

              // remove the dependency if its a child of a package to remove
              // just without counting it as a removed package
              return !packagesToRemove.some(pkg =>
                key.includes(`node_modules/${pkg}/`)
              );
            })
          );
        }

        // handles lockfile v1 format
        if (key === 'dependencies') {
          return Object.fromEntries(
            Object.entries(value).filter(([key, v]) => {
              // lockfile v2+ has a "dependencies" object with string values
              // which specifies the contraints, so we don't want remove that
              if (typeof v === 'object' && packagesToRemove.includes(key)) {
                removedCount++;

                return false;
              }

              return true;
            })
          );
        }
      }

      return value;
    },
    2
  ) + '\n'
);

console.log(`removed ${removedCount} instances of ${packagesToRemove}`);
