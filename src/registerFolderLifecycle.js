import { readdirSync } from "fs"
import {
  pathnameToRelativePathname,
  operatingSystemPathToPathname,
  pathnameToOperatingSystemPath,
} from "@jsenv/operating-system-path"
import {
  namedValueDescriptionToMetaDescription,
  pathnameCanContainsMetaMatching,
  pathnameToMeta,
} from "@dmail/project-structure"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { createWatcher } from "./createWatcher.js"
import { trackRessources } from "./trackRessources.js"
import { filesystemPathToTypeOrNull } from "./filesystemPathToTypeOrNull.js"

// linux does not support recursive option
const fsWatchSupportsRecursive = !operatingSystemIsLinux()
export const registerFolderLifecycle = (
  path,
  { added, updated, removed, watchDescription = { "/**/*": true }, notifyExistent = false },
) => {
  if (!undefinedOrFunction(added)) {
    throw new TypeError(`added must be a function or undefined, got ${added}`)
  }
  if (!undefinedOrFunction(added)) {
    throw new TypeError(`updated must be a function or undefined, got ${updated}`)
  }
  if (!undefinedOrFunction(removed)) {
    throw new TypeError(`removed must be a function or undefined, got ${removed}`)
  }

  const metaDescription = namedValueDescriptionToMetaDescription({
    watch: watchDescription,
  })
  const entryShouldBeWatched = ({ relativePath, type }) => {
    if (type === "directory") {
      const canContainEntryToWatch = pathnameCanContainsMetaMatching({
        pathname: relativePath,
        metaDescription,
        predicate: ({ watch }) => watch,
      })
      return canContainEntryToWatch
    }

    const entryMeta = pathnameToMeta({
      pathname: relativePath,
      metaDescription,
    })

    return entryMeta.watch
  }

  const tracker = trackRessources()

  const contentMap = {}
  const folderPathname = operatingSystemPathToPathname(path)

  const handleEvent = ({ dirname, basename, eventType }) => {
    if (basename) {
      if (dirname) {
        handleChange(`/${dirname}/${basename}`)
      } else {
        handleChange(`/${basename}`)
      }
    } else if ((removed || added) && eventType === "rename") {
      // we might receive `rename` without filename
      // in that case we try to find ourselves which file was removed.

      let relativePathCandidateArray = Object.keys(contentMap)

      if (!fsWatchSupportsRecursive) {
        relativePathCandidateArray = relativePathCandidateArray.filter((relativePath) => {
          if (!dirname) {
            // ensure entry is top level
            if (relativePath.slice(1).includes("/")) return false
            return true
          }

          const directoryPath = `/${dirname}`

          // entry not inside this directory
          if (!relativePath.startsWith(directoryPath)) return false

          const afterDirectory = relativePath.slice(directoryPath.length + 1)
          // deep inside this directory
          if (afterDirectory.includes("/")) return false

          return true
        })
      }

      const removedEntryRelativePath = relativePathCandidateArray.find((relativePathCandidate) => {
        const type = filesystemPathToTypeOrNull(
          pathnameToOperatingSystemPath(`${folderPathname}${relativePathCandidate}`),
        )
        if (type !== null) {
          return false
        }
        return true
      })

      if (removedEntryRelativePath) {
        handleEntryLost({
          relativePath: removedEntryRelativePath,
          type: contentMap[removedEntryRelativePath],
        })
      }
    }
  }

  const handleChange = (relativePath) => {
    const entryPathname = `${folderPathname}${relativePath}`
    const entryPath = pathnameToOperatingSystemPath(entryPathname)
    const previousType = contentMap[relativePath]
    const type = filesystemPathToTypeOrNull(entryPath)

    if (!entryShouldBeWatched({ relativePath, type })) {
      return
    }

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
    if (!entryShouldBeWatched({ relativePath, type })) return

    contentMap[relativePath] = type

    const entryPathname = `${folderPathname}${relativePath}`

    if (type === "directory") {
      visitFolder({
        folderPathname: entryPathname,
        entryFound: (entry) => {
          handleEntryFound({
            relativePath: `${relativePath}${entry.relativePath}`,
            type: entry.type,
            existent,
          })
        },
      })
    }

    if (added) {
      if (existent) {
        if (notifyExistent) {
          added({ relativePath, type, existent: true })
        }
      } else {
        added({ relativePath, type })
      }
    }

    // we must watch manually every directory we find
    if (!fsWatchSupportsRecursive && type === "directory") {
      const entryPath = pathnameToOperatingSystemPath(entryPathname)
      const watcher = createWatcher(entryPath, { persistent: false })
      tracker.registerCleanupCallback(() => {
        watcher.close()
      })
      watcher.on("change", (eventType, filename) => {
        handleEvent({
          dirname: relativePath.slice(1),
          basename: filename ? filename.replace(/\\/g, "/") : "",
          eventType,
        })
      })
    }
  }

  const handleEntryLost = ({ relativePath, type }) => {
    delete contentMap[relativePath]
    if (removed) {
      removed({ relativePath, type })
    }
  }

  visitFolder({
    folderPathname,
    entryFound: ({ relativePath, type }) => {
      handleEntryFound({ relativePath, type, existent: true })
    },
  })

  const watcher = createWatcher(path, {
    recursive: fsWatchSupportsRecursive,
    persistent: false,
  })
  tracker.registerCleanupCallback(() => {
    watcher.close()
  })
  watcher.on("change", (eventType, filename) => {
    handleEvent({
      ...pathToDirnameAndBasename(filename),
      eventType,
    })
  })

  return tracker.cleanup
}

const undefinedOrFunction = (value) => typeof value === "undefined" || typeof value === "function"

const visitFolder = ({ folderPathname, entryFound }) => {
  const folderPath = pathnameToOperatingSystemPath(folderPathname)

  readdirSync(folderPath).forEach((entry) => {
    const entryPathname = `${folderPathname}/${entry}`
    const entryPath = pathnameToOperatingSystemPath(entryPathname)
    const type = filesystemPathToTypeOrNull(entryPath)
    if (type === null) return

    const relativePath = pathnameToRelativePathname(entryPathname, folderPathname)

    entryFound({
      relativePath,
      type,
    })
  })
}

const pathToDirnameAndBasename = (path) => {
  if (!path) {
    return {
      dirname: "",
      basename: "",
    }
  }

  const normalizedPath = path.replace(/\\/g, "/")
  const slashLastIndex = normalizedPath.lastIndexOf("/")

  if (slashLastIndex === -1) {
    return {
      dirname: "",
      basename: normalizedPath,
    }
  }

  const dirname = normalizedPath.slice(0, slashLastIndex)
  const basename = normalizedPath.slice(slashLastIndex + 1)

  return {
    dirname,
    basename,
  }
}
