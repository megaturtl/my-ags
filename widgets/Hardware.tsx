import { readFile } from "ags/file"
import { createPoll } from "ags/time"
import { humanBytes } from "../lib/utils"
import { BubbleButton } from "./BubbleButton"

type Stat = { idle: number; total: number }

function parseStat(line: string): Stat {
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  return { idle: parts[3], total: parts.reduce((a, b) => a + b, 0) }
}

function cpuPercent(curr: Stat, prev: Stat): number {
  const di = curr.idle - prev.idle
  const dt = curr.total - prev.total
  return dt <= 0 ? 0 : Math.round((1 - di / dt) * 100)
}

const initLines = () => readFile("/proc/stat").split("\n")
let prevTotal: Stat = parseStat(initLines().find(l => l.startsWith("cpu ")) ?? "cpu 0 0 0 0 0")
let prevCores: Stat[] = initLines().filter(l => /^cpu\d/.test(l)).map(parseStat)

function getCpuTemp(): string {
  try {
    return `${Math.round(Number(readFile("/sys/class/thermal/thermal_zone2/temp").trim()) / 1000)}°`
  } catch {
    return "N/A"
  }
}

function formatCores(cores: number[]): string {
  const lines: string[] = []
  for (let i = 0; i < cores.length; i += 2) {
    const a = `Core ${i}: ${cores[i]}%`
    const b = i + 1 < cores.length ? `  Core ${i + 1}: ${cores[i + 1]}%` : ""
    lines.push(a + b)
  }
  return lines.join("\n")
}

type HardwareState = {
  cpu: number
  temp: string
  mem: number
  tooltip: string
}

function getState(): HardwareState {
  const statLines = readFile("/proc/stat").split("\n")

  const currTotal = parseStat(statLines.find(l => l.startsWith("cpu ")) ?? "cpu 0 0 0 0 0")
  const cpu = cpuPercent(currTotal, prevTotal)
  prevTotal = currTotal

  const currCores = statLines.filter(l => /^cpu\d/.test(l)).map(parseStat)
  const cores = currCores.map((c, i) => cpuPercent(c, prevCores[i] ?? { idle: 0, total: 1 }))
  prevCores = currCores

  const temp = getCpuTemp()

  const memLines = readFile("/proc/meminfo").split("\n")
  const getKb = (key: string) => {
    const l = memLines.find(ml => ml.startsWith(key))
    return l ? Number(l.trim().split(/\s+/)[1]) * 1024 : 0
  }
  const memTotal = getKb("MemTotal:")
  const memUsed = memTotal - getKb("MemAvailable:")
  const swapTotal = getKb("SwapTotal:")
  const swapUsed = swapTotal - getKb("SwapFree:")
  const mem = memTotal === 0 ? 0 : Math.round(memUsed / memTotal * 100)

  const tooltip = [
    formatCores(cores),
    "────────────────",
    `RAM:  ${humanBytes(memUsed)} / ${humanBytes(memTotal)}`,
    `Swap: ${humanBytes(swapUsed)} / ${humanBytes(swapTotal)}`,
  ].join("\n")

  return { cpu, temp, mem, tooltip }
}

const pad3 = (s: string) => s.padStart(3)

export default function Hardware() {
  const state = createPoll<HardwareState>({ cpu: 0, temp: "0°", mem: 0, tooltip: "" }, 2000, getState)

  return (
    <BubbleButton name="hardware" tooltip={state(s => s.tooltip)}>
      <box spacing={4}>
        <label cssClasses={["cpu"]} label={state(s => `󰍛${pad3(s.cpu.toString())}%`)} />
        <label cssClasses={["temp"]} label={state(s => `󰔏 ${pad3(s.temp)}`)} />
        <label cssClasses={["mem"]} label={state(s => ` ${pad3(s.mem.toString())}%`)} />
      </box>
    </BubbleButton>
  )
}
