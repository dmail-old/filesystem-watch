import { watch } from "fs"
import { readFileModificationDate } from "./readFileModificationDate.js"
import { limitRate } from "./limitRate.js"
import { memoize } from "./memoize.js"

const RATE_LIMIT_IN_MILLISECONDS = 100

export const registerFileChangedOrRenamedCallback = (path, fn) => {
  const signal = getFileChangedOrRenamedSignal(path)
  const removeListener = signal.listen(fn)
  return () => {
    removeListener()
  }
}

const getFileChangedOrRenamedSignal = memoize((path) => {
  const callbackArray = []
  let uninstall
  const listen = (callback) => {
    if (callbackArray.length === 0) {
      uninstall = install()
    }
    callbackArray.push(callback)

    return () => {
      const index = callbackArray.indexOf(callback)
      if (index === -1) return

      callbackArray.splice(index, 1)
      if (callbackArray.length === 0) {
        uninstall()
        uninstall = undefined
      }
    }
  }

  // get modification date right now
  const initialModificationDatePromise = readFileModificationDate(path)
  let lastKnownModificationDate
  const install = () => {
    const fileChangeCallback = async (eventType) => {
      const [previousModificationDate, modificationDate] = await Promise.all([
        lastKnownModificationDate || initialModificationDatePromise,
        readFileModificationDate(path),
      ])
      lastKnownModificationDate = modificationDate
      // be sure we are not wrongly notified
      // I don't remember how it can happen
      // but it happens
      if (Number(previousModificationDate) === Number(modificationDate)) return

      callbackArray.slice().forEach((callback) => {
        callback({ eventType })
      })
    }

    return watchFileChange(
      path,
      // we limitRate of fileChangeCallback because sometimes
      // fileChangeCallback is called twice in a row (on windows for instance)
      limitRate(fileChangeCallback, RATE_LIMIT_IN_MILLISECONDS),
    )
  }

  return { listen }
})

const watchFileChange = (fileLocation, callback) => {
  // https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener
  const watcher = watch(fileLocation, { persistent: false })

  // watcher.on("error", (error) => {
  //   throw error
  // })
  watcher.on("change", callback)

  // watcher.on('close', () => {})
  return () => {
    watcher.close()
  }
}
