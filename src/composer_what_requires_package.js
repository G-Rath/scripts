#!/usr/bin/env node

/**
 * @typedef {Object} PackageSource
 * @property {'git'|'zip'} type
 * @property {string} url
 * @property {string} reference
 */

/**
 * @typedef {Object} LockedPackage
 * @property {string} name
 * @property {string} version
 * @property {string} type
 * @property {string} description
 * @property {string} time
 * @property {Object} autoload
 * @property {string} notification-url
 * @property {?Record<string, string>} require
 * @property {?Record<string, string>} require-dev
 * @property {?Record<string, string>} suggest
 * @property {Array<string>} license
 * @property {?Array<string>} keywords
 * @property {PackageSource} source
 * @property {PackageSource} dist
 */

/**
 * @typedef {Object} ComposerLock
 * @property {Array<LockedPackage>} packages
 */

/**
 * @typedef {Object} PackageInfo
 * @property {string} name
 * @property {string} version
 * @property {Array<RequiredPackage>} requiredBy
 */

/**
 * @typedef {Object} RequiredPackage
 * @property {string} constraint
 * @property {boolean} dev
 * @property {string} name
 * @property {string} version
 * @property {Array<RequiredPackage>} requiredBy
 */

/** @type {module:fs} */
const fs = require('fs');

const [packageToLookFor] = process.argv.slice(2);

if (!packageToLookFor) {
  throw new Error('first argument must be the name of a package');
}

/** @type {ComposerLock} */
let composerLock;
try {
  composerLock = JSON.parse(fs.readFileSync('composer.lock').toString());
} catch {
  console.warn('could not read composer.lock');
  process.exit(-1);
}

const { packages } = composerLock;

console.log(
  'Successfully parsed composer lock containing',
  packages.length,
  'packages'
);

/**
 *
 * @param {string} packageName
 *
 * @return {string}
 */
const getPackageVersion = packageName => {
  const { version } = packages.find(lock => lock.name === packageName) || {};

  if (!version) {
    throw new Error(`cannot find "${packageName}" in lock`);
  }

  return version;
};

/**
 *
 * @param {string} packageName
 * @param {LockedPackage} lockedPackage
 *
 * @return {string}
 */
const getRequireConstraint = (packageName, lockedPackage) => {
  if (lockedPackage.require && packageName in lockedPackage.require) {
    return lockedPackage.require[packageName];
  }

  if (
    lockedPackage['require-dev'] &&
    packageName in lockedPackage['require-dev']
  ) {
    return lockedPackage['require-dev'][packageName];
  }

  throw new Error(`"${packageName}" is not required by ${lockedPackage.name}`);
};

/** @type {Record<string, Array<RequiredPackage>>} */
const treeCache = {};

/**
 *
 * @param {string} packageName
 *
 * @return {Array<RequiredPackage>}
 */
const whatRequiresPackage = packageName => {
  if (packageName in treeCache) {
    return treeCache[packageName];
  }

  treeCache[packageName] = composerLock.packages
    .filter(
      lockedPackage =>
        !!(
          (lockedPackage['require-dev'] &&
            packageName in lockedPackage['require-dev']) ||
          (lockedPackage.require && packageName in lockedPackage.require)
        )
    )
    .map(lockedPackage => ({
      name: lockedPackage.name,
      version: lockedPackage.version,
      requiredBy: [],
      constraint: getRequireConstraint(packageName, lockedPackage),
      dev: !(lockedPackage.require && packageName in lockedPackage.require)
    }));

  treeCache[packageName].forEach(lockedPackage => {
    lockedPackage.requiredBy = whatRequiresPackage(lockedPackage.name);
  });

  return treeCache[packageName];
};

const { PerformanceObserver, performance } = require('perf_hooks');

/**
 *
 * @param {string} packageName
 *
 * @return {PackageInfo}
 */
const gatherPackageInfo = packageName => ({
  name: packageName,
  version: getPackageVersion(packageName),
  requiredBy: whatRequiresPackage(packageName)
});

/** @type {number} */
let duration = 0;

const obs = new PerformanceObserver(items => {
  ({ duration } = items.getEntries()[0]);
  obs.disconnect();
});

obs.observe({ entryTypes: ['function'] });

const info = performance.timerify(gatherPackageInfo)(packageToLookFor);

console.log();
console.log(
  `gathered requirement info on ${info.name}:${
    info.version
  } in ${duration}ms (${duration / 100}s)`
);

if (info.requiredBy.length === 0) {
  console.log(`-- no packages in lock require ${info.name} --`);
  process.exit();
}

console.log(
  `package is a direct requirement of ${info.requiredBy.length} package${
    info.requiredBy.length === 1 ? '' : 's'
  }:`
);

console.table(
  info.requiredBy
    .concat()
    .sort((_, p) => -p.dev)
    .reduce((o, p) => ({ ...o, [p.name]: p }), {}),
  ['version', 'constraint', 'dev']
);

/**
 *
 * @param {Array<RequiredPackage>} requiringPackages
 * @param {number} depth
 */
const printRequiringPackages = (requiringPackages, depth = 0) => {
  requiringPackages.forEach(pack => {
    console.log(
      ' '.repeat(depth),
      `${pack.name}:${pack.version}`,
      pack.dev ? '(dev)' : ''
    );

    if (pack.dev) {
      return;
    }

    printRequiringPackages(pack.requiredBy, depth + 1);
  });
};

printRequiringPackages(info.requiredBy);
