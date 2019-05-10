export function closest<T extends Element> (predicate: (element: Element) => element is T, element: Element): T | null
export function closest<T extends Element = Element> (predicate: (element: Element) => boolean, element: Element): T | null
export function closest<T extends Element> (predicate: (element: Element) => boolean, element: Element): T | null {
  let current: Element | null = element
  while (true) {
    if (current == null) return null
    if (predicate(current)) return current as T
    current = current.parentElement
  }
}

export function closestWithTagName<T extends Element> (tagName: string, element: Element): T | null {
  return closest<T>(element => element.tagName.toLowerCase() == tagName, element)
}

export function closestWithSelector<T extends Element> (selector: string, element: Element): T | null {
  return closest<T>(element => element.matches(selector), element)
}

export function randomElement<T> (array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function addToMapSet<T, U> (mapSet: Map<T, Set<U>>, t: T, u: U) {
  const set = mapSet.get(t)
  if (set == null) {
    mapSet.set(t, new Set([u]))
  } else {
    set.add(u)
  }
}

export function groupBy<T, U> (elements: Iterable<T>, getGroup: (t: T) => U): Map<U, Set<T>> {
  const mapSet = new Map<U, Set<T>>()
  for (const element of elements) {
    const group = getGroup(element)
    addToMapSet(mapSet, group, element)
  }
  return mapSet
}

export function getEqualSequences<T> (array: Array<T>, eq: (a: T, b: T) => boolean, minLength: number = 2): Array<[number, number]> {
  const result: Array<[number, number]> = []
  let startIndex: number = 0
  let endIndex: number = 0
  for (let i = 1; i < array.length; i++) {
    const prev = array[i - 1]
    const curr = array[i]
    if (eq(prev, curr)) {
      endIndex = i
    } else {
      if (endIndex - startIndex + 1 >= minLength) {
        result.push([startIndex, endIndex])
      }
      startIndex = i
    }
  }
  if (endIndex - startIndex + 1 >= minLength) {
    result.push([startIndex, endIndex])
  }
  return result
}

interface MultipleResult<T> {
  element: T,
  positions: [number, number][]
}

export function getMultiples<T> (arrays: T[][]): Array<MultipleResult<T>> {
  const foundItems = new Set<T>()
  const finalResult: Array<{ element: T, positions: [number, number][] }> = []

  for (let currArrayIndex = 0; currArrayIndex < arrays.length; currArrayIndex++) {
    const currArray = arrays[currArrayIndex]
    for (let currItemIndex = 0; currItemIndex < currArray.length; currItemIndex++) {
      const currItem = currArray[currItemIndex]
      if (foundItems.has(currItem)) continue
      const result: MultipleResult<T> = { element: currItem, positions: [[currArrayIndex, currItemIndex]] }
      for (let otherArrayIndex = 0; otherArrayIndex < arrays.length; otherArrayIndex++) {
        const otherArray = arrays[otherArrayIndex]
        for (let otherItemIndex = 0; otherItemIndex < otherArray.length; otherItemIndex++) {
          if (currArrayIndex == otherArrayIndex && currItemIndex == otherItemIndex) continue
          const otherItem = otherArray[otherItemIndex]
          if (foundItems.has(otherItem)) continue
          if (currItem == otherItem) {
            result.positions.push([otherArrayIndex, otherItemIndex])
          }
        }
      }
      if (result.positions.length > 1) {
        foundItems.add(currItem)
        finalResult.push(result)
      }
    }
  }

  return finalResult
}

