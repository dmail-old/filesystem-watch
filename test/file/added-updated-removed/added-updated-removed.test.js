import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../../index.js"
import {
  cleanFolder,
  dateToSecondsPrecision,
  createFile,
  wait,
  changeFileModificationDate,
  removeFile,
} from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const modificationDate = dateToSecondsPrecision(new Date(Date.now() + 1000))

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
await changeFileModificationDate(fooPath, modificationDate)
await wait(200)
await removeFile(fooPath)
await wait(200)

const actual = mutations
const expected = [{ type: "added" }, { type: "updated" }, { type: "removed" }]
assert({ actual, expected })
