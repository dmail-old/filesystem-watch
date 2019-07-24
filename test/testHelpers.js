// https://nodejs.org/docs/latest-v9.x/api/fs.html#fs_fs_utimes_path_atime_mtime_callback
import { utimes, rename, unlink, mkdir } from "fs"
import { fileWrite, fileMakeDirname } from "@dmail/helper"

const rimraf = import.meta.require("rimraf")

export const changeFileModificationDate = (path, date) =>
  new Promise((resolve, reject) => {
    utimes(path, date, date, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

export const moveFile = async (path, destinationPath) => {
  await fileMakeDirname(destinationPath)
  return new Promise((resolve, reject) => {
    rename(path, destinationPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export const removeFile = (path) =>
  new Promise((resolve, reject) => {
    unlink(path, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

export const createFile = (path) => fileWrite(path, "")

export const cleanFolder = async (path) => {
  await removeFolder(path)
  await createFolder(path)
}

const createFolder = (path) =>
  new Promise((resolve, reject) => {
    mkdir(path, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

const removeFolder = (path) =>
  new Promise((resolve, reject) =>
    rimraf(path, (error) => {
      if (error) reject(error)
      else resolve()
    }),
  )

export const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const dateToSecondsPrecision = (date) => {
  const dateWithSecondsPrecision = new Date(date)
  dateWithSecondsPrecision.setMilliseconds(0)
  return dateWithSecondsPrecision
}
