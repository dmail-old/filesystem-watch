import { filesystemPathToTypeOrNull } from "./filesystemPathToTypeOrNull.js"
import { createWatcher } from "./createWatcher.js"
import { watchFileCreation } from "./folder-watching.js"
import { trackRessources } from "./trackRessources.js"

export const registerFileLifecycle = (
  path,
  { added, updated, removed, notifyExistent = false },
) => {
  if (typeof path !== "string") {
    throw new TypeError(`path must be a string, got ${path}`)
  }
  if (!undefinedOrFunction(added)) {
    throw new TypeError(`added must be a function or undefined, got ${added}`)
  }
  if (!undefinedOrFunction(updated)) {
    throw new TypeError(`updated must be a function or undefined, got ${updated}`)
  }
  if (!undefinedOrFunction(removed)) {
    throw new TypeError(`removed must be a function or undefined, got ${removed}`)
  }

  const tracker = trackRessources()

  const handleFileFound = ({ existent }) => {
    const fileMutationStopWatching = watchFileMutation(path, {
      updated,
      removed: () => {
        fileMutationStopTracking()
        watchFileAdded()
        if (removed) {
          removed()
        }
      },
    })
    const fileMutationStopTracking = tracker.registerCleanupCallback(fileMutationStopWatching)

    if (added) {
      if (existent) {
        if (notifyExistent) {
          added({ existent: true })
        }
      } else {
        added({})
      }
    }
  }

  const watchFileAdded = () => {
    const fileCreationStopWatching = watchFileCreation(path, () => {
      fileCreationgStopTracking()
      handleFileFound({ existent: false })
    })
    const fileCreationgStopTracking = tracker.registerCleanupCallback(fileCreationStopWatching)
  }

  const type = filesystemPathToTypeOrNull(path)
  if (type === "file") {
    handleFileFound({ existent: true })
  } else if (type === null) {
    if (added) {
      watchFileAdded()
    } else {
      throw new Error(createMissingFileMessage({ path }))
    }
  } else {
    throw new Error(createUnexpectedStatsTypeMessage({ type, path }))
  }

  return tracker.cleanup
}

const undefinedOrFunction = (value) => typeof value === "undefined" || typeof value === "function"

const watchFileMutation = (path, { updated, removed }) => {
  let watcher = createWatcher(path, { persistent: false })

  watcher.on("change", () => {
    const type = filesystemPathToTypeOrNull(path)
    if (type === null) {
      watcher.close()
      watcher = undefined
      if (removed) {
        removed()
      }
    } else if (type === "file") {
      if (updated) {
        updated()
      }
    }
  })

  return () => {
    if (watcher) {
      watcher.close()
    }
  }
}

const createUnexpectedStatsTypeMessage = ({
  type,
  path,
}) => `path must lead to a file, found ${type} instead.
path: ${path}`

const createMissingFileMessage = ({ path }) => `path must lead to a file, found nothing.
path: ${path}`
