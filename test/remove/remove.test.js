import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../index.js"
import { removeFolder, createFile, removeFile, wait } from "../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`

await removeFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  removedCallback: () => {
    mutations.push({ type: "removed" })
  },
})
await removeFile(fooPath)
await wait(200)

// on linux I am notified twice of the removal
// it sucks and should be fixed
const actual = mutations
const expected = [{ type: "removed" }]
assert({ actual, expected })
