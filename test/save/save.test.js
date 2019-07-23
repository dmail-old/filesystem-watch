import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFileLifecycle } from "../../index.js"
import {
  removeFolder,
  createFile,
  changeFileModificationDate,
  dateToSecondsPrecision,
  wait,
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
})
await changeFileModificationDate(fooPath, modificationDate)
await wait(200)

const actual = mutations
const expected = [{ type: "modified", modificationDate }]
assert({ actual, expected })
