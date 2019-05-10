import 'mocha'
import * as coord from './coord'
import { Coord } from './coord'
import * as chai from 'chai'

describe(`interpolateAssumingStraightLine`, () => {

  it(`returns the chain for two distant elements`, () => {
    const actual = coord.interpolateAssumingStraightLine([5, -7], [5, -2], true)
    const expected: Coord[] = [[5, -7], [5, -6], [5, -5], [5, -4], [5, -3], [5, -2]]
    chai.assert.deepEqual(actual, expected)
  })

  it(`returns the two elements for neighbors`, () => {
    const actual = coord.interpolateAssumingStraightLine([2, -1], [1, 0], true)
    const expected: Coord[] = [[2, -1], [1, 0]]
    chai.assert.deepEqual(actual, expected)
  })

  it(`returns only the elements itself when two same elements are passed in`, () => {
    const actual = coord.interpolateAssumingStraightLine([2, -1], [2, -1], true)
    const expected: Coord[] = [[2, -1]]
    chai.assert.deepEqual(actual, expected)
  })

})

describe(`getRing`, () => {

  it(`gets the ring of size 0`, () => {
    const actual = coord.getRing(0)
    const expected: Coord[] = [[0, 0]]
    chai.assert.sameDeepMembers(actual, expected)
  })

  it(`gets the ring of size 1`, () => {
    const actual = coord.getRing(1)
    const expected: Coord[] = [[1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1]]
    chai.assert.sameDeepMembers(actual, expected)
  })

  it(`gets the ring of size 2`, () => {
    const actual = coord.getRing(2)
    const expected: Coord[] = [[0, -2], [1, -2], [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 2], [-2, 1], [-2, 0], [-1, -1]]
    chai.assert.sameDeepMembers(actual, expected)
  })

  it(`gets the ring of size 4`, () => {
    const actual = coord.getRing(4)
    const expected: Coord[] = [[0, -4], [1, -4], [2, -4], [3, -4], [4, -4], [4, -3], [4, -2], [4, -1], [4, 0], [3, 1], [2, 2], [1, 3], [0, 4], [-1, 4], [-2, 4], [-3, 4], [-4, 4], [-4, 3], [-4, 2], [-4, 1], [-4, 0], [-3, -1], [-2, -2], [-1, -3]]
    chai.assert.sameDeepMembers(actual, expected)
  })

})

describe(`deepCompare`, () => {

  it(`works for simple coords`, () => {
    chai.assert.equal(coord.deepCompare([1, 2], [1, 4]), coord.Cmp.LT)
  })

  it(`works for array of coords`, () => {
    chai.assert.equal(coord.deepCompare([[1, 2], [3, 4]], [[1, 2], [4, 4]]), coord.Cmp.LT)
  })

})

describe(`getFullLines`, () => {

  it(`works`, () => {
    const actual = coord.getFullLines(coord.generateAll(2))
    const expected: Array<Array<Coord[]>> = [
      [
        [[-2, 0], [-2, 1], [-2, 2]],
        [[-1, -1], [-1, 0], [-1, 1], [-1, 2]],
        [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]],
        [[1, -2], [1, -1], [1, 0], [1, 1]],
        [[2, -2], [2, -1], [2, 0]],
      ],
      [
        [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]],
        [[-2, 1], [-1, 1], [0, 1], [1, 1]],
        [[-2, 2], [-1, 2], [0, 2]],
        [[-1, -1], [0, -1], [1, -1], [2, -1]],
        [[0, -2], [1, -2], [2, -2]],
      ],
      [
        [[-2, 0], [-1, -1], [0, -2]],
        [[-2, 1], [-1, 0], [0, -1], [1, -2]],
        [[-2, 2], [-1, 1], [0, 0], [1, -1], [2, -2]],
        [[-1, 2], [0, 1], [1, 0], [2, -1]],
        [[0, 2], [1, 1], [2, 0]],
      ],
    ]
    chai.assert.deepEqual(actual[0], expected[0])
  })

})
