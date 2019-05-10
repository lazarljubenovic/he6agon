import { TwoLevelMap } from './two-level-map'
import * as dom from './dom'
import { Coord, generateAll } from './coord'
import { closestWithSelector, sleep } from './util'
import { easing, tween } from 'neewt'
import * as anim from './anim'
import index from 'rollup-plugin-node-resolve'

export interface RenderConfig {
  rootElm: HTMLElement
  width: number
  height: number
  radius: number
}

export const enum Tile {
  Empty,
  Red,
  Blue,
  Yellow,
  Green,
  Purple,
  Orange,
  Rainbow,
}

export const TILES = [
  Tile.Red,
  Tile.Blue,
  Tile.Yellow,
  Tile.Green,
  Tile.Purple,
  Tile.Orange,
]


function polygonPointsAttrValue (radius: number, sides: number, angleOffset: number): string {
  const points: [string, string][] = []
  const angleChunk = 2 * Math.PI / sides
  for (let i = 0; i < sides; i++) {
    const angle = angleChunk * i + angleOffset
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const x = (c * radius).toFixed(2)
    const y = (s * radius).toFixed(2)
    points.push([x, y])
  }
  return points.map(([x, y]) => `${x},${y}`).join(' ')
}

/**
 * @deprecated
 */
export function polygon (radius: number, sides: number, angleOffset: number = 0): SVGElement {
  const pointsAttrValue = polygonPointsAttrValue(radius, sides, angleOffset)
  return dom.csvg('polygon', [['points', pointsAttrValue]])
}

export interface RenderConfig {
  rootElm: HTMLElement
  width: number
  height: number
  radius: number
}

interface Elms {
  sections: {
    board: HTMLDivElement
  }
  svg: SVGSVGElement
  hitArea: {
    group: SVGGElement
    tile: TwoLevelMap<number, number, SVGGElement>,
  },
  plateau: {
    group: SVGGElement
    tile: TwoLevelMap<number, number, SVGGElement>,
  },
  tiles: {
    group: SVGGElement
    tile: TwoLevelMap<number, number, SVGGElement>,
  },
  mini: {
    group: SVGGElement
    tile: TwoLevelMap<number, number, SVGGElement>,
  },
  lineGroup: SVGGElement
}

function gPoly (gAttrs: [string, any][], polygonAttrs: [string, any][]) {
  return dom.csvg('g', gAttrs, [dom.csvg('polygon', polygonAttrs)])
}

interface Handler {
  (index: number, coord: Coord | null): void
}

export class Render {

  private elms!: Elms
  private polygonPoints!: [string, string]

  public coords: Coord[]
  private positions: { x: number, y: number }[] = []
  private colors: Partial<Record<Tile, string>> = {
    [Tile.Red]: '#e41a1c',
    [Tile.Blue]: '#377eb8',
    [Tile.Yellow]: '#eaea28',
    [Tile.Green]: '#4daf4a',
    [Tile.Purple]: '#984ea3',
    [Tile.Orange]: '#ff7f00',
  }

  private onHoverHandlers: Handler[] = []
  private onClickHandlers: Handler[] = []

  constructor (
    public size: number,
    private renderConfig: RenderConfig,
  ) {
    this.coords = generateAll(this.size)
  }

  public onHover (handler: Handler) {
    this.onHoverHandlers.push(handler)
  }

  public onClick (handler: Handler) {
    this.onClickHandlers.push(handler)
  }

