# registerFolderLifecycle documentation

Document `registerFolderLifecycle` function.

## `registerFolderLifecycle` options

### added, updated, removed

```js
import { registerFolderLifecycle } from "@dmail/filesystem-watch"

registerFolderLifecycle(`/Users/you/folder`, {
  added: ({ relativePath, type }) => {
    console.log(`${type} added at ${relativePath}`)
  },
  updated: ({ relativePath, type }) => {
    console.log(`${type} updated at ${relativePath}`)
  },
  removed: ({ relativePath, type }) => {
    console.log(`${type} removed at ${relativePath}`)
  },
})
```

- `added` will be called after something new is created inside the folder.
- `updated` will be called after a file gets updated inside the folder.
- `removed` will be called after something is removed inside the folder.

Usually, filesystem takes less than 100ms to notify us something has changed.<br />
`relativePath` is a string starting with `/` relative to the folder.<br />
`type` gives you what type of filesystem ressource was `added` or `updated` or `removed`.<br />

You can use some constants to differentiate files for instance

```js
import { registerFolderLifecycle, FILESYSTEM_FILE } from "@dmail/filesystem-watch"

registerFolderLifecycle(`/Users/you/folder`, {
  added: ({ type }) => {
    if (type === FILESYSTEM_FILE) {
      console.log("a file was added")
    } else {
      console.log("something was added")
    }
  },
})
```

If you're interested only by a subset of `added`, `updated`, `removed`, pass `undefined` or nothing for other options.<br />
Prefer `undefined` over an empty function so that we know you're not interested by `added`, `updated` or `removed`. It allows some internal optimizations.

### watchDescription

```js
import { registerFolderLifecycle } from "@dmail/filesystem-watch"

registerFolderLifecycle(`/Users/you/folder`, {
  watchDescription: {
    "/**/*": false,
    "/**/.cache/": false,
    "/**/*.js": true,
  },
  removed: ({ relativePath, type }) => {
    console.log(`${type} removed at ${relativePath}`)
  },
})
```

`watchDescription` will be used to know what should be watched and is allowed to call `added`, `updated`, `removed`.<br />
The example above means:

- `.cache` folder are not watched
- only files ending by `.js` can trigger calls to `added`, `updated` or `removed`.

`watchDescription` uses path matching provided by `dmail/project-structure`.<br />
— see [project structure on github](https://github.com/dmail/project-structure)

If you don't pass this option, the default value will be:

```js
{
  "/**/*": true
}
```

### notifyExistent

```js
import { registerFolderLifecycle } from "@dmail/filesystem-watch"

registerFolderLifecycle(`/Users/you/folder`, {
  notifyExistent: true,
  added: ({ relativePath, type, existent }) => {
    if (existent) {
      console.log(`existing ${type} found at ${relativePath}`)
    } else {
      console.log(`${type} added at ${relativePath}`)
    }
  },
})
```

`notifyExistent` controls if `added` will be called with existing folder structure.<br />

If you don't pass this option, the default value will be:

```js
false
```
