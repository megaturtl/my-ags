import { Accessor, createExternal } from "ags"

// Compute T from successive samples of S. The first sample seeds prev
// and emits `seed`; each subsequent tick emits compute(curr, prev).
// `tick` is any Accessor whose change events trigger a sample.
export function createDelta<S, T>(
  seed: T,
  read: () => S,
  compute: (curr: S, prev: S) => T,
  tick: Accessor<unknown>,
): Accessor<T> {
  return createExternal<T>(seed, (set) => {
    let prev: S | null = null
    return tick.subscribe(() => {
      const curr = read()
      if (prev !== null) set(compute(curr, prev))
      prev = curr
    })
  })
}

// Lazy + change-driven async value. Producer runs once when the first
// subscriber appears and re-runs whenever `invalidate` fires. Useful
// for things like `ip addr show` that should not run on a poll interval.
export function createOnDemand<T>(
  initial: T,
  producer: () => T | Promise<T>,
  invalidate?: Accessor<unknown>,
): Accessor<T> {
  return createExternal<T>(initial, (set) => {
    let cancelled = false
    function refresh() {
      const result = producer()
      if (result instanceof Promise) result.then(v => { if (!cancelled) set(v) })
      else set(result)
    }
    refresh()
    const off = invalidate?.subscribe(refresh)
    return () => { cancelled = true; off?.() }
  })
}