  public async initRender () {
    const { rootElm, width, height, radius } = this.renderConfig
    const tilesCount = this.coords.length
    const GROUP_TRANSFORM: [string, string] = ['transform', `translate(${width / 2} ${height / 2})`]

    const plateauChildren: SVGGElement[] = new Array(tilesCount)
    const tilesChildren: SVGGElement[] = new Array(tilesCount)
    const miniChildren: SVGGElement[] = new Array(tilesCount)
    const hitAreaChildren: SVGGElement[] = new Array(tilesCount)

    this.polygonPoints = ['points', polygonPointsAttrValue(radius, 6, 0)]

    const sqrt3 = Math.sqrt(3)
    const sqrt3Half = sqrt3 / 2
    const threeRadiusHalf = 3 * radius / 2

    const plateauMap = new TwoLevelMap<number, number, SVGGElement>()
    const tilesMap = new TwoLevelMap<number, number, SVGGElement>()
    const miniMap = new TwoLevelMap<number, number, SVGGElement>()
    const hitAreaMap = new TwoLevelMap<number, number, SVGGElement>()

    for (let i = 0; i < this.coords.length; i++) {
      const coord = this.coords[i]
      const [r, q] = coord
      const x = threeRadiusHalf * q
      const y = radius * (sqrt3 * r + sqrt3Half * q)
      this.positions[i] = { x, y }
      const TRANSLATE = `translate(${x} ${y})`

      const plateau = gPoly([
        ['transform', `${TRANSLATE} scale(0.91)`],
        ['opacity', '0'],
      ], [
        this.polygonPoints,
        ['fill', 'hsla(0, 0%, 0%, .02)'],
        ['stroke', 'hsla(0, 0%, 0%, .08)'],
        ['stroke-width', '2'],
      ])

      const mini = gPoly([
        ['transform', `${TRANSLATE} rotate(30) scale(0.133)`],
      ], [
        this.polygonPoints,
        ['opacity', '0'],
      ])

      const hitArea = gPoly([
        ['transform', TRANSLATE],
        ['opacity', '0'],
      ], [
        this.polygonPoints,
      ])
      dom.data(hitArea, [['index', i]])
      dom.cla(hitArea, 'hit')

      plateauChildren[i] = plateau
      miniChildren[i] = mini
      hitAreaChildren[i] = hitArea

      plateauMap.set(r, q, plateau)
      miniMap.set(r, q, mini)
      hitAreaMap.set(r, q, hitArea)
    }

    const plateauGroup = dom.csvg('g', [GROUP_TRANSFORM], plateauChildren)
    const tilesGroup = dom.csvg('g', [GROUP_TRANSFORM])
    const miniGroup = dom.csvg('g', [GROUP_TRANSFORM], miniChildren)
    const lineGroup = dom.csvg('g', [GROUP_TRANSFORM])
    const hitAreaGroup = dom.csvg('g', [GROUP_TRANSFORM], hitAreaChildren)

    dom.cla(plateauGroup, 'plateau')
    dom.cla(tilesGroup, 'tiles')

    const svg = dom.csvg('svg', [
      ['width', width],
      ['height', height],
    ], [
      plateauGroup,
      tilesGroup,
      miniGroup,
      lineGroup,
      hitAreaGroup,
    ])

    const board = dom.ce('div')

    dom.append(board, svg)
    dom.append(rootElm, board)

    this.elms = {
      svg,
      lineGroup,
      sections: { board },
      plateau: { group: plateauGroup, tile: plateauMap },
      hitArea: { group: hitAreaGroup, tile: hitAreaMap },
      mini: { group: miniGroup, tile: miniMap },
      tiles: { group: tilesGroup, tile: tilesMap },
    }

    this.registerHandlers()

    const that = this
    const SLEEP = 60
    const DUR = 100
    const update = (elm: SVGElement) => (t: number) => dom.sa(elm, [['opacity', t]])
    const end = (elm: SVGElement) => () => dom.sa(elm, [['opacity', '1']])

    tween(DUR, easing.easeOutQuad)
      .onUpdate(update(plateauChildren[0]))
      .onEnd(end(plateauChildren[0]))
      .run()
    await sleep(SLEEP)

    for (let i = 0; i < that.size; i++) {
      const start = 3 * i * (i + 1) + 1
      const dur = 6 * (i + 1)
      for (let j = 0; j < dur; j++) {
        const index = start + j
        tween(DUR, easing.easeOutQuad)
          .onUpdate(update(plateauChildren[index]))
          .onEnd(end(plateauChildren[index]))
          .run()
      }
      await sleep(SLEEP)
    }
  }

