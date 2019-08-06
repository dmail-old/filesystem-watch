import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import { cleanFolder, createFile, wait, changeFileModificationDate } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const modificationDateA = new Date()
const modificationDateB = new Date()
const modificationDateC = new Date()

await cleanFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  added: (data) => {
    mutations.push({ name: "added", ...data })
  },
  updated: (data) => {
    mutations.push({ name: "updated", ...data })
  },
  removed: (data) => {
    mutations.push({ name: "removed", ...data })
  },
})
await changeFileModificationDate(fooPath, modificationDateA)
await wait(300)
await changeFileModificationDate(fooPath, modificationDateB)
await wait(300)
await changeFileModificationDate(fooPath, modificationDateC)
await wait(300)

const actual = mutations
const expected = [
  { name: "updated", relativePath: "/foo.js", type: "file" },
  { name: "updated", relativePath: "/foo.js", type: "file" },
  { name: "updated", relativePath: "/foo.js", type: "file" },
]
assert({ actual, expected })
