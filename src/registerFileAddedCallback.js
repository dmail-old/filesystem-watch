import { watch } from "fs"

export const registerFileAddedCallback = (path) => {
  const watcher = watch(path, { recursive: true, persistent: false })

  watcher.on("change", async (eventType, fileBasename) => {
    if (eventType !== "rename") return
  })

  return () => {
    watcher.close()
  }
}
