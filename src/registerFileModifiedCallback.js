import { watch } from "fs"
import { readFileModificationDate } from "./readFileModificationDate.js"

export const registerFileModifiedCallback = (path, callback) => {
  const watcher = watch(path, { persistent: false })

  let lastKnownModificationDate
  const initialModificationDatePromise = readFileModificationDate(path)

  watcher.on("change", async (eventType) => {
    if (eventType !== "change") return

    const [previousModificationDate, modificationDate] = await Promise.all([
      lastKnownModificationDate || initialModificationDatePromise,
      readFileModificationDate(path),
    ])
    lastKnownModificationDate = modificationDate
    // be sure we are not wrongly notified
    // I don't remember how it can happen
    // but it happens
    if (Number(previousModificationDate) === Number(modificationDate)) return

    callback({ modificationDate })
  })

  return () => {
    watcher.close()
  }
}