  public async spawnTile (index: number, color: Tile) {
    const { x, y } = this.positions[index]
    const [r, q] = this.coords[index]
    const gElm = gPoly([
      ['transform', `translate(${x} ${y}) scale(0.921)`],
    ], [
      ['opacity', '0'],
      this.polygonPoints,
      ['fill', this.colors[color]],
    ])
    dom.append(this.elms.tiles.group, gElm)
    this.elms.tiles.tile.set(r, q, gElm)
    const polyElm = gElm.firstElementChild as SVGPolygonElement

    anim.opacity(polyElm, 0, 1, 200, easing.easeOutQuad)
    await anim.scale(polyElm, 0.5, 1, 360, slightBounce)
  }

  public async destroyTile (coord: Coord) {
    const [r, q] = coord
    const gElm = this.elms.tiles.tile.delete(r, q)
    if (gElm == null) throw new Error(`No tile to destroy at (${r}, ${q}).`)
    const polyElm = gElm.firstElementChild as SVGPolygonElement

    anim.opacity(polyElm, 1, 0, 120, easing.easeOutQuad)
    await anim.scale(polyElm, 1, 1.5, 200, easing.easeOutQuad)
    polyElm.remove()
  }

  public async focusTile (index: number) {
    const [r, q] = this.coords[index]
    const gElm = this.elms.tiles.tile.getOrThrow(r, q)
    const polyElm = gElm.firstElementChild as SVGPolygonElement

    anim.transform(
      () => this.elms.svg.createSVGTransform(),
      polyElm,
      200,
      easing.easeOutQuad,
      {
        scale: anim.between(1, 1.125),
        rotate: anim.between(0, 60),
      },
    )
  }

  public async defocusTile (index: number) {
    const coord = this.coords[index]
    const [r, q] = coord
    const gElm = this.elms.tiles.tile.getOrThrow(r, q)
    const polyElm = gElm.firstElementChild as SVGPolygonElement

    anim.transform(
      () => this.elms.svg.createSVGTransform(),
      polyElm,
      200,
      easing.easeOutQuad,
      {
        scale: anim.between(1.125, 1),
      },
      () => {
        polyElm.transform.baseVal.clear()
      },
    )
  }

  public async drawLine (indexes: number[], color: Tile) {
    const lineElms: SVGLineElement[] = new Array(indexes.length)
    for (let j = 1; j < indexes.length; j++) {
      const i = j - 1
      const coordStart = indexes[i]
      const coordEnd = indexes[j]
      const posStart = this.positions[coordStart]
      const posEnd = this.positions[coordEnd]
      const lineElm = dom.csvg('line', [
        ['x1', posStart.x],
        ['y1', posStart.y],
        ['x2', posEnd.x],
        ['y2', posEnd.y],
      ])
      lineElms[i] = lineElm
    }
    const lineGroup = this.elms.lineGroup
    lineGroup.innerHTML = ''
    dom.append(lineGroup, ...lineElms)
    dom.sa(lineGroup, [
      ['stroke', this.colors[color]],
      ['stroke-width', '12'],
      ['stroke-linecap', 'round'],
    ])
  }

  public async clearLine () {
    const lineGroup = this.elms.lineGroup
    lineGroup.innerHTML = ''
    dom.sa(lineGroup, [['opacity', '1']])
  }

  public async move (startIndex: number, endIndex: number, path: number[]) {
    const startCoord = this.coords[startIndex]
    const endCoord = this.coords[endIndex]

    const elm = this.elms.tiles.tile.getOrThrow(...startCoord)
    this.elms.tiles.tile.delete(...startCoord)
    this.elms.tiles.tile.set(endCoord[0], endCoord[1], elm)

    const xs = path.map(index => this.positions[index].x)
    const ys = path.map(index => this.positions[index].y)
    await anim.transform(
      () => this.elms.svg.createSVGTransform(),
      elm,
      40 * path.length,
      easing.easeInOutQuad,
      {
        translateX: anim.interpolate(xs),
        translateY: anim.interpolate(ys),
        scale: anim.constant(0.921),
      },
    )
  }

  private shownMinis: number[] = []

