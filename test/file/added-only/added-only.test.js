import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import { cleanFolder, createFile, removeFile, wait } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`

await cleanFolder(fixturesFolderPath)
const mutations = []
registerFileLifecycle(fooPath, {
  added: () => {
    mutations.push({ type: "added" })
  },
})
await createFile(fooPath)
await wait(200)
await removeFile(fooPath)
await wait(200)
await createFile(fooPath)
await wait(200)

const actual = mutations
const expected = [{ type: "added" }, { type: "added" }]
assert({ actual, expected })
