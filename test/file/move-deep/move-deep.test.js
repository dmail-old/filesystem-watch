import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import { cleanFolder, createFile, moveFile, wait } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const fooDestinationPath = `${fixturesFolderPath}/folder/foo-2.js`

await cleanFolder(fixturesFolderPath)
const mutations = []
registerFileLifecycle(fooPath, {
  added: () => {
    mutations.push({ type: "added" })
  },
  updated: (data) => {
    mutations.push({ type: "updated", ...data })
  },
  removed: () => {
    mutations.push({ type: "removed" })
  },
  keepProcessAlive: false,
})
await createFile(fooPath)
await wait(200)
await moveFile(fooPath, fooDestinationPath)
await wait(200)

const actual = mutations
const expected = [{ type: "added" }, { type: "removed" }]
assert({ actual, expected })
