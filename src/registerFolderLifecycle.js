import { sep } from "path"
import { statSync, readdirSync } from "fs"
import { pathnameToRelativePathname } from "@jsenv/operating-system-path"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { createWatcher } from "./createWatcher.js"
import { trackRessources } from "./trackRessources.js"
import { statsToType } from "./statsToType.js"
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

export const registerFolderLifecycle = async (path, { added, folderPredicate = () => true }) => {
  const tracker = trackRessources()

  // linux does not support recursive option
  if (operatingSystemIsLinux()) {
    const watchDirectory = async (directoryPath, nested = false) => {
      const isRootDirectory = directoryPath === path
      const watcher = createWatcher(directoryPath, { persistent: false })

      watcher.on("change", async (eventType, filename) => {
        if (!filename) return
        if (eventType !== "rename") return

        const entryPath = `${directoryPath}/${filename}`
        const stats = statSync(entryPath)
        const type = statsToType(stats)
        if (type === null) return

        const relativePath = `/${computeFilename(filename)}`
        if (type === "directory" && !folderPredicate(relativePath)) return
        added({ relativePath, type })
        if (type === "directory") {
          watchDirectory(entryPath, true)
        }
      })

      tracker.registerCleanupCallback(() => {
        watcher.close()
      })

      const computeFilename = (filename) => {
        if (isRootDirectory) return filename
        return `${pathnameToRelativePathname(directoryPath, path).slice(1)}/${filename}`
      }

      readdirSync(directoryPath).forEach((entry) => {
        const entryPath = `${directoryPath}/${entry}`
        const stats = statSync(entryPath)
        const type = statsToType(stats)

        if (type === null) return

        const relativePath = `/${computeFilename(entry)}`
        if (type === "directory" && !folderPredicate(relativePath)) return

        if (!nested) {
          added({ relativePath, type })
        }
        if (type === "directory") {
          watchDirectory(entryPath, true)
        }
      })
    }

    watchDirectory(path)
  } else {
    const watcher = createWatcher(path, { recursive: true, persistent: false })
    tracker.registerCleanupCallback(() => {
      watcher.close()
    })
    watcher.on("change", (eventType, filename) => {
      if (!filename) return
      if (eventType !== "rename") return

      const entryPath = `${path}${sep}${filename}`
      const type = filesystemPathToTypeOrNull(entryPath)
      if (type === null) return

      const relativePath = `/${filename.replace(/\\/g, "/")}`
      if (type === "directory" && !folderPredicate(relativePath)) return

      added({ relativePath, type })
    })
  }

  return tracker.cleanup
}
