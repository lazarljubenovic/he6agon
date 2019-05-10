export function ce<T extends keyof HTMLElementTagNameMap> (tagName: T, attrs?: Array<[string, any]>, children?: Array<Element | Text>): HTMLElementTagNameMap[T] {
  const elm = document.createElement(tagName)
  if (attrs != null) sa(elm, attrs)
  if (children != null) append(elm, ...children)
  return elm
}

export function csvg<T extends keyof SVGElementTagNameMap> (tagName: T, attrs?: Array<[string, any]>, children?: Array<Element | Text>): SVGElementTagNameMap[T] {
  const elm = document.createElementNS('http://www.w3.org/2000/svg', tagName)
  if (attrs != null) sa(elm, attrs)
  if (children != null) append(elm, ...children)
  return elm
}

export function t (data: string): Text {
  return document.createTextNode(data)
}

export function sa (el: Element, pairs: Array<[string, any]>) {
  for (const [key, value] of pairs) el.setAttribute(key, value)
}

export function ra (el: Element, attrs: Array<string>) {
  for (const attr of attrs) el.removeAttribute(attr)
}

export function append (el: Element, ...els: Array<Element | Text>): void {
  el.append(...els)
}

export function cla (el: Element, ...tokens: string[]) {
  el.classList.add(...tokens)
}

export function clr (el: Element, ...tokens: string[]) {
  el.classList.remove(...tokens)
}

export function data (el: HTMLElement | SVGElement, pairs: Array<[string, any]>) {
  for (const [key, value] of pairs) el.dataset[key] = value
}
