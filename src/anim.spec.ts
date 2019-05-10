import 'mocha'
import * as chai from 'chai'
import * as anim from './anim'

function arrayApprox (a: number[], b: number[]): void {
  if (a.length != b.length) chai.assert.fail(`Mismatching lengths ${a.length} and ${b.length}.`)
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 1e-6) chai.assert.fail(`Mismatch at index ${i}: ${a[i]} and ${b[i]}.`)
  }
}

describe(`interpolate`, () => {

  it(`works for two values`, () => {
    const fn = anim.interpolate([0, 10])
    const actual = [0, 0.2, 0.4, 0.77, 1].map(fn)
    const expected = [0, 2, 4, 7.7, 10]
    arrayApprox(actual, expected)
  })

  it(`works for three values`, () => {
    const fn = anim.interpolate([0, 2.5, 7.5])
    const actual = [0, 0.2, 0.4, 0.5, 0.65, 0.85, 1].map(fn)
    const expected = [0, 1, 2, 2.5, 4, 6, 7.5]
    arrayApprox(actual, expected)
  })

  it(`works for six values`, () => {
    const fn = anim.interpolate([0, 4, 8, 6, -2, 0])
    const actual = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(fn)
    const expected = [0, 2, 4, 6, 8, 7, 6, 2, -2, -1, 0]
    arrayApprox(actual, expected)
  })

})
