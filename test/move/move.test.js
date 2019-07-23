import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../index.js"
import { removeFolder, createFile, moveFile, wait } from "../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const fooDestinationPath = `${fixturesFolderPath}/foo-2.js`

await removeFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  movedCallback: (data) => {
    mutations.push({ type: "moved", ...data })
  },
  removedCallback: () => {
    mutations.push({ type: "removed" })
  },
})
await moveFile(fooPath, fooDestinationPath)
await wait(200)

const actual = mutations
const expected = [{ type: "moved", newPath: fooDestinationPath }]
assert({ actual, expected })
