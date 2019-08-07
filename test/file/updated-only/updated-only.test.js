import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import {
  cleanFolder,
  createFile,
  removeFile,
  changeFileModificationDate,
  dateToSecondsPrecision,
  wait,
} from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const modificationDateA = dateToSecondsPrecision(new Date(Date.now() + 1001))
const modificationDateB = dateToSecondsPrecision(new Date(Date.now() + 2002))

await cleanFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  updated: (data) => {
    mutations.push({ type: "updated", ...data })
  },
  keepProcessAlive: false,
})
await wait(200)
await changeFileModificationDate(fooPath, modificationDateA)
await wait(200)
await removeFile(fooPath)
await wait(200)
await createFile(fooPath)
await wait(200)
await changeFileModificationDate(fooPath, modificationDateB)
await wait(200)

const actual = mutations
const expected = [{ type: "updated" }, { type: "updated" }]
assert({ actual, expected })
