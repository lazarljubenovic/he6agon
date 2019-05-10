export class TwoLevelMap<T, U, V> {

  private map = new Map<T, Map<U, V>>()

  public constructor () {
  }

  public set (t: T, u: U, v: V): void {
    if (!this.map.has(t)) {
      this.map.set(t, new Map())
    }
    const mapT = this.map.get(t)!
    mapT.set(u, v)
  }

  public get (t: T, u: U): V | undefined {
    const mapT = this.map.get(t)
    if (mapT === undefined) return undefined
    return mapT.get(u)
  }

  public getOrThrow (t: T, u: U): V {
    const v = this.get(t, u)
    if (v === undefined) throw new Error(`Nothing at (${t}, ${u}).`)
    return v
  }

  public has (t: T, u: U): boolean {
    const mapT = this.map.get(t)
    if (mapT === undefined) return false
    return mapT.has(u)
  }

  public delete (t: T, u: U): V | undefined {
    if (!this.map.has(t)) return undefined
    const mapT = this.map.get(t)!
    const v = mapT.get(u)
    mapT.delete(u)
    return v
  }

  public keys (): [T, U][] {
    const keys: [T, U][] = []
    for (const tKey of this.map.keys()) {
      const tValue = this.map.get(tKey)!
      for (const uKey of tValue.keys()) {
        keys.push([tKey, uKey])
      }
    }
    return keys
  }

  public values (): V[] {
    return this.keys().map(([t, u]) => this.map.get(t)!.get(u)!)
  }

  public toString (): string {
    return this.keys().map(([t, u]) => {
      const v = this.get(t, u)
      return `${t} : ${u} => ${v}`
    }).join('\n')
  }

}
