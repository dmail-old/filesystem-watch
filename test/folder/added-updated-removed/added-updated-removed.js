import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
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
registerFolderLifecycle(fixturesFolderPath, {
  added: (data) => {
    mutations.push({ name: "added", ...data })
  },
  updated: (data) => {
    mutations.push({ name: "updated", ...data })
  },
  removed: (data) => {
    mutations.push({ name: "removed", ...data })
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
const expected = [
  { name: "added", relativePath: "/foo.js", type: "file" },
  { name: "updated", relativePath: "/foo.js", type: "file" },
  { name: "removed", relativePath: "/foo.js", type: "file" },
]
assert({ actual, expected })
