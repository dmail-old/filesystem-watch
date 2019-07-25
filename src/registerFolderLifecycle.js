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

export const registerFolderLifecycle = async (
  path,
  { added, updated, removed, folderFilter = () => true, notifyExistent = false },
) => {
  const tracker = trackRessources()

  const contentMap = {}
  const topLevelFolderPathname = operatingSystemPathToPathname(path)
  // linux does not support recursive option
  const fsWatchSupportsRecursive = !operatingSystemIsLinux()

  const handleEvent = (relativePath) => {
    const entryPath = `${topLevelFolderPathname}${relativePath}`
    const previousType = contentMap[relativePath]
    const type = filesystemPathToTypeOrNull(entryPath)

    // it's something new
    if (!previousType) {
      if (type === null) return
      handleEntryFound({ relativePath, type, existent: false })
      return
    }

    // it existed but now it's not here anymore
    if (type === null) {
      handleEntryLost({ relativePath, type: previousType })
      return
    }

    // it existed but was replaced by something else
    // it's not really an update
    if (previousType !== type) {
      handleEntryLost({ relativePath, type: previousType })
      handleEntryFound({ relativePath, type })
      return
    }

    // a directory cannot really be updated in way that matters for us
    // filesystem is trying to tell us the directory content have changed
    // but we don't care about that
    // we'll already be notified about what has changed
    if (type === "directory") return

    // right same type, and the file existed and was not deleted
    // it's likely an update ?
    // but are we sure it's an update ?
    if (updated) {
      updated({ relativePath, type })
    }
  }

  const handleEntryFound = ({ relativePath, type, existent }) => {
    contentMap[relativePath] = type
    if (added && (!existent || notifyExistent)) {
      added({ relativePath, type })
    }

    // we must watch manually every directory we find
    if (!fsWatchSupportsRecursive && type === "directory") {
      const folderPathname = `${topLevelFolderPathname}${relativePath}`
      visitFolderRecursively({
        topLevelFolderPathname: folderPathname,
        folderFilter: (subfolderRelativePath) => {
          return folderFilter(`${relativePath}${subfolderRelativePath}`)
        },
        entryFound: (entry) => {
          handleEntryFound({
            relativePath: `${relativePath}${entry.relativePath}`,
            type: entry.type,
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
        handleEvent(`${relativePath}/${filename}`, eventType)
      })
    }
  }

  const handleEntryLost = ({ relativePath, type }) => {
    delete contentMap[relativePath]
    if (removed) {
      removed({ relativePath, type })
    }
  }

  visitFolderRecursively({
    topLevelFolderPathname,
    folderFilter,
    entryFound: ({ relativePath, type }) =>
      handleEntryFound({ relativePath, type, existent: true }),
  })

  const watcher = createWatcher(path, {
    recursive: fsWatchSupportsRecursive,
    persistent: false,
  })
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
