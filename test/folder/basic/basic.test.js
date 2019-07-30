import { assert } from "@dmail/assert"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { registerFolderLifecycle } from "../../../index.js"
import { cleanFolder } from "../../testHelpers.js"

const fixturesFolderPath = `${importMetaURLToFolderPath(import.meta.url)}/fixtures`

await cleanFolder(fixturesFolderPath)
const actual = typeof registerFolderLifecycle(fixturesFolderPath, {})
const expected = "function"
assert({ actual, expected })
