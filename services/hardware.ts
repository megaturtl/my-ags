import GLib from "gi://GLib"
import { readFile } from "ags/file"
import { createExternal } from "ags"
import { type Stat, parseStat, cpuPercent, formatCores, humanBytes } from "../lib/pure"
import { THERMAL_PATHS } from "../config"
import { tick } from "./ticker"

export type HardwareState = {
  overall: number
  cores: number[]
  memPct: number
  tempC: string
  memUsed: number
  memTotal: number
  swapUsed: number
  swapTotal: number
}

const initial: HardwareState = {
  overall: 0, cores: [], memPct: 0, tempC: "N/A",
  memUsed: 0, memTotal: 0, swapUsed: 0, swapTotal: 0,
}

let resolvedThermal: string | null | undefined
function thermalPath(): string | null {
  if (resolvedThermal !== undefined) return resolvedThermal
  resolvedThermal = THERMAL_PATHS.find(p => GLib.file_test(p, GLib.FileTest.EXISTS)) ?? null
  return resolvedThermal
}

function readThermal(): string {
  const p = thermalPath()
  if (!p) return "N/A"
  try {
    return `${Math.round(Number(readFile(p).trim()) / 1000)}°`
  } catch {
    return "N/A"
  }
}

function readMem() {
  const lines = readFile("/proc/meminfo").split("\n")
  const get = (key: string) => {
    const l = lines.find(ml => ml.startsWith(key))
    return l ? Number(l.trim().split(/\s+/)[1]) * 1024 : 0
  }
  const memTotal = get("MemTotal:")
  const memUsed = memTotal - get("MemAvailable:")
  const swapTotal = get("SwapTotal:")
  const swapUsed = swapTotal - get("SwapFree:")
  return { memTotal, memUsed, swapTotal, swapUsed }
}

function readCpu(): { overall: Stat; cores: Stat[] } {
  const lines = readFile("/proc/stat").split("\n")
  const overall = parseStat(lines.find(l => l.startsWith("cpu ")) ?? "cpu 0 0 0 0 0")
  const cores = lines.filter(l => /^cpu\d/.test(l)).map(parseStat)
  return { overall, cores }
}

export const state = createExternal<HardwareState>(initial, (set) => {
  let prevOverall: Stat | null = null
  let prevCores: Stat[] = []
  return tick.subscribe(() => {
    const { overall, cores } = readCpu()
    const overallPct = prevOverall ? cpuPercent(overall, prevOverall) : 0
    const corePcts = cores.map((c, i) => prevCores[i] ? cpuPercent(c, prevCores[i]) : 0)
    prevOverall = overall
    prevCores = cores

    const mem = readMem()
    const memPct = mem.memTotal === 0 ? 0 : Math.round(mem.memUsed / mem.memTotal * 100)

    set({
      overall: overallPct,
      cores: corePcts,
      memPct,
      tempC: readThermal(),
      memUsed: mem.memUsed,
      memTotal: mem.memTotal,
      swapUsed: mem.swapUsed,
      swapTotal: mem.swapTotal,
    })
  })
})

export const tooltip = state.as(s => [
  formatCores(s.cores),
  "────────────────",
  `RAM:  ${humanBytes(s.memUsed)} / ${humanBytes(s.memTotal)}`,
  `Swap: ${humanBytes(s.swapUsed)} / ${humanBytes(s.swapTotal)}`,
].join("\n"))
