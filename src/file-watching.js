import { watchFile } from "../watchFile.js"

if (projectFileChangedCallback) {
  const { registerFileChangedCallback, triggerFileChanged } = createFileChangedSignal()

  const watchedFiles = new Map()
  cancellationToken.register(() => {
    watchedFiles.forEach((closeWatcher) => closeWatcher())
    watchedFiles.clear()
  })
  const originalProjectFileRequestedCallback = projectFileRequestedCallback
  projectFileRequestedCallback = ({ relativePath, executionId }) => {
    const filePath = `${projectPath}${relativePath}`
    // when I ask for a compiled file, watch the corresponding file on filesystem
    // here we should use the registerFileLifecyle stuff made in
    // jsenv-eslint-import-resolver so support if file gets created/deleted
    // by the way this is not truly working if compile creates a bundle
    // in that case we should watch for the whole bundle
    // sources, for now let's ignore
    if (watchedFiles.has(filePath) === false && projectFileWatchPredicate(relativePath)) {
      const fileWatcher = watchFile(filePath, () => {
        triggerFileChanged({ relativePath })
      })
      watchedFiles.set(filePath, fileWatcher)
    }
    originalProjectFileRequestedCallback({ relativePath, executionId })
  }

  registerFileChangedCallback(({ relativePath }) => {
    projectFileChangedCallback({ relativePath })
  })
}

const createFileChangedSignal = () => {
  const fileChangedCallbackArray = []

  const registerFileChangedCallback = (callback) => {
    fileChangedCallbackArray.push(callback)
  }

  const triggerFileChanged = (data) => {
    const callbackArray = fileChangedCallbackArray.slice()
    callbackArray.forEach((callback) => {
      callback(data)
    })
  }

  return { registerFileChangedCallback, triggerFileChanged }
}
