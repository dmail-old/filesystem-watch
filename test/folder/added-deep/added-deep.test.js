import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import { cleanFolder, createFile, wait } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`
const fooPath = `${fixturesFolderPath}/folder/foo.js`

await cleanFolder(fixturesFolderPath)
const mutations = []
registerFolderLifecycle(fixturesFolderPath, {
  added: (data) => {
    mutations.push({ name: "added", ...data })
  },
})
await createFile(fooPath)
await wait(200)

const actual = mutations
const expected = [
  { name: "added", relativePath: `/folder`, type: "directory" },
  { name: "added", relativePath: `/folder/foo.js`, type: "file" },
]
assert({ actual, expected })
