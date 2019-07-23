import { watch } from "fs"
import { dirname, sep } from "path"
import { operatingSystemPathLeadsToActualFile } from "./operatingSystemPathLeadsToActualFile.js"

export const registerFileMovedCallback = (path, callback) => {
  const watcher = watch(path, { persistent: false })

  watcher.on("change", async (eventType, newBasename) => {
    if (eventType !== "rename") return

    // on macOS you receive newBasename 'foo-2.js'
    // even if the file was moved into '/folder/foo-2.js'
    const newPath = `${dirname(path)}${sep}${newBasename}`
    const leadsToFile = await operatingSystemPathLeadsToActualFile(newPath)
    if (!leadsToFile) return

    callback({ newPath })
  })

  return () => {
    watcher.close()
  }
}
