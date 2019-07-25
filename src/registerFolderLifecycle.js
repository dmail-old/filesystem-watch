import { readdirSync } from "fs"
import {
  pathnameToRelativePathname,
  operatingSystemPathToPathname,
  pathnameToOperatingSystemPath,
} from "@jsenv/operating-system-path"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { createWatcher } from "./createWatcher.js"
import { trackRessources } from "./trackRessources.js"
import { filesystemPathToTypeOrNull } from "./filesystemPathToTypeOrNull.js"

/**
 * Here is the bug:
 * We receive a 'rename' event when a gile gets updated
 * not only when it gets created
 * (by the way we must also test deleting a file and see how it behaves)
 *
 * To fix this we must first visit the whole folder structure
 * to know the existing files
 * once we have this we can know if the file is added or juste updated
 * about removed I have to test it
 */

export const registerFolderLifecycle = async (
  path,
  { added, updated, removed, folderFilter = () => true, notifyExistent = false },
) => {
  const tracker = trackRessources()

  const contentMap = {}
  const topLevelFolderPathname = operatingSystemPathToPathname(path)
  const isLinux = operatingSystemIsLinux()

  const handleEvent = (relativePath) => {
    const entryPath = `${topLevelFolderPathname}${relativePath}`
    const previousType = contentMap[relativePath]
    const type = filesystemPathToTypeOrNull(entryPath)

    // it's something new
    if (!previousType) {
      if (type === null) return
      handleFolderEntryFound({ relativePath, type, existent: false })
      return
    }

    // it existed but now it's not here anymore
    if (type === null) {
      handleFolderEntryLost({ relativePath, type: previousType })
      return
    }

    // it existed but was replaced by something else
    // it's not really an update
    if (previousType !== type) {
      handleFolderEntryLost({ relativePath, type: previousType })
      handleFolderEntryFound({ relativePath, type })
      return
    }

    // right same type, and the file existed and was not deleted
    // it's likely an update ?
    // but are we sure it's an update ?
    if (updated) {
      updated({ relativePath, type })
    }
  }

  const handleFolderEntryFound = ({ relativePath, type, existent }) => {
    contentMap[relativePath] = type

    // linux does not support recursive option, we must watch
    // manually every directory we find
    if (isLinux && type === "directory") {
      const folderPathname = `${topLevelFolderPathname}${relativePath}`
      visitFolderRecursively({
        topLevelFolderPathname: folderPathname,
        folderFilter,
        entryFound: ({ relativePath: entryRelativePath, type: entryType }) => {
          handleFolderEntryFound({
            relativePath: `${relativePath}${entryRelativePath}`,
            type: entryType,
            existent: false,
          })
        },
      })

      const folderPath = pathnameToOperatingSystemPath(folderPathname)
      const watcher = createWatcher(folderPath, { persistent: false })
      tracker.registerCleanupCallback(() => {
        watcher.close()
      })
      watcher.on("change", (eventType, filename) => {
        if (!filename) return
        handleEvent(`${relativePath}${filename}`, eventType)
      })
    }

    if (added && (!existent || notifyExistent)) {
      added({ relativePath, type })
    }
  }

  const handleFolderEntryLost = ({ relativePath, type }) => {
    delete contentMap[relativePath]
    if (removed) {
      removed({ relativePath, type })
    }
  }

  visitFolderRecursively({
    topLevelFolderPathname,
    folderFilter,
    entryFound: ({ relativePath, type }) =>
      handleFolderEntryFound({ relativePath, type, existent: true }),
  })

  const watcher = createWatcher(path, { recursive: !isLinux, persistent: false })
  tracker.registerCleanupCallback(() => {
    watcher.close()
  })
  watcher.on("change", (eventType, filename) => {
    if (!filename) return
    handleEvent(`/${filename.replace(/\\/g, "/")}`, eventType)
  })

  return tracker.cleanup
}

const visitFolderRecursively = ({ topLevelFolderPathname, folderFilter, entryFound }) => {
  const visitFolder = (folderPathname) => {
    const folderPath = pathnameToOperatingSystemPath(folderPathname)

    readdirSync(folderPath).forEach((entry) => {
      const entryPathname = `${folderPathname}/${entry}`
      const entryPath = pathnameToOperatingSystemPath(entryPathname)
      const type = filesystemPathToTypeOrNull(entryPath)
      if (type === null) return

      const relativePath = pathnameToRelativePathname(entryPathname, topLevelFolderPathname)
      if (type === "directory" && !folderFilter(relativePath)) return

      entryFound({
        relativePath,
        type,
      })
    })
  }
  visitFolder(topLevelFolderPathname)
}
