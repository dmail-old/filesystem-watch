import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import { cleanFolder, createFile, removeFile, wait } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`

await cleanFolder(fixturesFolderPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  added: (data) => {
    mutations.push({ name: "added", ...data })
  },
  updated: (data) => {
    mutations.push({ name: "updated", ...data })
  },
  keepProcessAlive: false,
})
await createFile(fooPath)
await wait(200)
await removeFile(fooPath)
await wait(200)
await createFile(fooPath)
await wait(200)

const actual = mutations
const expected = [
  { name: "added", relativePath: `/foo.js`, type: "file" },
  { name: "added", relativePath: `/foo.js`, type: "file" },
]
assert({ actual, expected })
