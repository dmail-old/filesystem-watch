import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import {
  cleanFolder,
  dateToSecondsPrecision,
  createFile,
  wait,
  removeFile,
  changeFileModificationDate,
} from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/foo.js`
const modificationDateA = dateToSecondsPrecision(new Date(Date.now() + 1001))
const modificationDateB = dateToSecondsPrecision(new Date(Date.now() + 2002))

await cleanFolder(fixturesFolderPath)
await createFile(fooPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  updated: (data) => {
    mutations.push({ name: "updated", ...data })
  },
  keepProcessAlive: false,
})
await changeFileModificationDate(fooPath, modificationDateA)
await wait(200)
await removeFile(fooPath)
await wait(200)
await createFile(fooPath)
await wait(200)
await changeFileModificationDate(fooPath, modificationDateB)
await wait(200)

const actual = mutations
const expected = [
  { name: "updated", relativePath: "/foo.js", type: "file" },
  { name: "updated", relativePath: "/foo.js", type: "file" },
]
assert({ actual, expected })
