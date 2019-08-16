import { watch, open, close } from "fs"
import { promisify } from "util"
import { operatingSystemIsWindows } from "./operatingSystemTypes.js"

const openAsync = promisify(open)
const closeAsync = promisify(close)

export const createWatcher = (path, options) => {
  const watcher = watch(path, options)
  fixPermissionIssueIfWindows(watcher, path)
  return watcher
}

const fixPermissionIssueIfWindows = (watcher, path) => {
  if (operatingSystemIsWindows()) {
    watcher.on("error", async (error) => {
      // https://github.com/joyent/node/issues/4337
      if (error.code === "EPERM") {
        try {
          const fd = await openAsync(path, "r")
          await closeAsync(fd)
          console.error(error)
        } catch (error) {}
      }
    })
  }
}
