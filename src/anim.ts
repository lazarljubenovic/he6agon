import { easing, tween } from 'neewt'

type Easing = (t: number) => number
type Mapping = (t: number) => number

export function attr (
  element: Element,
  attributeName: string,
  attributeValue: (t: number) => any,
  duration: number,
  easing: Easing,
): Promise<void> {
  return new Promise(resolve => {
    tween(duration, easing)
      .onUpdate(t => element.setAttribute(attributeName, attributeValue(t)))
      .onEnd(() => {
        element.setAttribute(attributeName, attributeValue(1))
        resolve()
      })
      .run()
  })
}

export const constant = (value: number): Mapping => (t: number) => value

export const between = (start: number, end: number): Mapping => (t: number) => start + t * (end - start)

export const interpolate = (a: number[]): Mapping => {
  const l = a.length
  const m = 1 / (l - 1)
  const is = Array.from({ length: l - 1 }).map((_, i) => i)
  const ks = is.map(i => (a[i + 1] - a[i]) / m)
  const ns = is.map(i => a[i] - ks[i] * i * m)
  return (t: number) => {
    const i = Math.min(Math.floor(t / m), l - 2)
    const k = ks[i]
    const n = ns[i]
    return k * t + n
  }
}

function wrap (strings: TemplateStringsArray, ...easings: Easing[]) {
  return function (t: number): string {
    let result: string = ''
    for (let i = 0; i < easings.length; i++) {
      result += strings[i] + easings[i](t)
    }
    return result + strings[strings.length - 1]
  }
}

export function opacity (
  element: Element,
  start: number = 0,
  end: number = 1,
  duration: number = 200,
  easing_: Easing = easing.easeOutQuad,
) {
  return attr(element, 'opacity', between(start, end), duration, easing_)
}

export function scale (
  element: Element,
  start: number = 0,
  end: number = 1,
  duration: number = 200,
  easing_: Easing = easing.easeOutQuad,
) {
  const scale = between(start, end)
  return attr(element, 'transform', wrap`scale(${scale})`, duration, easing_)
}

export function rotate (
  element: Element,
  start: number = 0,
  end: number = 360,
  duration: number = 200,
  easing_: Easing = easing.easeOutQuad,
) {
  const angle = between(start, end)
  return attr(element, 'transform', wrap`rotate(${angle})`, duration, easing_)
}

export function move (
  element: Element,
  keypoints: Array<{ x: number, y: number }>,
  duration: number = 200,
  easing_: Easing = easing.easeOutQuad,
) {
  const xs = keypoints.map(({ x }) => x)
  const ys = keypoints.map(({ y }) => y)
  const x = interpolate(xs)
  const y = interpolate(ys)
  return attr(element, 'transform', wrap`translate(${x} ${y})`, duration, easing_)
}

type TransformName = 'translateX' | 'translateY' | 'rotate' | 'scale'

export function transform (
  createSvgTransform: () => SVGTransform,
  svgGraphicsElement: SVGGraphicsElement,
  duration: number,
  easing_: Easing,
  options: Partial<Record<TransformName, Mapping>>,
  onEnd?: () => void,
) {
  const onUpdate = (t: number) => {
    const svgTransforms: SVGTransform[] = []

    if (options.translateX != null || options.translateY != null) {
      const x = options.translateX != null ? options.translateX(t) : 0
      const y = options.translateY != null ? options.translateY(t) : 0
      const matrix = createSvgTransform()
      matrix.setTranslate(x, y)
      svgTransforms.push(matrix)
    }

    if (options.scale != null) {
      const value = options.scale(t)
      const matrix = createSvgTransform()
      matrix.setScale(value, value)
      svgTransforms.push(matrix)
    }

    if (options.rotate != null) {
      const value = options.rotate(t)
      const matrix = createSvgTransform()
      matrix.setRotate(value, 0, 0)
      svgTransforms.push(matrix)
    }

    svgGraphicsElement.transform.baseVal.clear()
    svgTransforms.forEach(transform => {
      svgGraphicsElement.transform.baseVal.appendItem(transform)
    })
  }

  return new Promise(resolve => {
    tween(duration, easing_)
      .onUpdate(onUpdate)
      .onEnd(() => {
        onUpdate(1)
        if (onEnd != null) onEnd()
        resolve()
      })
      .run()
  })
}
