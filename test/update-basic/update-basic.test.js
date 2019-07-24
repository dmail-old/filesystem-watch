import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../index.js"
import {
  cleanFolder,
  createFile,
  changeFileModificationDate,
  dateToSecondsPrecision,
  wait,
} from "../testHelpers.js"

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
})
await createFile(fooPath)
await changeFileModificationDate(fooPath, modificationDate)
await wait(200)

const actual = mutations
const expected = [{ type: "added" }, { type: "updated", modificationDate }]
assert({ actual, expected })
