import { Render, Tile, TILES } from './render'
import { getEqualSequences, getMultiples, randomElement, sleep } from './util'
import { allRings, breadthFirst, Coord, eq, generateAll, getFullLines, touchable } from './coord'
import { TwoLevelMap } from './two-level-map'

interface RaysResult {
  tilesToDestroy: Coord[]
  rays: Array<Coord[]>
  doubles: Array<Coord>
  triples: Array<Coord>
}

class Game {

  private map = new TwoLevelMap<number, number, Tile>()
  private indexes = new TwoLevelMap<number, number, number>()
  private queueSize: number = 3
  private queue: Tile[] = []
  private sourceIndex: number = -1
  private destinationIndex: number = -1

  private get size () {
    return this.renderer.size
  }

  constructor (private renderer: Render) {
    const coords = generateAll(this.size)
    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i]
      const [r, q] = coord
      this.map.set(r, q, Tile.Empty)
      this.indexes.set(r, q, i)
    }
  }

  public async init () {
    await renderer.initRender()
    this.generateQueue()
    const indexes = this.flushQueue()
    this.generateQueue()
    await this.renderSpawningTiles(indexes)
    this.listenClicks()
    this.listenHovers()
  }

  private listenClicks () {
    this.renderer.onClick((index, coord) => {
      if (!this.hasSource()) {
        if (coord != null && !this.isFree(coord)) {
          this.selectSource(index)
        }
      } else {
        if (coord == null || index == this.sourceIndex) {
          this.deselectSource()
        } else if (!this.isFree(coord)) {
          this.deselectSource()
          this.selectSource(index)
        } else {
          this.move()
        }
      }
    })
  }

  private listenHovers () {
    this.renderer.onHover((index, coord) => {
      if (!this.hasSource()) return
      if (coord == null || !this.isFree(coord)) {
        this.deselectDestination()
      } else {
        const start = this.getCoord(this.sourceIndex)
        const canTouch = (coord: Coord) => this.isFree(coord)
        const path = breadthFirst(start, coord, canTouch, this.size)
        if (path == null) {
          this.deselectDestination()
        } else {
          const indexPath = path.map(coord => this.getIndex(coord))
          this.selectDestination(index, indexPath)
        }
      }
    })
  }

  private async selectSource (index: number) {
    this.sourceIndex = index

    const start = this.getCoord(index)
    const color = this.getTile(start)
    const canTouch = (coord: Coord) => this.isFree(coord)
    const reachable = touchable(start, canTouch, this.size)
    const freeUnreachable = generateAll(this.size)
      .filter(coord => reachable.every(c => !eq(c, coord)))
      .filter(coord => this.isFree(coord))
    const reachableRings = allRings(this.size, start)
      .map(ring => ring.filter(a => reachable.some(b => eq(a, b))))
    const unreachableRings = allRings(this.size, start)
      .map(ring => ring.filter(a => freeUnreachable.some(b => eq(a, b))))

    this.renderer.focusTile(index)
    for (let i = 0; i < reachableRings.length; i++) {
      reachableRings[i].forEach(currCoord => {
        const currIndex = this.getIndex(currCoord)
        this.renderer.showMini(currIndex, color)
      })
      unreachableRings[i].forEach(currCord => {
        const currIndex = this.getIndex(currCord)
        this.renderer.focusBackground(currIndex)
      })
      await sleep(10)
    }
  }

  private async deselectSource () {
    const sourceIndex = this.sourceIndex
    this.sourceIndex = -1

    await Promise.all([
      this.renderer.defocusTile(sourceIndex),
      this.renderer.defocusAllBackgrounds(),
      this.renderer.hideAllMini(),
    ])
  }

  private async selectDestination (index: number, indexPath: number[]) {
    const sourceIndex = this.sourceIndex
    const destinationIndex = this.destinationIndex
    this.destinationIndex = index

    const sourceCoord = this.getCoord(sourceIndex)
    const color = this.getTile(sourceCoord)
    await this.renderer.drawLine(indexPath, color)
  }

  private async deselectDestination () {
    this.destinationIndex = -1

    await this.renderer.clearLine()
  }

  private async move () {
    const sourceIndex = this.sourceIndex
    const destinationIndex = this.destinationIndex
    const sourceCoord = this.getCoord(sourceIndex)
    const sourceColor = this.getTile(sourceCoord)
    const destinationCoord = this.getCoord(destinationIndex)
    const canTouch = (a: Coord) => this.isFree(a)
    const path = breadthFirst(sourceCoord, destinationCoord, canTouch, this.size)
    if (path == null) {
      this.deselectSource()
      this.deselectDestination()
      return
    }

    this.map.set(sourceCoord[0], sourceCoord[1], Tile.Empty)
    this.map.set(destinationCoord[0], destinationCoord[1], sourceColor)

    this.deselectSource()
    this.deselectDestination()
    await this.renderer.move(sourceIndex, destinationIndex, path.map(c => this.getIndex(c)))
    const rayResult1 = this.checkRays()
    this.actOnRayResult(rayResult1)
    await this.animateRayResult(rayResult1)

    if (rayResult1.tilesToDestroy.length == 0) {
      const flushed = this.flushQueue()
      await this.renderSpawningTiles(flushed)
      const rayResult2 = this.checkRays()
      this.actOnRayResult(rayResult2)
      await this.animateRayResult(rayResult2)
      this.generateQueue()
    }
  }

  private getCoord (index: number): Coord {
    const coord = this.renderer.coords[index]
    if (coord == null) throw new Error(`Cannot get coord for ${index}.`)
    return coord
  }

  private getIndex (coord: Coord): number {
    const [r, q] = coord
    return this.indexes.getOrThrow(r, q)
  }

  private getTile (coord: Coord): Tile {
    const [r, q] = coord
    return this.map.getOrThrow(r, q)
  }

  private isFree (coord: Coord): boolean {
    return this.getTile(coord) == Tile.Empty
  }

  private setTile (coord: Coord, color: Tile) {
    const [r, q] = coord
    this.map.set(r, q, color)
  }

  private hasSource (): boolean {
    return this.sourceIndex != -1
  }

  private hasDestination (): boolean {
    return this.destinationIndex != -1
  }

  private generateQueue () {
    const length = this.queueSize
    this.queue = Array.from({ length }).map(() => randomElement(TILES))
    // TODO: Render this in the UI
  }

  private flushQueue (): number[] {
    const indexes: number[] = []
    for (const color of this.queue) {
      const freeCoords = this.map.keys().filter(coord => this.isFree(coord))
      const freeCoord = randomElement(freeCoords)
      if (freeCoord == null) {
        this.declareGameOver()
      }
      this.setTile(freeCoord, color)
      const index = this.getIndex(freeCoord)
      indexes.push(index)
    }
    return indexes
  }

  private async renderSpawningTiles (indexes: number[]) {
    for (const index of indexes) {
      const coord = this.getCoord(index)
      const color = this.getTile(coord)
      this.renderer.spawnTile(index, color)
      await sleep(100)
    }
  }

  private checkRays (): RaysResult {
    const coords: [number, number][] = this.map.keys()

    const result: RaysResult = {
      tilesToDestroy: [],
      rays: [],
      doubles: [],
      triples: [],
    }

    const fullLinesInAllDirections = getFullLines(coords)
    const areEqual = (c1: Coord, c2: Coord) => {
      const t1 = this.getTile(c1)
      const t2 = this.getTile(c2)
      return t1 != Tile.Empty && t1 == t2
    }

    for (const fullLines of fullLinesInAllDirections) {
      for (const fullLine of fullLines) {
        const sequences = getEqualSequences<Coord>(fullLine, areEqual, 4)
        for (const [start, end] of sequences) {
          const ray = fullLine.slice(start, end + 1)
          result.rays.push(ray)
          for (const coord of ray) {
            if (result.tilesToDestroy.every(added => !eq(added, coord))) {
              result.tilesToDestroy.push(coord)
            }
          }
        }
      }
    }

    const multiples = getMultiples(result.rays)

    for (const multiple of multiples) {
      if (multiple.positions.length == 2) {
        result.doubles.push(multiple.element)
      } else if (multiple.positions.length == 3) {
        result.triples.push(multiple.element)
      }
    }

    return result
  }

  private actOnRayResult (rayResult: RaysResult) {
    for (const coord of rayResult.tilesToDestroy) {
      const [r, q] = coord
      this.map.set(r, q, Tile.Empty)
    }
  }

  private async animateRayResult (rayResult: RaysResult) {
    for (const coord of rayResult.tilesToDestroy) {
      const [r, q] = coord
      this.renderer.destroyTile(coord)
      await sleep(30)
    }
  }

  private declareGameOver (): never {
    throw new Error('Game Over')
  }

}

const rootElm = document.getElementById('root')!
const renderer = new Render(5, { rootElm, radius: 45, width: 1000, height: 1000 })
const game = new Game(renderer)

function run (fn: () => void) {
  if (document.readyState == 'complete') fn()
  else window.addEventListener('load', fn)
}

run(() => game.init())
