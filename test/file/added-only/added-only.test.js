import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import { cleanFolder, createFile, wait } from "../../testHelpers.js"

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

const actual = mutations
const expected = [{ type: "added" }]
assert({ actual, expected })
