#!/usr/bin/env node

const fs = require('fs');

const [, , fromFile, blockType, toFile] = process.argv;

if (!fromFile) {
  const maybeBlockType = blockType ? `${blockType} ` : '';

  throw new Error(
    `first argument must be path to file to extract ${maybeBlockType}blocks from`
  );
}

if (!blockType) {
  throw new Error(
    'second argument must be the name of the type of block to extract'
  );
}

const fromContents = fs.readFileSync(fromFile, 'utf-8');

/*
 * notes & facts:
 *
 * single-line blocks **must** end with `}` on the same "line", however
 * the "line" doesn't break if theres newlines within a nested map, i.e.
 *
 *    variable "z" { default = { x = 1
 *    } }
 *
 * there can only be *one* attribute in a single-line block
 */

const StartOfBlock = /^\s*\w+[^\n=]+\{/u;

/**
 * @typedef {[number, number, boolean]} BracePair
 */

class HCLBraceParser {
  /**
   *
   * @param {string} hcl
   */
  constructor(hcl) {
    /** @type {string} */
    this._hcl = hcl;
  }

  /**
   *
   * @return {string}
   */
  get hcl() {
    return this._hcl;
  }

  /**
   *
   * @return {Array<BracePair>}
   */
  findBracePairs() {
    /** @type {Array<BracePair>} */
    const closedBraces = [];
    /** @type {Array<BracePair>} */
    const openedBraces = [];
    let index = -1;

    for (const char of this._hcl) {
      index += 1;

      if (char === '{') {
        openedBraces.unshift([index, -1, openedBraces.length > 0]);

        continue;
      }

      if (char === '}') {
        const braceInfo = openedBraces.shift();

        // -1 means that the brace has already been closed
        if (!braceInfo || braceInfo[1] !== -1) {
          throw new Error('orphaned closing brace!');
        }

        braceInfo[1] = index;

        closedBraces.push(braceInfo);
      }
    }

    return closedBraces;
  }

  /**
   * Gets the contents within the pair of braces, **not** including the
   * opening and closing braces themselves
   *
   * @param {BracePair} bracePair
   *
   * @return {string}
   */
  getContentsBetweenBraces(bracePair) {
    return this._hcl.substring(bracePair[0] + 1, bracePair[1]);
  }

  /**
   * Gets the contents within the given pair of braces, wrapped with the opening
   * and closing braces.
   *
   * @param {BracePair} bracePair
   *
   * @return {string}
   */
  getContentsWithBraces(bracePair) {
    return `{${this.getContentsBetweenBraces(bracePair)}}`;
  }

  /**
   * Checks if the given brace pair is for the body of a block
   *
   * @param {BracePair} bracePair
   *
   * @return {boolean}
   */
  isBlockBody(bracePair) {
    const previousNewlineIndex = this._hcl.lastIndexOf('\n', bracePair[0]);
    const previousOpeningBraceIndex = this._hcl.lastIndexOf('{', bracePair[0]);

    if (previousNewlineIndex > previousOpeningBraceIndex) {
      return false;
    }

    return StartOfBlock.test(this._hcl.substring(previousNewlineIndex));
  }

  /**
   * - if the prefix starts/ends with a `$`, then the braces make up an expression
   * - if the prefix contains an `=`, then it probably is an attribute
   * - otherwise, it's probably a block.
   *
   * "probably" is because currently there is no special handling for comments,
   * so if you're parsing code that is a block comment in it, it could cause
   * a false-positive or negative.
   *
   * @param {BracePair} bracePair
   *
   * @return {string}
   */
  getPrefixContent(bracePair) {
    const beforeOpeningBrace = bracePair[0] - 1;
    const previousNewlineIndex = this._hcl.lastIndexOf(
      '\n',
      beforeOpeningBrace
    );
    const previousOpeningBraceIndex = this._hcl.lastIndexOf(
      '{',
      beforeOpeningBrace
    );
    const previousDollarIndex = this._hcl.lastIndexOf('$', beforeOpeningBrace);

    return this._hcl.substring(
      Math.max(
        previousNewlineIndex,
        previousOpeningBraceIndex,
        previousDollarIndex,
        0
      ),
      bracePair[0]
    );
  }

  /**
   * @todo support removing nested properly
   *
   * @param {number} start
   * @param {number} end
   */
  removeContents(start, end) {
    this._hcl = [this._hcl.substring(0, start), this._hcl.substring(end)].join(
      ''
    );
  }
}

const hclBraceParser = new HCLBraceParser(fromContents);

const bracePairs = hclBraceParser.findBracePairs();

/**
 * @typedef {Object} BlockInfo
 * @property {string} prefix
 * @property {string} body
 * @property {number} start
 * @property {number} end
 */

/** @type {Array<BlockInfo>} */
const blocks = bracePairs
  .map(pair => {
    const prefix = hclBraceParser.getPrefixContent(pair);

    return {
      prefix,
      body: hclBraceParser.getContentsWithBraces(pair),
      start: pair[0] - prefix.length,
      end: pair[1] + 1
    };
  })
  .filter(({ prefix }) => {
    const trimmedPrefix = prefix.trim();

    if (!trimmedPrefix.startsWith(blockType)) {
      return false;
    }

    return !(trimmedPrefix.endsWith('$') || trimmedPrefix.endsWith('='));
  });

const outFile = blocks
  .map(({ prefix, body }) => [prefix, body].join(''))
  .join('\n')
  .trim();

console.log(`Extracted ${blocks.length} "${blockType}" blocks`);

if (toFile) {
  fs.writeFileSync(toFile, `${outFile}\n`);

  // todo: we're assuming that the array is ordered first to last
  for (const block of blocks.reverse()) {
    hclBraceParser.removeContents(block.start, block.end);
  }

  fs.writeFileSync(fromFile, hclBraceParser.hcl);

  console.log(`Moved blocks from ${fromFile} to ${toFile}`);
} else {
  console.log(outFile);
}
