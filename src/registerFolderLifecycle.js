import { sep } from "path"
import { statSync, readdirSync } from "fs"
import { pathnameToRelativePathname } from "@jsenv/operating-system-path"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { createWatcher } from "./createWatcher.js"
import { trackRessources } from "./trackRessources.js"
import { statsToType } from "./statsToType.js"
import { filesystemPathToTypeOrNull } from "./filesystemPathToTypeOrNull.js"

export const registerFolderLifecycle = async (path, { added }) => {
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
        if (type) {
          added({ relativePath: `/${computeFilename(filename)}`, type })
          if (type === "directory") {
            watchDirectory(entryPath, true)
          }
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
        if (type) {
          if (!nested) {
            added({ relativePath: `/${computeFilename(entry)}`, type })
          }
          if (type === "directory") {
            watchDirectory(entryPath, true)
          }
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
      added({ relativePath, type })
    })
  }

  return tracker.cleanup
}
