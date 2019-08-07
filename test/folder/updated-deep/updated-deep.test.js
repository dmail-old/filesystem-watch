import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import {
  cleanFolder,
  dateToSecondsPrecision,
  createFile,
  createFolder,
  wait,
  changeFileModificationDate,
} from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/folder/foo.js`
const modificationDate = dateToSecondsPrecision(new Date(Date.now() + 1001))

await cleanFolder(fixturesFolderPath)
await createFolder(`${fixturesFolderPath}/folder`)
await createFile(fooPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  added: (data) => {
    mutations.push({ name: "added", ...data })
  },
  updated: (data) => {
    mutations.push({ name: "updated", ...data })
  },
  keepProcessAlive: false,
})
await changeFileModificationDate(fooPath, modificationDate)
await wait(200)

const actual = mutations
const expected = [{ name: "updated", relativePath: "/folder/foo.js", type: "file" }]
assert({ actual, expected })
