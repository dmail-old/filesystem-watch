import { statSync, existsSync } from "fs"
import { createWatcher } from "./createWatcher.js"
import { watchFileCreation } from "./folder-watching.js"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { statsToType } from "./statsToType.js"
import { trackRessources } from "./trackRessources.js"

export const registerFileLifecycle = (
  path,
  { added, updated, removed, notifyExistent = false },
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

  const fileExistsCallback = ({ existent }) => {
    const fileMutationStopWatching = watchFileMutation(path, {
      updated,
      removed: () => {
        fileMutationStopTracking()
        if (removed) {
          removed()
        }
      },
    })
    const fileMutationStopTracking = tracker.registerCleanupCallback(fileMutationStopWatching)

    if (added) {
      if (existent && !notifyExistent) return
      added()
    }
  }

  try {
    const stats = statSync(path)
    const type = statsToType(stats)
    if (type === "file") {
      fileExistsCallback({ existent: true })
    } else {
      throw new Error(createUnexpectedStatsTypeMessage({ type, path }))
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      if (added) {
        const fileCreationStopWatching = watchFileCreation(path, () => {
          fileCreationgStopTracking()
          fileExistsCallback({ existent: false })
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

const watchFileMutation = (path, { updated, removed }) => {
  let watcher = createWatcher(path, { persistent: false })

  watcher.on("change", (eventType) => {
    if (eventType === "change") {
      if (updated) {
        if (operatingSystemIsLinux() && !existsSync(path)) return
        updated()
      }
    } else if (eventType === "rename") {
      watcher.close()
      watcher = undefined
      if (removed) {
        removed()
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
