import { registerFileChangedOrRenamedCallback } from "./registerFileChangedOrRenamedCallback.js"

export const registerFileModifiedCallback = (path, callback) =>
  registerFileChangedOrRenamedCallback(path, (eventType) => {
    if (eventType === "changed") callback()
  })
