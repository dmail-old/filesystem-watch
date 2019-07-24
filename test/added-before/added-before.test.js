import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../index.js"
import { cleanFolder, createFile } from "../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`

await cleanFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  added: () => {
    mutations.push({ type: "added" })
  },
  updated: () => {
    mutations.push({ type: "updated" })
  },
  removed: () => {
    mutations.push({ type: "removed" })
  },
})

const actual = mutations
const expected = [{ type: "added" }]
assert({ actual, expected })
