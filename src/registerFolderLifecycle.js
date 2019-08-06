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
    if (dirname && basename) {
      handleChange(`/${dirname}/${basename}`)
    } else if (basename) {
      handleChange(`/${basename}`)
    } else if (dirname && removed && eventType === "rename") {
      // we might receive `rename` event without filename
      // when a file is removed.
      // in that case, if we are interested by removals
      // we check what file was removed
      // note: it's pretty expensive to do that on large folders
      // this is to fix windows emitting null on file removal
      // https://github.com/joyent/libuv/issues/1479

      const removedEntryRelativePath = Object.keys(contentMap).find((relativePath) => {
        const directoryPath = `/${dirname}`

        // entry not inside this directory
        if (!relativePath.startsWith(directoryPath)) return false

        const afterDirectory = relativePath.slice(directoryPath.length + 1)
        // deep inside this directory
        if (afterDirectory.includes("/")) return false

        const type = filesystemPathToTypeOrNull(
          pathnameToOperatingSystemPath(`${directoryPath}/${afterDirectory}`),
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

    if (added && (!existent || notifyExistent)) {
      added({ relativePath, type })
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
