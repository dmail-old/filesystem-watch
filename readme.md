# filesystem watch

[![npm package](https://img.shields.io/npm/v/@dmail/filesystem-watch.svg)](https://www.npmjs.com/package/@dmail/filesystem-watch)
[![build](https://travis-ci.com/dmail/filesystem-watch.svg?branch=master)](http://travis-ci.com/dmail/filesystem-watch)
[![codecov](https://codecov.io/gh/dmail/filesystem-watch/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/filesystem-watch)

> Watch changes on your filesystem, either in a folder or on a specific file.

## Introduction

`@dmail/filesystem-watch` has the following exports.<br />

- `registerFolderLifecycle`
- `registerFileLifecycle`

## `registerFolderLifecycle` example

`registerFolderLifecycle` is meant to be used when you need to something in sync with a given folder contents.

```js
import { registerFolderLifecycle } from "@dmail/filesystem-watch"

const folderContentMap = {}
registerFolderLifecycle("/Users/you/folder", {
  added: ({ relativePath, type ) => {
    folderContentMap[relativePath] = type
  },
  removed: ({ relativePath }) => {
    delete folderContentMap[relativePath]
  },
})
```

— see [`registerFolderLifecycle` documentation](./docs/register-folder-lifecycle-doc.md)

## `registerFileLifecycle` example

`registerFileLifecycle` is meant to be used when you need to do something in sync with a given file content.

```js
import { readFileSync } from "fs"
import { registerFileLifecycle } from "@dmail/filesystem-watch"

const path = "/Users/you/folder/config.js"
let currentConfig = null
registerFileLifecycle(path, {
  added: () => {
    currentConfig = JSON.parse(String(readFileSync(path)))
  },
  updated: () => {
    currentConfig = JSON.parse(String(readFileSync(path)))
  },
  removed: () => {
    currentConfig = null
  },
})
```

— see [`registerFileLifecycle` documentation](./docs/register-file-lifecycle-doc.md)

## Installation

```console
npm install @dmail/filesystem-watch@2.4.0
```

## Why ?

I needed something capable to watch file changes on the filesystem.<br />

The documentation of fs.watch makes it clear that you cannot really use it directly because it has several limitations specific to the filesystem.<br />

Then I tried chokidar, a wrapper around fs.watch. However I could not fully understand what chokidar was doing under the hood.<br />

What I needed was small wrapper around fs.watch that do not shallow events sent by the operating system. Ultimately chokidar could maybe do what I need but it's a bit too big for my use case.

— see [fs.watch documentation](https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener)<br />
— see [chokidar on github](https://github.com/paulmillr/chokidar)
