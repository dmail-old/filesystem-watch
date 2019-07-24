import { dirname, basename, sep } from "path"
import { watch, statSync } from "fs"
import { readFileModificationDate } from "./readFileModificationDate.js"
import { statsToType } from "./statsToType.js"
import { trackRessources } from "./trackRessources.js"

export const registerFileLifecycle = (path, { added, updated, removed }) => {
  if (added && typeof added !== "function") {
    throw new TypeError(`added must be a function, got ${added}`)
  }
  if (updated && typeof updated !== "function") {
    throw new TypeError(`updated must be a function, got ${updated}`)
  }
  if (removed && typeof removed !== "function") {
    throw new TypeError(`removed must be a function, got ${removed}`)
  }

  const tracker = trackRessources()

  let registered = true
  tracker.registerCleanupCallback(() => {
    registered = false
  })

  const fileExistsCallback = () => {
    let updateCallback
    if (updated) {
      let lastKnownModificationDate
      const initialModificationDatePromise = readFileModificationDate(path)

      updateCallback = async () => {
        const [previousModificationDate, modificationDate] = await Promise.all([
          lastKnownModificationDate || initialModificationDatePromise,
          readFileModificationDate(path),
        ])
        lastKnownModificationDate = modificationDate
        // be sure we are not wrongly notified
        // I don't remember how it can happen
        // but it happens
        if (Number(previousModificationDate) === Number(modificationDate)) return

        // in case we are not interested anymore, don't call updated
        if (!registered) return

        updated({ modificationDate })
      }
    }

    let removeCallback
    if (removed) {
      removeCallback = removed
    }

    const fileMutationStopWatching = watchFileMutation(path, {
      update: updateCallback,
      remove: () => {
        fileMutationStopTracking()
        if (removeCallback) removeCallback()
      },
    })
    const fileMutationStopTracking = tracker.registerCleanupCallback(fileMutationStopWatching)
    added()
  }

  try {
    const stats = statSync(path)
    const type = statsToType(stats)
    if (type === "file") {
      fileExistsCallback()
    } else {
      throw new Error(createUnexpectedStatsTypeMessage({ type, path }))
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      if (added) {
        const fileCreationStopWatching = watchFileCreation(path, () => {
          fileCreationgStopTracking()
          fileExistsCallback()
        })
        const fileCreationgStopTracking = tracker.registerCleanupCallback(fileCreationStopWatching)
      } else {
        throw createMissingFileMessage({ path })
      }
    } else {
      throw error
    }
  }

  return tracker.cleanup
}

const watchFileMutation = (path, { update, remove }) => {
  let watcher = watch(path, { persistent: false })

  watcher.on("change", (eventType) => {
    if (eventType === "change") {
      update()
    } else if (eventType === "rename") {
      watcher.close()
      watcher = undefined
      remove()
    }
  })

  return () => {
    if (watcher) {
      watcher.close()
    }
  }
}

const watchFileCreation = (path, callback) => {
  const parentPath = dirname(path)
  let parentWatcher = watch(parentPath, { persistent: false })
  parentWatcher.on("change", (eventType, filename) => {
    if (eventType !== "rename") return

    if (filename !== basename(path)) return

    const stats = statSync(path)
    const type = statsToType(stats)

    // ignore if something else with that name gets created
    // we are only interested into files
    if (type !== "file") return

    parentWatcher.close()
    parentWatcher = undefined
    callback()
  })

  return () => {
    if (parentWatcher) {
      parentWatcher.close()
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
