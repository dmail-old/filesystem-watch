# filesystem watch

[![npm package](https://img.shields.io/npm/v/@dmail/filesystem-watch.svg)](https://www.npmjs.com/package/@dmail/filesystem-watch)
[![build](https://travis-ci.com/dmail/filesystem-watch.svg?branch=master)](http://travis-ci.com/dmail/filesystem-watch)
[![codecov](https://codecov.io/gh/dmail/filesystem-watch/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/filesystem-watch)

> Watch changes on your filesystem, either in a folder or on a specific file.

Warning: still in development.

TODO: install linux os and check why registerFileLifecycle tests fails on linux.

## Introduction

`@dmail/filesystem-watch` has the following exports.<br />

- `registerFolderLifecycle`
- `registerFileLifecycle`

## `registerFolderLifecycle` example

```js
import { registerFolderLifecycle } from "@dmail/filesystem-watch"

registerFolderLifecycle("/Users/me/folder", {
  added: (entry) => {},
  updated: (entry) => {},
  removed: (entry) => {},
})
```

TODO: write documentation for this method and put link here
Do not forget to document that on window `removed` will not be called when something is removed

## `registerFileLifecycle` example

```js
import { registerFileLifecycle } from "@dmail/filesystem-watch"

registerFileLifecycle("/Users/me/folder/file.js", {
  added: () => {},
  updated: () => {},
  removed: () => {},
})
```

TODO: write documentation for this method and put link here

## Installation

```console
npm install @dmail/filesystem-watch@2.3.0
```

## Why ?

I needed something capable to watch file changes on the filesystem.<br />

The documentation of fs.watch makes it clear that you cannot really use it directly because it has several limitations specific to the filesystem.<br />

Then I tried chokidar, a wrapper around fs.watch. However I could not fully understand what chokidar was doing under the hood.<br />

What I needed was small wrapper around fs.watch that do not shallow events sent by the operating system. Ultimately chokidar could maybe do what I need but it's a bit too big for my use case.

— see [fs.watch documentation](https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener)<br />
— see [chokidar on github](https://github.com/paulmillr/chokidar)
