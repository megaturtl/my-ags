import AstalNetwork from "gi://AstalNetwork"
import { readFile } from "ags/file"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import { BubbleButton } from "./BubbleButton"

const network = AstalNetwork.get_default()

function wifiIcon(strength: number): string {
  if (strength > 80) return "󰤨"
  if (strength > 60) return "󰤥"
  if (strength > 40) return "󰤢"
  return "󰤟"
}

// Always returns 4 chars so the speed section never changes width
function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 10 * 1024 * 1024) return `${Math.round(bytesPerSec / 1024 / 1024)}M`.padStart(4)
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)}M`.padStart(4)
  if (bytesPerSec >= 1024) return `${Math.round(bytesPerSec / 1024)}K`.padStart(4)
  return `${bytesPerSec}B`.padStart(4)
}

type NetStats = { rx: number; tx: number; time: number }

let prev: NetStats | null = null

function getLabel(): string {
  const wifi = network.wifi
  const wired = network.wired

  if (wired?.get_device()?.state === AstalNetwork.DeviceState.ACTIVATED) {
    return "󰈀 LAN"
  }

  if (wifi) {
    const iface = wifi.get_device()?.get_iface() ?? ""
    const currRaw = readIfaceBytes(iface)
    const now = Date.now()

    // 2. If this is the FIRST run, just store the data and return a placeholder
    if (!prev) {
      prev = { ...currRaw, time: now }
      return `${wifiIcon(wifi.strength)}  ⇣${formatSpeed(0)} ⇡${formatSpeed(0)}`
    }

    const elapsedSeconds = (now - prev.time) / 1000

    // 3. Normal calculation logic
    const rx = elapsedSeconds > 0 ? Math.max(0, currRaw.rx - prev.rx) / elapsedSeconds : 0
    const tx = elapsedSeconds > 0 ? Math.max(0, currRaw.tx - prev.tx) / elapsedSeconds : 0

    prev = { ...currRaw, time: now }

    const speed = `⇣${formatSpeed(rx)} ⇡${formatSpeed(tx)}`
    return `${wifiIcon(wifi.strength)}  ${speed}`
  }

  // Reset prev if we go offline so it doesn't jump when reconnecting
  prev = null
  return "󰤭 Offline"
}

type RawStats = { rx: number; tx: number }

function readIfaceBytes(iface: string): RawStats {
  const lines = readFile("/proc/net/dev").split("\n")
  const line = lines.find(l => l.trim().startsWith(iface + ":"))
  if (!line) return { rx: 0, tx: 0 }
  const parts = line.trim().split(/\s+/)
  return {
    rx: parseInt(parts[1], 10),
    tx: parseInt(parts[9], 10)
  }
}

async function getTooltip(): Promise<string> {
  const wifi = network.wifi
  const wired = network.wired

  if (wired?.get_device()?.state === AstalNetwork.DeviceState.ACTIVATED) {
    const iface = wired.get_device()?.get_iface() ?? "eth"
    try {
      const ip = await execAsync(`ip -4 addr show ${iface} | grep 'inet ' | awk '{print $2}'`)
      return `${iface}\n${ip.trim()}`
    } catch {
      return iface
    }
  }

  if (wifi) {
    const iface = wifi.get_device()?.get_iface() ?? ""
    try {
      const ip = await execAsync(`ip -4 addr show ${iface} | grep 'inet ' | awk '{print $2}'`)
      return `${wifi.ssid ?? "unknown"} · ${iface}\nIP: ${ip.trim()}\nSignal: ${wifi.strength}%`
    } catch {
      return `${wifi.ssid ?? "unknown"} · ${iface}\nSignal: ${wifi.strength}%`
    }
  }

  return "Not connected"
}

export default function Network() {
  const label = createPoll("", 2000, getLabel)
  const tooltip = createPoll("", 5000, getTooltip)

  return (
    <BubbleButton name="network" tooltip={tooltip}>
      <label label={label} />
    </BubbleButton>
  )
}
