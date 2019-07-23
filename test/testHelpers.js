// https://nodejs.org/docs/latest-v9.x/api/fs.html#fs_fs_utimes_path_atime_mtime_callback
import { utimes, rename, unlink } from "fs"
import { fileWrite, fileMakeDirname } from "@dmail/helper"
import { pathnameToDirname, hrefToPathname } from "@jsenv/module-resolution"
import { pathnameToOperatingSystemPath } from "@jsenv/operating-system-path"

const rimraf = import.meta.require("rimraf")

export const TEST_FIXTURES_FOLDER_PATHNAME = `${pathnameToDirname(
  hrefToPathname(import.meta.url),
)}/fixtures`

export const TEST_FIXTURES_FOLDER_PATH = pathnameToOperatingSystemPath(
  TEST_FIXTURES_FOLDER_PATHNAME,
)

export const resolveFixturePath = (relativePath) =>
  pathnameToOperatingSystemPath(`${TEST_FIXTURES_FOLDER_PATHNAME}${relativePath}`)

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

export const cleanFixturesFolder = () =>
  new Promise((resolve, reject) =>
    rimraf(TEST_FIXTURES_FOLDER_PATH, (error) => {
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
