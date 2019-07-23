import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileAddedCallback } from "../../index.js"
import { removeFolder, createFile, wait } from "../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/folder/foo.js`

await removeFolder(fixturesFolderPath)
const callArray = []
registerFileAddedCallback(fixturesFolderPath, (data) => {
  callArray.push(data)
})
await createFile(fooPath)
await wait(200)

const actual = callArray
// does not work on linux because recursive is not supported
// https://nodejs.org/docs/latest/api/fs.html#fs_caveats
const expected = [{ relativePath: `/folder/foo.js` }]
assert({ actual, expected })
