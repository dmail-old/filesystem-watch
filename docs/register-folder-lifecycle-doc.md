# registerFolderLifecycle documentation

Document `registerFolderLifecycle` function.

## fs.watch on folder caveats

Everywhere:

- Writing a file emits a `change` as chunk gets written in the file.
- Trigger `change` on folder when something inside folder changes

On mac:

- Trigger `rename` instead of `change` when updating a file

On linux:

- recursive option not supported

On windows:

- removing a file emit `rename` with `filename` being `null`
- removing a watched folder throw with EPERM error
