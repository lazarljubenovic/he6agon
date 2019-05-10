import 'mocha'
import * as chai from 'chai'
import * as util from './util'

describe(`groupBy`, () => {

  it(`remainder modulo 3`, () => {
    const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const fn = (x: number) => x % 3
    const actual = util.groupBy(array, fn)
    const expected = new Map([
      [0, new Set([0, 3, 6, 9])],
      [1, new Set([1, 4, 7])],
      [2, new Set([2, 5, 8])],
    ])
    chai.assert.deepEqual(actual, expected)
  })

})

describe(`getEqualSequences`, () => {

  it(`works`, () => {
    const array = [1, 1, 2, 2, 2, 3, 4, 5, 5, 5, 6, 7, 7, 8, 8, 8, 9, 9, 9]
    const eq = (a: number, b: number) => a == b
    const actual = util.getEqualSequences(array, eq)
    const expected: [number, number][] = [
      [0, 1],
      [2, 4],
      [7, 9],
      [11, 12],
      [13, 15],
      [16, 18],
    ]
    chai.assert.deepEqual(actual, expected)
  })

})

describe(`getMultiples`, () => {

  it.only(`works`, () => {
    const arrays: Array<string[]> = [
      ['a', 'b', 'c', 'd'],
      ['a', 'e', 'f', 'g'],
      ['a', 'b', 'f'],
      ['d', 'd', 'b', 'a'],
    ]
    const actual = util.getMultiples(arrays)
    const expected: typeof actual = [
      {
        element: 'a',
        positions: [[0, 0], [1, 0], [2, 0], [3, 3]],
      },
      {
        element: 'b',
        positions: [[0, 1], [2, 1], [3, 2]],
      },
      {
        element: 'd',
        positions: [[0, 3], [3, 0], [3, 1]]
      },
      {
        element: 'f',
        positions: [[1, 2], [2, 2]],
      },
    ]
    chai.assert.sameDeepMembers(actual, expected)
  })

})
