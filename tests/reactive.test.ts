import { createState } from "ags"
import { createDelta, createOnDemand } from "../lib/reactive"

let passed = 0, failed = 0

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn()
    if (result instanceof Promise) {
      result.then(() => { console.log(`  ✓ ${name}`); passed++ })
            .catch(e => { console.error(`  ✗ ${name}: ${e?.message ?? e}`); failed++ })
    } else {
      console.log(`  ✓ ${name}`); passed++
    }
  } catch (e) {
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`)
    failed++
  }
}

function eq<T>(actual: T, expected: T) {
  if (actual !== expected)
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

console.log("\ncreateDelta")

test("seeds with initial value before any tick fires", () => {
  const [tick] = createState(0)
  let sample = 0
  const d = createDelta(-1, () => ++sample, (curr, prev) => curr - prev, tick)
  eq(d(), -1)
})

test("emits compute(curr, prev) after the second tick, not the first", () => {
  const [tick, setTick] = createState(0)
  let sample = 0
  const d = createDelta(0, () => ++sample, (curr, prev) => curr - prev, tick)
  // Subscribe to start the producer
  const off = d.subscribe(() => {})
  setTick(1)              // first sample (sample=1), prev=null, no emit, prev:=1
  eq(d(), 0)
  setTick(2)              // second sample (sample=2), emit 2-1=1
  eq(d(), 1)
  setTick(3)              // third sample (sample=3), emit 3-2=1
  eq(d(), 1)
  off()
})

test("re-seeds prev each time subscribers go from 0 to 1", () => {
  const [tick, setTick] = createState(0)
  let sample = 0
  const d = createDelta(0, () => ++sample, (curr, prev) => curr - prev, tick)
  let off = d.subscribe(() => {})
  setTick(1); setTick(2)  // sample=1,2 → emit 1
  eq(d(), 1)
  off()                   // subscriber count → 0, producer disposed
  off = d.subscribe(() => {})
  setTick(3)              // sample=3, prev=null again, no emit
  eq(d(), 1)              // value sticks at last emit
  setTick(4)              // sample=4, prev=3, emit 1
  eq(d(), 1)
  off()
})

console.log("\ncreateOnDemand")

test("runs producer immediately on first subscribe", () => {
  let runs = 0
  const v = createOnDemand("init", () => { runs++; return "first" })
  eq(v(), "init")          // before subscribe
  const off = v.subscribe(() => {})
  eq(v(), "first")
  eq(runs, 1)
  off()
})

test("re-runs producer when invalidate fires", () => {
  const [trig, setTrig] = createState(0)
  let runs = 0
  const v = createOnDemand("init", () => { runs++; return `run-${runs}` }, trig)
  const off = v.subscribe(() => {})
  eq(v(), "run-1")
  setTrig(1)
  eq(v(), "run-2")
  setTrig(2)
  eq(v(), "run-3")
  off()
})

test("does not run again after dispose, even if invalidate fires", () => {
  const [trig, setTrig] = createState(0)
  let runs = 0
  const v = createOnDemand("init", () => { runs++; return `run-${runs}` }, trig)
  const off = v.subscribe(() => {})
  off()
  setTrig(1)
  eq(runs, 1)
})

console.log(`\n${passed + failed} tests: ${passed} passed${failed ? `, ${failed} failed` : ""}`)
if (failed > 0) throw new Error(`${failed} test(s) failed`)
