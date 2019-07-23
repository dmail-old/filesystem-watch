import { dirname, basename, sep } from "path"
import { watch } from "fs"
import { readFileModificationDate } from "./readFileModificationDate.js"
import { readStats } from "./readStats.js"

export const registerFileLifecycle = (
  path,
  {
    // it would be cool to support addedCallback here
    // but I have no use case for now and it would be complex to do because
    // we could have to catch ENOENT on watcher
    // and fallback to watching parent directory for file creation
    // and reinstall a watcher on removal
    // addedCallback,
    modifiedCallback,
    movedCallback,
    removedCallback,
  },
) => {
  const watcher = watch(path, { persistent: false })

  let lastKnownModificationDate
  const initialModificationDatePromise = readFileModificationDate(path)

  const onChange = (eventType, filename) => {
    if (eventType === "change") {
      handleModified()
    } else if (eventType === "rename") {
      handleRenameEvent(filename)
    }
  }

  watcher.on("change", onChange)

  const handleRenameEvent = async (filename) => {
    if (!movedCallback && !removedCallback) return

    if (!filename || filename === basename(path)) {
      handleRemoved(filename)
    } else {
      handleMoved(filename)
    }
  }

  const handleModified = async () => {
    if (!modifiedCallback) return

    const [previousModificationDate, modificationDate] = await Promise.all([
      lastKnownModificationDate || initialModificationDatePromise,
      readFileModificationDate(path),
    ])
    lastKnownModificationDate = modificationDate
    // be sure we are not wrongly notified
    // I don't remember how it can happen
    // but it happens
    if (Number(previousModificationDate) === Number(modificationDate)) return

    modifiedCallback({ modificationDate })
  }

  const handleRemoved = async () => {
    if (!removedCallback) return

    // ensure once the file is considered as removed, watcher is closed
    watcher.close()
    removedCallback()
    // try {
    //   await readStats(path)
    //   watcher.on("change", onChange)
    // } catch (error) {
    //   if (error.code !== "ENOENT") throw error

    // }
  }

  const handleMoved = async (newBasename) => {
    if (!movedCallback) return

    // on macos newBasename can be `foo.js` even if the file
    // is actually moved to `folder/foo.js`
    // we check if `foo.js` file exists
    // so that we support case where file are moved inside a directory.
    // it works because rename event would only be fired in case
    // a file is removed so the file would not exists in that case

    const newPath = `${dirname(path)}${sep}${newBasename}`

    let exists
    try {
      await readStats(newPath)
      exists = true
    } catch (error) {
      if (error.code !== "ENOENT") throw error
      exists = false
    }

    if (exists) {
      movedCallback({ newPath })
    } else if (removedCallback) {
      removedCallback()
    }
  }

  return () => {
    watcher.close()
  }
}
