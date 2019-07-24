import { sep } from "path"
import { statSync, readdirSync } from "fs"
import { pathnameToRelativePathname } from "@jsenv/operating-system-path"
import { operatingSystemIsLinux } from "./operatingSystemTypes.js"
import { createWatcher } from "./createWatcher.js"
import { trackRessources } from "./trackRessources.js"
import { filesystemPathToTypeOrNull } from "./filesystemPathToTypeOrNull.js"

export const registerFolderLifecycle = async (path, { added }) => {
  const tracker = trackRessources()

  const onChange = async (eventType, filename) => {
    if (!filename) return
    if (eventType !== "rename") return

    const entryPath = `${path}${sep}${filename}`
    const type = filesystemPathToTypeOrNull(entryPath)
    if (type === null) return

    const relativePath = `/${filename.replace(/\\/g, "/")}`
    added({ relativePath, type })
  }

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
        if (stats.isDirectory()) {
          watchDirectory(entryPath, true)
        } else {
          onChange("rename", computeFilename(filename))
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
        if (stats.isDirectory()) {
          watchDirectory(entryPath)
        } else if (!nested) {
          onChange("rename", computeFilename(entry))
        }
      })
    }

    watchDirectory(path)
  } else {
    const watcher = createWatcher(path, { recursive: true, persistent: false })
    tracker.registerCleanupCallback(() => {
      watcher.close()
    })
  }

  return tracker.cleanup
}
