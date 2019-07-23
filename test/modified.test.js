import { assert } from "@dmail/assert"
import { registerFileModifiedCallback } from "../index.js"
import {
  cleanFixturesFolder,
  resolveFixturePath,
  createFile,
  changeFileModificationDate,
} from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/foo.js`)
await createFile(fooPath)

let actual
registerFileModifiedCallback(fooPath, (arg) => {
  actual = arg
})
const modificationDate = new Date()
await changeFileModificationDate(fooPath, modificationDate)

const expected = {} // TODO
debugger
assert({ actual, expected })
