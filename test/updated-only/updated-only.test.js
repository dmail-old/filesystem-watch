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
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  updated: (data) => {
    mutations.push({ type: "updated", ...data })
  },
})
await wait(200)
await changeFileModificationDate(fooPath, modificationDate)
await wait(200)

const actual = mutations
const expected = [{ type: "updated", modificationDate }]
assert({ actual, expected })