  public async showMini (index: number, color: Tile) {
    this.shownMinis.push(index)
    const coord = this.coords[index]
    const [r, q] = coord
    const gElm = this.elms.mini.tile.getOrThrow(r, q)
    const polygonElm = gElm.firstElementChild as SVGPolygonElement
    dom.sa(polygonElm, [['fill', this.colors[color]]])
    anim.opacity(polygonElm, 0, 0.66, 120, easing.easeOutQuad)
    await anim.scale(polygonElm, 0.5, 1, 240, easing.easeOutQuad)
  }

  public async hideAllMini () {
    this.shownMinis.forEach(index => this.hideMini(index))
    this.shownMinis = []
  }

  private async hideMini (index: number) {
    const coord = this.coords[index]
    const [r, q] = coord
    const gElm = this.elms.mini.tile.getOrThrow(r, q)
    const polygonElm = gElm.firstElementChild as SVGPolygonElement
    await anim.opacity(polygonElm, 0.66, 0, 120, easing.easeOutQuad)
  }

  private focusedBackgrounds: number[] = []

  public async focusBackground (index: number) {
    this.focusedBackgrounds.push(index)
    const coord = this.coords[index]
    const [r, q] = coord
    const gElm = this.elms.plateau.tile.getOrThrow(r, q)
    const polygonElm = gElm.firstElementChild as SVGPolygonElement
    await anim.scale(polygonElm, 1, 0.33, 120)
  }

  public async defocusAllBackgrounds () {
    this.focusedBackgrounds.forEach(index => this.defocusBackground(index))
    this.focusedBackgrounds = []
  }

  private async defocusBackground (index: number) {
    const coord = this.coords[index]
    const [r, q] = coord
    const gElm = this.elms.plateau.tile.getOrThrow(r, q)
    const polygonElm = gElm.firstElementChild as SVGPolygonElement
    await anim.scale(polygonElm, 0.33, 1, 300, easing.easeInOutQuad)
    dom.ra(polygonElm, ['scale'])
  }

  // region Clicks and hovers

  private previouslyFiredIndex = new Map<Handler[], number | null>([
    [this.onClickHandlers, null],
    [this.onHoverHandlers, null],
  ])

  private callNull (array: Handler[], allowRepeating: boolean): void {
    const previous = this.previouslyFiredIndex.get(array)
    if (!allowRepeating && previous == -1) return
    array.forEach(fn => fn(-1, null))
    this.previouslyFiredIndex.set(array, -1)
  }

  private callCoord (index: number, array: Handler[], allowRepeating: boolean): void {
    const previous = this.previouslyFiredIndex.get(array)
    if (!allowRepeating && previous == index) return
    const coord = this.coords[index]
    array.forEach(fn => fn(index, coord))
    this.previouslyFiredIndex.set(array, index)
  }

  private handleEvent = (array: Handler[], allowRepeating: boolean) => (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return this.callNull(array, allowRepeating)
    const gElm = closestWithSelector<SVGGElement>('g.hit', event.target)
    if (gElm == null) return this.callNull(array, allowRepeating)
    const indexString = gElm.dataset['index']
    if (indexString == null) return this.callNull(array, allowRepeating)
    const index = +indexString
    this.callCoord(index, array, allowRepeating)
  }

  private registerHandlers () {
    document.addEventListener('click', this.handleEvent(this.onClickHandlers, true))
    document.addEventListener('mousemove', this.handleEvent(this.onHoverHandlers, false))
  }

  // endregion

}

const polynomial = (...coeffs: number[]) => (t: number): number => {
  let result: number = 0
  let power: number = 1
  for (let i = 0; i < coeffs.length; i++) {
    result += power * coeffs[i]
    power *= t
  }
  return result
}

const slightBounce = polynomial(0, 12.995, -33.8325, 33.18, -17.19, 5.8475)

const HUNDRED_EIGHTY_OVER_PI = 180 / Math.PI
const PI_OVER_HUNDRED_EIGHTY = 1 / HUNDRED_EIGHTY_OVER_PI

function toDeg (rad: number): number {
  return HUNDRED_EIGHTY_OVER_PI * rad
}

function toRad (deg: number): number {
  return PI_OVER_HUNDRED_EIGHTY * deg
}

