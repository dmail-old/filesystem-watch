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

const callArray = []
registerFileRemovedCallback(fooPath, (...args) => {
  callArray.push(...args)
})
await removeFile(fooPath)
await wait(200)

const actual = callArray
const expected = {}
assert({ actual, expected })
