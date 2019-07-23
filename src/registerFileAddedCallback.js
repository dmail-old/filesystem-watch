import { watch } from "fs"
import { sep } from "path"
import { fileMakeDirname } from "@dmail/helper"
import { readStats } from "./readStats.js"

export const registerFileAddedCallback = async (path, callback) => {
  await fileMakeDirname(`${path}/whatever`)

  const watcher = watch(path, { recursive: true, persistent: false })

  watcher.on("change", async (eventType, filename) => {
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
  })

  return () => {
    watcher.close()
  }
}
