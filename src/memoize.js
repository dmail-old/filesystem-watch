export const memoize = (fn) => {
  const map = {}
  return (inputValue) => {
    if (map.hasOwnProperty(inputValue)) return map[inputValue]
    const returnValue = fn(inputValue)
    map[inputValue] = returnValue
    return returnValue
  }
}
