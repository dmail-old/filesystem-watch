import { assert } from "@dmail/assert"
import { registerFileRemovedCallback } from "../index.js"
import { cleanFixturesFolder, resolveFixturePath, createFile, removeFile } from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/foo.js`)
await createFile(fooPath)

let actual
registerFileRemovedCallback(fooPath, (arg) => {
  actual = arg
})
await removeFile(fooPath)

const expected = {} // TODO
assert({ actual, expected })
