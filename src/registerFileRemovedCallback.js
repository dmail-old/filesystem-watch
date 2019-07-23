import { watch } from "fs"
import { basename } from "path"
import { operatingSystemPathLeadsToActualFile } from "./operatingSystemPathLeadsToActualFile.js"

export const registerFileRemovedCallback = (path, callback) => {
  const watcher = watch(path, { persistent: false })

  watcher.on("change", async (eventType, fileBasename) => {
    if (eventType !== "rename") return
    if (fileBasename !== basename(path)) return

    const leadsToFile = await operatingSystemPathLeadsToActualFile(path)
    if (leadsToFile) return

    callback()
  })

  return () => {
    watcher.close()
  }
}
