import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import {
  cleanFolder,
  createFile,
  wait,
  removeFile,
  createFolder,
  removeFolder,
} from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const folderPath = `${fixturesFolderPath}/folder`
const filePath = `${folderPath}/foo.js`

await cleanFolder(fixturesFolderPath)
await createFolder(folderPath)
await createFile(filePath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  removed: (data) => {
    mutations.push({ name: "removed", ...data })
  },
})
await removeFile(filePath)
await removeFolder(folderPath)
await wait(200)
await createFolder(folderPath)
await createFile(filePath)
await wait(200)
await removeFile(filePath)
await removeFolder(folderPath)
await wait(200)

const actual = mutations
const expected = [
  { name: "removed", relativePath: "/folder/foo.js", type: "file" },
  { name: "removed", relativePath: "/folder", type: "directory" },
  { name: "removed", relativePath: "/folder/foo.js", type: "file" },
  { name: "removed", relativePath: "/folder", type: "directory" },
]
assert({ actual, expected })
