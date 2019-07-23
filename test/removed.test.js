import { assert } from "@dmail/assert"
import { registerFileRemovedCallback } from "../index.js"
import {
  cleanFixturesFolder,
  resolveFixturePath,
  createFile,
  removeFile,
  wait,
} from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/foo.js`)
await createFile(fooPath)

let callCount = 0
registerFileRemovedCallback(fooPath, () => {
  callCount++
})
await removeFile(fooPath)
await wait(200)

const actual = callCount
const expected = 1
assert({ actual, expected })
