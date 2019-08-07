import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import { cleanFolder, createFile, wait, removeFile } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`

await cleanFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  updated: (data) => {
    mutations.push({ name: "updated", ...data })
  },
  removed: (data) => {
    mutations.push({ name: "removed", ...data })
  },
  keepProcessAlive: false,
})
await removeFile(fooPath)
await wait(200)
await createFile(fooPath)
await wait(200)
await removeFile(fooPath)
await wait(200)

const actual = mutations
const expected = [
  { name: "removed", relativePath: "/foo.js", type: "file" },
  { name: "removed", relativePath: "/foo.js", type: "file" },
]
assert({ actual, expected })
