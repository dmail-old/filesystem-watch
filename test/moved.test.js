import { assert } from "@dmail/assert"
import { registerFileMovedCallback } from "../index.js"
import { cleanFixturesFolder, resolveFixturePath, createFile, moveFile } from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/foo.js`)
const fooDestinationPath = resolveFixturePath(`/foo-2.js`)
await createFile(fooPath)

let actual
registerFileMovedCallback(fooPath, (arg) => {
  actual = arg
})
await moveFile(fooPath, fooDestinationPath)

const expected = {} // TODO
assert({ actual, expected })
