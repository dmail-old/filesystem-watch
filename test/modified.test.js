import { assert } from "@dmail/assert"
import { registerFileModifiedCallback } from "../index.js"
import {
  cleanFixturesFolder,
  resolveFixturePath,
  createFile,
  changeFileModificationDate,
  dateToSecondsPrecision,
  wait,
} from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/foo.js`)
await createFile(fooPath)

const callArray = []
registerFileModifiedCallback(fooPath, (...args) => {
  callArray.push(...args)
})
const modificationDate = dateToSecondsPrecision(new Date(Date.now() + 1000))
await changeFileModificationDate(fooPath, modificationDate)
await wait(200)

const actual = callArray
const expected = [{ modificationDate }]
assert({ actual, expected })
