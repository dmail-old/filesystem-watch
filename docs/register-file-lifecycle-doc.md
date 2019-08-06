# registerFileLifecycle documentation

Document `registerFileLifecycle` function.<br />

## fs.watch on file caveats

TODO

## `registerFileLifecycle` options

### added, updated, removed

```js
import { registerFileLifecycle } from "@dmail/filesystem-watch"

const path = `/Users/you/folder/file.js`
registerFileLifecycle(path, {
  added: () => {
    console.log(`file added`)
  },
  updated: () => {
    console.log(`file updated`)
  },
  removed: () => {
    console.log(`file removed`)
  },
})
```

- `added` will be called after file is added on your filesystem.
- `updated` will be called after file content or attributes like modification date has changed on your filesystem.
- `removed` will be called after file is removed from your filesystem.

Usually, filesystem takes less than 100ms to notify us something has changed.<br />

If you're interested only by a subset of `added`, `updated`, `removed`, pass `undefined` or nothing for other options.<br />
Prefer `undefined` over an empty function so that we know you're not interested by `added`, `updated` or `removed`. It allows some internal optimizations.

### notifyExistent

```js
import { registerFileLifecycle } from "@dmail/filesystem-watch"

const path = `/Users/you/folder/file.js`
registerFileLifecycle(path, {
  notifyExistent: true,
  added: ({ existent }) => {
    if (existent) {
      console.log(`existing file found`)
    } else {
      console.log(`file added`)
    }
  },
})
```

`notifyExistent` controls if `added` is immediatly called if file already exists.<br />

If you don't pass this option, the default value will be:

```js
false
```
