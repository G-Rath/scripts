# scripts

This is a loose collection of "scripts" that I have had use for, and that I want to keep around somewhere just in case.

PRs & issues are welcomed, so feel free to ask questions, request help, improve existing stuff (any form of documentation is especially welcomed<3), and point out flaws.

While the majority of scripts are written in shell, there are a few scripts powered by Node/JS.
These require Node 12+, but otherwise have no dependencies - the `package.json` in the repo provides only dev dependencies such as `TypeScript` & `Prettier`.

Some details on the files so far:

### `git-compare-between-branchs`

Commands & stuff for easily comparing branches; this is useful for gitflow stuff.

It can help you answer "What branches have been merged on both `master` and `production`?".
