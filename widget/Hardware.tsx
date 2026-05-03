import { readFile } from "ags/file"
import { createPoll } from "ags/time"

type CpuStat = { idle: number; total: number }

function readCpuStat(): CpuStat {
  const line = readFile("/proc/stat").split("\n")[0]
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  const idle = parts[3]
  const total = parts.reduce((a, b) => a + b, 0)
  return { idle, total }
}

let prevCpu: CpuStat = readCpuStat()

function getCpuUsage(): number {
  const curr = readCpuStat()
  const deltaIdle = curr.idle - prevCpu.idle
  const deltaTotal = curr.total - prevCpu.total
  prevCpu = curr
  return deltaTotal === 0 ? 0 : Math.round((1 - deltaIdle / deltaTotal) * 100)
}

function getCpuTemp(): string {
  try {
    const raw = readFile("/sys/class/thermal/thermal_zone1/temp")
    return `${Math.round(Number(raw.trim()) / 1000)}°`
  } catch {
    return "N/A"
  }
}

function getMemUsage(): number {
  const lines = readFile("/proc/meminfo").split("\n")
  const get = (key: string) => {
    const line = lines.find(l => l.startsWith(key))
    return line ? Number(line.trim().split(/\s+/)[1]) : 0
  }
  const total = get("MemTotal:")
  const available = get("MemAvailable:")
  return total === 0 ? 0 : Math.round((1 - available / total) * 100)
}

type HardwareState = {
  cpu: number
  temp: string
  mem: number
}

function getState(): HardwareState {
  return {
    cpu: getCpuUsage(),
    temp: getCpuTemp(),
    mem: getMemUsage(),
  }
}

export default function Hardware() {
  const state = createPoll<HardwareState>({ cpu: 0, temp: "0°", mem: 0 }, 2000, getState)

  return (
    <box cssClasses={["bubble", "hardware"]} spacing={4}>
      <label
        cssClasses={["cpu"]}
        label={state(s => `󰍛 ${s.cpu}%`)}
      />
      <label
        cssClasses={["temp"]}
        label={state(s => `󰔏 ${s.temp}`)}
      />
      <label
        cssClasses={["mem"]}
        label={state(s => `  ${s.mem}%`)}
      />
    </box>
  )
}