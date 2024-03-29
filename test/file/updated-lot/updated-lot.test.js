import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import {
  cleanFolder,
  dateToSecondsPrecision,
  createFile,
  wait,
  changeFileModificationDate,
} from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const modificationDateA = dateToSecondsPrecision(new Date(Date.now() + 1001))
const modificationDateB = dateToSecondsPrecision(new Date(Date.now() + 2002))
const modificationDateC = dateToSecondsPrecision(new Date(Date.now() + 3003))

await cleanFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  updated: (data) => {
    mutations.push({ type: "updated", ...data })
  },
  removed: () => {
    mutations.push({ type: "removed" })
  },
  keepProcessAlive: false,
})
await changeFileModificationDate(fooPath, modificationDateA)
await wait(300)
await changeFileModificationDate(fooPath, modificationDateB)
await wait(300)
await changeFileModificationDate(fooPath, modificationDateC)
await wait(300)

const actual = mutations
const expected = [{ type: "updated" }, { type: "updated" }, { type: "updated" }]
assert({ actual, expected })
