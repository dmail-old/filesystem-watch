import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../index.js"
import {
  dateToSecondsPrecision,
  removeFolder,
  createFile,
  wait,
  changeFileModificationDate,
  removeFile,
} from "../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const modificationDate = dateToSecondsPrecision(new Date(Date.now() + 1000))

await removeFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFileLifecycle(fooPath, {
  modifiedCallback: (data) => {
    mutations.push({ type: "modified", ...data })
  },
  removedCallback: () => {
    mutations.push({ type: "removed" })
  },
})
await changeFileModificationDate(fooPath, modificationDate)
await wait(100)
await removeFile(fooPath)
await wait(100)

const actual = mutations
const expected = [{ type: "modified", modificationDate }, { type: "removed" }]
assert({ actual, expected })
