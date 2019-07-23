import { dirname, sep } from "path"
import { watchFile } from "./watchFile.js"
import { operatingSystemPathLeadsToActualFile } from "./operatingSystemPathLeadsToActualFile.js"

export const registerFileMovedCallback = (path, callback) => {
  return watchFile(path, async (eventType, newBasename) => {
    if (eventType !== "rename") return

    // on macOS you receive newBasename 'foo-2.js'
    // even if the file was moved into '/folder/foo-2.js'
    const newPath = `${dirname(path)}${sep}${newBasename}`
    const leadsToFile = await operatingSystemPathLeadsToActualFile(newPath)
    if (!leadsToFile) return

    callback({ newPath })
  })
}
