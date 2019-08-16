import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import { cleanFolder, removeFolder, wait } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`

await cleanFolder(fixturesFolderPath)
const mutations = []
registerFileLifecycle(fooPath, {
  added: () => {},
  updated: (data) => {
    mutations.push({ type: "updated", ...data })
  },
  keepProcessAlive: false,
})
await removeFolder(fixturesFolderPath)
await wait(200)

const actual = mutations
const expected = []
assert({ actual, expected })
