import { createExternal } from "ags"
import { readFile } from "ags/file"
import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"
import { THERMAL_PATHS } from "../../../config"
import { DIVIDER, tick } from "../../../utils"

type Stat = { idle: number; total: number }

const parseStat = (line: string): Stat => {
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  return { idle: parts[3], total: parts.reduce((a, b) => a + b, 0) }
}

const cpuPercent = (curr: Stat, prev: Stat): number => {
  const di = curr.idle - prev.idle
  const dt = curr.total - prev.total
  return dt <= 0 ? 0 : Math.round((1 - di / dt) * 100)
}

const humanBytes = (n: number): string => {
  const u = ["B", "K", "M", "G", "T"]
  let i = 0
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 ? 1 : 0)}${u[i]}`
}

const formatCores = (cores: number[]): string => {
  const lines: string[] = []
  for (let i = 0; i < cores.length; i += 2) {
    const a = `Core ${i}: ${cores[i]}%`
    const b = i + 1 < cores.length ? `  Core ${i + 1}: ${cores[i + 1]}%` : ""
    lines.push(a + b)
  }
  return lines.join("\n")
}

const thermalPath: string | null =
  THERMAL_PATHS.find((p) => GLib.file_test(p, GLib.FileTest.EXISTS)) ?? null

const readThermal = (): string => {
  if (!thermalPath) return "N/A"
  try {
    return `${Math.round(Number(readFile(thermalPath).trim()) / 1000)}°`
  } catch {
    return "N/A"
  }
}

const readMem = () => {
  const lines = readFile("/proc/meminfo").split("\n")
  const get = (key: string) => {
    const l = lines.find((ml) => ml.startsWith(key))
    return l ? Number(l.trim().split(/\s+/)[1]) * 1024 : 0
  }
  const memTotal = get("MemTotal:")
  const memUsed = memTotal - get("MemAvailable:")
  const swapTotal = get("SwapTotal:")
  const swapUsed = swapTotal - get("SwapFree:")
  return { memTotal, memUsed, swapTotal, swapUsed }
}

const readCpu = (): { overall: Stat; cores: Stat[] } => {
  const lines = readFile("/proc/stat").split("\n")
  const overall = parseStat(
    lines.find((l) => l.startsWith("cpu ")) ?? "cpu 0 0 0 0 0",
  )
  const cores = lines.filter((l) => /^cpu\d/.test(l)).map(parseStat)
  return { overall, cores }
}

type HardwareState = {
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
  overall: 0,
  cores: [],
  memPct: 0,
  tempC: "N/A",
  memUsed: 0,
  memTotal: 0,
  swapUsed: 0,
  swapTotal: 0,
}

const state = createExternal<HardwareState>(initial, (set) => {
  let prevOverall: Stat | null = null
  let prevCores: Stat[] = []
  return tick.subscribe(() => {
    const { overall, cores } = readCpu()
    const overallPct = prevOverall ? cpuPercent(overall, prevOverall) : 0
    const corePcts = cores.map((c, i) =>
      prevCores[i] ? cpuPercent(c, prevCores[i]) : 0,
    )
    prevOverall = overall
    prevCores = cores

    const mem = readMem()
    const memPct =
      mem.memTotal === 0 ? 0 : Math.round((mem.memUsed / mem.memTotal) * 100)

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

const tooltip = state.as((s) =>
  [
    formatCores(s.cores),
    DIVIDER,
    `RAM:  ${humanBytes(s.memUsed)} / ${humanBytes(s.memTotal)}`,
    `Swap: ${humanBytes(s.swapUsed)} / ${humanBytes(s.swapTotal)}`,
  ].join("\n"),
)

const pad3 = (s: string) => s.padStart(3)

export const Hardware = () => (
  <Gtk.Button class="hardware" tooltipText={tooltip}>
    <box spacing={4}>
      <label
        class="cpu"
        label={state.as((s) => `󰍛${pad3(s.overall.toString())}%`)}
      />
      <label class="temp" label={state.as((s) => `󰔏 ${pad3(s.tempC)}`)} />
      <label
        class="mem"
        label={state.as((s) => ` ${pad3(s.memPct.toString())}%`)}
      />
    </box>
  </Gtk.Button>
)
