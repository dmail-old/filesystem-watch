import { watch } from "fs"
import { sep } from "path"
import { pathnameToRelativePathname } from "@jsenv/operating-system-path"
import { readFolder } from "./readFolder.js"
import { readStats } from "./readStats.js"

export const registerFolderLifecycle = async (path, { added }) => {
  const onChange = async (eventType, filename) => {
    if (eventType !== "rename") return

    const entryPath = `${path}${sep}${filename}`
    try {
      const stats = await readStats(entryPath)
      if (stats.isFile()) {
        const relativePath = `/${filename.replace(/\\/g, "/")}`
        callback({ relativePath })
      }
    } catch (e) {
      if (e.code === "ENOENT") return
      throw e
    }
  }

  // linux does not support recursive option
  if (process.platform === "linux") {
    const watcherArray = []

    const watchDirectory = async (directoryPath, callback) => {
      const watcher = watch(directoryPath, { persistent: false })

      watcher.on("change", async (eventType, filename) => {
        if (eventType !== "rename") return

        const entryPath = `${directoryPath}/${filename}`
        const stats = await readStats(entryPath)
        if (stats.isDirectory()) {
          watchDirectory(entryPath)
        } else {
          onChange("rename", computeFilename(filename))
        }
      })

      watcherArray.push(watcher)

      const computeFilename = (filename) => {
        if (directoryPath === path) return filename
        return `${pathnameToRelativePathname(directoryPath, path).slice(1)}/${filename}`
      }

      const visitEntries = async () => {
        const entryArray = await readFolder(directoryPath)
        await Promise.all(
          entryArray.map(async (entry) => {
            const entryPath = `${directoryPath}/${entry}`
            const stats = await readStats(entryPath)
            if (stats.isDirectory()) {
              watchDirectory(entryPath, callback)
            } else if (stats.isFile()) {
              onChange("rename", computeFilename(entry))
            }
          }),
        )
      }
      visitEntries()

      return () => {
        watcherArray.forEach((watcher) => watcher.close())
      }
    }

    return watchDirectory(path)
  }

  const watcher = watch(path, { recursive: true, persistent: false })
  watcher.on("change", onChange)
  return () => {
    watcher.close()
  }
}
