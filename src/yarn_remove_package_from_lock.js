#!/usr/bin/env node

/** @type {module:fs} */
const fs = require('fs');
const packagesToRemove = process.argv.slice(2);

/** @type {string} */
let yarnLock;

try {
  yarnLock = fs.readFileSync('yarn.lock').toString();
} catch {
  console.warn('could not read yarn.lock');
  process.exit();
}

/**
 * @param {string} lockContents
 * @param {string} packageVersionHeader
 *
 * @return {string}
 */
const findBlockInLock = (lockContents, packageVersionHeader) => {
  const lockEntryStart = lockContents.indexOf(packageVersionHeader);

  if (lockEntryStart === -1) {
    throw new Error(
      `failed to find package in lock matching ${packageVersionHeader}`
    );
  }

  // add a newline to ensure that we're matching against the "whole line" otherwise
  // we'll error on e.g. `first-pkg` and `my-first-pkg` when trying to remove `first-pgk`
  if (lockContents.indexOf(`\n${packageVersionHeader}`, lockEntryStart + 1) !== -1) {
    throw new Error(
      'INTEGRITY FAILURE: Multiple matches for packageVersionHeader in yarn.lock'
    );
  }

  return lockContents.slice(
    lockEntryStart,
    lockContents.indexOf('\n\n', lockEntryStart)
  );
};

/**
 * @param {string} lockContents
 * @param {string} entryHeader
 *
 * @return {string}
 */
const removePackageEntryFromLock = (lockContents, entryHeader) =>
  lockContents.replace(findBlockInLock(lockContents, entryHeader), '');

/**
 * @param {string} lockContents
 * @param {string} packageName
 *
 * @return {Array<string>}
 */
const findPackageHeadersInLock = (lockContents, packageName) =>
  lockContents.match(new RegExp(`^"?${packageName}@.+:`, 'gm')) || [];

/**
 *
 * @param {string} lockContents
 * @param {string} packageName
 *
 * @return {string}
 */
const removePackageEntriesFromLock = (lockContents, packageName) =>
  findPackageHeadersInLock(lockContents, packageName).reduce(
    removePackageEntryFromLock,
    lockContents
  );

const newLock = packagesToRemove.reduce(removePackageEntriesFromLock, yarnLock);

if (newLock !== yarnLock) {
  fs.writeFileSync('yarn.lock', newLock);

  console.log(`removed some entries of ${packagesToRemove}`);
}
