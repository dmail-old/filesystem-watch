import { readdir } from "fs"

export const readFolder = (path) =>
  new Promise((resolve, reject) => {
    readdir(path, (error, entryArray) => {
      if (error) {
        reject(error)
      } else {
        resolve(entryArray)
      }
    })
  })
