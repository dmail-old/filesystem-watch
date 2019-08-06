import { dirname, basename } from "path"
import { createWatcher } from "./createWatcher.js"
import { filesystemPathToTypeOrNull } from "./filesystemPathToTypeOrNull.js"

export const watchFileCreation = (path, callback) => {
  const parentPath = dirname(path)
  let parentWatcher = createWatcher(parentPath, { persistent: false })
  parentWatcher.on("change", (eventType, filename) => {
    if (filename && filename !== basename(path)) return

    const type = filesystemPathToTypeOrNull(path)
    // ignore if something else with that name gets created
    // we are only interested into files
    if (type !== "file") return

    parentWatcher.close()
    parentWatcher = undefined
    callback()
  })

  return () => {
    if (parentWatcher) {
      parentWatcher.close()
    }
  }
}
