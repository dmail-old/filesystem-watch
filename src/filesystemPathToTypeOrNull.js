import { statSync } from "fs"
import { statsToType } from "./statsToType.js"

export const filesystemPathToTypeOrNull = (path) => {
  try {
    const stats = statSync(path)
    const type = statsToType(stats)
    return type
  } catch (error) {
    if (error.code === "ENOENT") return null
    if (error.code === "EPERM") return null
    throw error
  }
}
