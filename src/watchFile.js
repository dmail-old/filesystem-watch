import { watch } from "fs"

export const watchFile = (path, callback) => {
  // https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener
  const watcher = watch(path, { persistent: false })

  // watcher.on("error", (error) => {
  //   throw error
  // })
  watcher.on("change", callback)

  // watcher.on('close', () => {})
  return () => {
    watcher.close()
  }
}
