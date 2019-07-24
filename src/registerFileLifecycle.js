import { watch, statSync, existsSync } from "fs"
import { watchFileCreation } from "./folder-watching.js"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { readFileModificationDate } from "./readFileModificationDate.js"
import { statsToType } from "./statsToType.js"
import { trackRessources } from "./trackRessources.js"

export const registerFileLifecycle = (
  path,
  { added, updated, removed, callAddedWhenFileAlreadyExists = false },
) => {
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

  const fileExistsCallback = ({ alreadyExists }) => {
    let updateCallback
    if (updated) {
      let lastKnownModificationDate = readFileModificationDate(path)

      updateCallback = () => {
        const previousModificationDate = lastKnownModificationDate
        const modificationDate = readFileModificationDate(path)
        lastKnownModificationDate = modificationDate
        // be sure we are not wrongly notified
        // I don't remember how it can happen
        // but it happens
        if (Number(previousModificationDate) === Number(modificationDate)) return

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

    if (added) {
      if (alreadyExists && !callAddedWhenFileAlreadyExists) return
      added()
    }
  }

  try {
    const stats = statSync(path)
    const type = statsToType(stats)
    if (type === "file") {
      fileExistsCallback({ alreadyExists: true })
    } else {
      throw new Error(createUnexpectedStatsTypeMessage({ type, path }))
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      if (added) {
        const fileCreationStopWatching = watchFileCreation(path, () => {
          fileCreationgStopTracking()
          fileExistsCallback({ alreadyExists: false })
        })
        const fileCreationgStopTracking = tracker.registerCleanupCallback(fileCreationStopWatching)
      } else {
        throw new Error(createMissingFileMessage({ path }))
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
      if (update) {
        if (operatingSystemIsLinux() && !existsSync(path)) return
        update()
      }
    } else if (eventType === "rename") {
      watcher.close()
      watcher = undefined
      if (remove) {
        remove()
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
