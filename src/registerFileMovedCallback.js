import { registerFileChangedOrRenamedCallback } from "./registerFileChangedOrRenamedCallback.js"

export const registerFileMovedCallback = (path, callback) =>
  registerFileChangedOrRenamedCallback(path, (eventType) => {
    if (eventType === "renamed") callback()
  })
