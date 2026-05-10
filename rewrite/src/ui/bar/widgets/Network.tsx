import { createExternal } from "ags"
import { readFile } from "ags/file"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import AstalNetwork from "gi://AstalNetwork"
import { tick } from "../../../utils"

const wifiIcon = (s: number): string =>
  s > 80 ? "󰤨" : s > 60 ? "󰤥" : s > 40 ? "󰤢" : "󰤟"

// Always returns 4 chars so the speed section never changes width
const formatSpeed = (bps: number): string => {
  if (bps >= 1024 * 1024) {
    const m = bps / 1024 / 1024
    return m >= 100
      ? `${Math.round(m)}M`
      : m >= 10
        ? `${m.toFixed(1)}M`
        : `${m.toFixed(2)}M`
  }
  if (bps >= 1024) {
    const k = bps / 1024
    return k >= 100
      ? `${Math.round(k)}K`
      : k >= 10
        ? `${k.toFixed(1)}K`
        : `${k.toFixed(2)}K`
  }
  const b = Math.round(bps)
  return b >= 100 ? `${b}B` : b >= 10 ? ` ${b}B` : `  ${b}B`
}

const network = AstalNetwork.get_default()

const readIfaceBytes = (iface: string): { rx: number; tx: number } => {
  if (!iface) return { rx: 0, tx: 0 }
  const line = readFile("/proc/net/dev")
    .split("\n")
    .find((l) => l.trim().startsWith(iface + ":"))
  if (!line) return { rx: 0, tx: 0 }
  const parts = line.trim().split(/\s+/)
  return { rx: parseInt(parts[1], 10), tx: parseInt(parts[9], 10) }
}

type NetState =
  | { kind: "wired"; iface: string }
  | {
      kind: "wifi"
      iface: string
      ssid: string
      strength: number
      rxRate: number
      txRate: number
    }
  | { kind: "offline" }

const offline: NetState = { kind: "offline" }

const state = createExternal<NetState>(offline, (set) => {
  let prev: { rx: number; tx: number; time: number } | null = null
  return tick.subscribe(() => {
    const wired = network.wired
    if (wired?.get_device()?.state === AstalNetwork.DeviceState.ACTIVATED) {
      prev = null
      set({ kind: "wired", iface: wired.get_device()?.get_iface() ?? "eth" })
      return
    }
    const wifi = network.wifi
    if (wifi) {
      const iface = wifi.get_device()?.get_iface() ?? ""
      const curr = readIfaceBytes(iface)
      const now = Date.now()
      let rxRate = 0,
        txRate = 0
      if (prev) {
        const dt = (now - prev.time) / 1000
        if (dt > 0) {
          rxRate = Math.max(0, curr.rx - prev.rx) / dt
          txRate = Math.max(0, curr.tx - prev.tx) / dt
        }
      }
      prev = { ...curr, time: now }
      set({
        kind: "wifi",
        iface,
        ssid: wifi.ssid ?? "unknown",
        strength: wifi.strength,
        rxRate,
        txRate,
      })
      return
    }
    prev = null
    set(offline)
  })
})

const label = state.as((s) => {
  if (s.kind === "wired") return "󰈀 LAN"
  if (s.kind === "offline") return "󰤭 Offline"
  return `${wifiIcon(s.strength)}  ⇣ ${formatSpeed(s.rxRate)} ⇡ ${formatSpeed(s.txRate)}`
})

// IP lookup runs once per iface change (not per tick).
const tooltip = createExternal<string>("Not connected", (set) => {
  let cancelled = false
  let lastIface = ""
  let lastIp = ""

  const emit = (s: NetState) => {
    if (s.kind === "offline") {
      set("Not connected")
      return
    }
    if (s.kind === "wired") {
      set(lastIp ? `${s.iface}\n${lastIp}` : s.iface)
      return
    }
    const ipLine = lastIp ? `\nIP: ${lastIp}` : ""
    set(`${s.ssid} · ${s.iface}${ipLine}\nSignal: ${s.strength}%`)
  }

  const refresh = (s: NetState) => {
    if (s.kind !== "offline" && s.iface !== lastIface) {
      lastIface = s.iface
      lastIp = ""
      execAsync(`ip -4 addr show ${s.iface} | grep 'inet ' | awk '{print $2}'`)
        .then((ip) => {
          if (cancelled) return
          lastIp = ip.trim()
          emit(state.get())
        })
        .catch(() => {})
    }
    if (s.kind === "offline") {
      lastIface = ""
      lastIp = ""
    }
    emit(s)
  }

  refresh(state.get())
  const off = state.subscribe(() => refresh(state.get()))
  return () => {
    cancelled = true
    off()
  }
})

export const Network = () => (
  <Gtk.Button class="network" label={label} tooltipText={tooltip} />
)
