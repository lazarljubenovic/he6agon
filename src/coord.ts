import { groupBy } from './util'

export type Coord = [number, number]

export function add (a: Coord, b: Coord): Coord {
  return [a[0] + b[0], a[1] + b[1]]
}

export function mul (k: number, a: Coord): Coord {
  return [k * a[0], k * a[1]]
}

export function eq (a: Coord, b: Coord): boolean {
  return a[0] == b[0] && a[1] == b[1]
}

export function includes (coords: Coord[], coord: Coord): boolean {
  return coords.some(c => eq(c, coord))
}

export const DIRECTIONS: Coord[] = [
  [1, -1],
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
]

export function distance (a: Coord, b: Coord): number {
  const [x1, y1] = a
  const z1 = -(x1 + y1)
  const [x2, y2] = b
  const z2 = -(x2 + y2)
  const dx = Math.abs(x1 - x2)
  const dy = Math.abs(y1 - y2)
  const dz = Math.abs(z1 - z2)
  return Math.max(dx, dy, dz)
}

export function distanceFromCenter (a: Coord): number {
  const [x, y] = a
  const z = -(x + y)
  const dx = Math.abs(x)
  const dy = Math.abs(y)
  const dz = Math.abs(z)
  return Math.max(dx, dy, dz)
}

export function getNeighbors (coord: Coord): Coord[] {
  return DIRECTIONS.map(direction => add(coord, direction))
}

export function isInBounds (size: number) {
  return function (coord: Coord): boolean {
    return distance([0, 0], coord) <= size
  }
}

export function getNeighborsInBounds (size: number) {
  return function (coord: Coord): Coord[] {
    return getNeighbors(coord).filter(isInBounds(size))
  }
}

export function breadthFirst (start: Coord, end: Coord, canTouch: (coord: Coord) => boolean, size: number): Coord[] | null {
  const queue: Coord[][] = [[start]]
  const visited: Coord[] = [start]
  while (queue.length > 0) {
    const path = queue.shift()!
    const node = path[path.length - 1]
    if (eq(node, end)) return path
    const neighbors = getNeighborsInBounds(size)(node)
      .filter(coord => !includes(visited, coord))
      .filter(canTouch)
    for (const neighbor of neighbors) {
      queue.push([...path, neighbor])
      visited.push(neighbor)
    }
  }
  return null
}

export function touchable (start: Coord, canTouch: (coord: Coord) => boolean, size: number): Coord[] {
  const visited: Coord[] = [start]
  const stack: Coord[] = [start]
  while (stack.length > 0) {
    const node = stack.pop()!
    const neighbors = getNeighborsInBounds(size)(node)
      .filter(coord => !includes(visited, coord))
      .filter(canTouch)
    stack.push(...neighbors)
    visited.push(...neighbors)
  }
  return visited
}

export function interpolateAssumingStraightLine (a: Coord, b: Coord, includeLast: boolean = false): Coord[] {
  const step: Coord = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])]
  const result: Coord[] = [a]
  while (!eq(result[result.length - 1], b)) {
    result.push(add(result[result.length - 1], step))
  }
  if (!includeLast && result.length > 1) result.pop()
  return result
}

export function getRing (k: number): Coord[] {
  if (k == 0) return [[0, 0]]
  const anchors = DIRECTIONS.map(coord => mul(k, coord))
  const result: Coord[] = []
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1]
    const curr = anchors[i]
    result.push(...interpolateAssumingStraightLine(prev, curr))
  }
  const first = anchors[0]
  const last = anchors[anchors.length - 1]
  result.push(...interpolateAssumingStraightLine(last, first))
  return result
}

export function allRings (size: number, coord: Coord): Coord[][] {
  const ringsCount: number = size + distanceFromCenter(coord) + 1
  return Array.from({ length: ringsCount })
    .map((_, i) => {
      return getRing(i).map(c => add(coord, c))
    })
}

export function generateAll (size: number): Coord[] {
  return allRings(size, [0, 0]).reduce((acc, curr) => [...acc, ...curr])
}

function get0 (coord: Coord): number { return coord[0] }

function get1 (coord: Coord): number { return coord[1] }

function get2 (coord: Coord): number { return -coord[0] - coord[1] }

const DIRECTION_GETTERS = [get0, get1, get2]

export const enum Cmp {
  GT = 1,
  EQ = 0,
  LT = -1,
}

export function deepCompare<T extends number[] | number[][] | number[][][] | number[][][][]> (as: T, bs: T): Cmp {
  const n = Math.min(as.length, bs.length)
  for (let i = 0; i < n; i++) {
    const a = as[i]
    const b = bs[i]
    if (Array.isArray(a) && Array.isArray(b)) {
      const result = deepCompare(a, b)
      if (result != Cmp.EQ) return result
    } else {
      if (a < b) return Cmp.LT
      if (a > b) return Cmp.GT
    }
  }
  if (as.length < bs.length) return Cmp.LT
  if (as.length > bs.length) return Cmp.GT
  return Cmp.EQ
}

export function getFullLines (coords: Coord[]): Coord[][][] {
  return DIRECTION_GETTERS
    .map(directionGetter => groupBy<Coord, number>(coords, directionGetter))
    .map(mapSet => [...mapSet.values()].map(group => [...group].sort(deepCompare)).sort(deepCompare)).sort(deepCompare)
}
