import { stat } from "fs"

export const readFileModificationDate = (path) =>
  new Promise((resolve, reject) => {
    stat(path, (error, stat) => {
      if (error) {
        reject(error)
      } else {
        resolve(stat.mtime)
      }
    })
  })
