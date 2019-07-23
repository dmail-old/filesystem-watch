import { assert } from "@dmail/assert"
import { registerFileMovedCallback } from "../index.js"
import {
  cleanFixturesFolder,
  resolveFixturePath,
  createFile,
  moveFile,
  wait,
} from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/foo.js`)
const fooDestinationPath = resolveFixturePath(`/folder/foo-2.js`)
await createFile(fooPath)

const callArray = []
registerFileMovedCallback(fooPath, (...args) => {
  callArray.push(...args)
})
await moveFile(fooPath, fooDestinationPath)
await wait(200)

const actual = callArray
const expected = []
assert({ actual, expected })
