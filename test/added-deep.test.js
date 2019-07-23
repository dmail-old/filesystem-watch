import { assert } from "@dmail/assert"
import { registerFileAddedCallback } from "../index.js"
import {
  TEST_FIXTURES_FOLDER_PATH,
  cleanFixturesFolder,
  resolveFixturePath,
  createFile,
  wait,
} from "./testHelpers.js"

await cleanFixturesFolder()
const fooPath = resolveFixturePath(`/folder/foo.js`)

const callArray = []
registerFileAddedCallback(TEST_FIXTURES_FOLDER_PATH, (...args) => {
  callArray.push(...args)
})
await createFile(fooPath)
await wait(200)

const actual = callArray
const expected = [{ relativePath: `/folder/foo.js` }]
assert({ actual, expected })
