import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
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

await cleanFolder(fixturesFolderPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  added: (data) => {
    mutations.push({ name: "added", ...data })
  },
})
await createFile(fooPath)
await wait(200)
await changeFileModificationDate(fooPath, modificationDateA)
await wait(200)
await changeFileModificationDate(fooPath, modificationDateB)
await wait(200)

const actual = mutations
const expected = [{ name: "added", relativePath: `/foo.js`, type: "file" }]
assert({ actual, expected })
