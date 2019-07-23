import { stat } from "fs"

export const readFileModificationDate = (url) =>
  new Promise((resolve, reject) => {
    stat(url, (error, stat) => {
      if (error) {
        reject(error)
      } else {
        resolve(stat.mtime)
      }
    })
  })
