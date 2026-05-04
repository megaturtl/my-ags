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

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)}M`
  if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)}K`
  return `${bytesPerSec}B`
}

type NetStats = { rx: number; tx: number }

function readIfaceBytes(iface: string): NetStats {
  const lines = readFile("/proc/net/dev").split("\n")
  const line = lines.find(l => l.trim().startsWith(iface + ":"))
  if (!line) return { rx: 0, tx: 0 }
  const parts = line.trim().split(/\s+/)
  return { rx: Number(parts[1]), tx: Number(parts[9]) }
}

let prev: NetStats = { rx: 0, tx: 0 }

function getLabel(): string {
  const wifi = network.wifi
  const wired = network.wired

  if (wired?.get_device()?.state === AstalNetwork.DeviceState.ACTIVATED) {
    return `󰈀  ethernet`
  }

  if (wifi) {
    const iface = wifi.get_device()?.get_iface() ?? ""
    const curr = readIfaceBytes(iface)
    const rx = Math.max(0, curr.rx - prev.rx)
    const tx = Math.max(0, curr.tx - prev.tx)
    prev = curr

    const speed = rx + tx > 0
      ? `  ⇣${formatSpeed(rx)} ⇡${formatSpeed(tx)}`
      : ""

    return `${wifiIcon(wifi.strength)}  ${wifi.ssid ?? "unknown"}${speed}`
  }

  return "󰤭  offline"
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
  const label = createPoll("", 1000, getLabel)
  const tooltip = createPoll("", 5000, getTooltip)

  return (
    <BubbleButton name="network" tooltip={tooltip}>
      <label label={label} />
    </BubbleButton>
  )
}
