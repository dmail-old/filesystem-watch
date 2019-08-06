export const FILESYSTEM_FILE = "file"
export const FILESYSTEM_DIRECTORY = "directory"
export const FILESYSTEM_SYMBOLIC_LINK = "symbolic-link"
export const FILESYSTEM_FIFO = "fifo"
export const FILESYSTEM_SOCKET = "socket"
export const FILESYSTEM_CHARACTER_DEVICE = "character-device"
export const FILESYSTEM_BLOCK_DEVICE = "block-device"

export const statsToType = (stats) => {
  if (stats.isFile()) return FILESYSTEM_FILE
  if (stats.isDirectory()) return FILESYSTEM_DIRECTORY
  if (stats.isSymbolicLink()) return FILESYSTEM_SYMBOLIC_LINK
  if (stats.isFIFO()) return FILESYSTEM_FIFO
  if (stats.isSocket()) return FILESYSTEM_SOCKET
  if (stats.isCharacterDevice()) return FILESYSTEM_CHARACTER_DEVICE
  if (stats.isBlockDevice()) return FILESYSTEM_BLOCK_DEVICE
  return "unknown type"
}
