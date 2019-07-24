import { statSync } from "fs"

export const readFileModificationDate = (path) => statSync(path).mtime
