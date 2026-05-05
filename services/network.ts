import AstalNetwork from "gi://AstalNetwork"
import { readFile } from "ags/file"
import { createExternal } from "ags"
import { execAsync } from "ags/process"
import { wifiIcon, formatSpeed } from "../lib/pure"
import { tick } from "./ticker"

const network = AstalNetwork.get_default()

type RawStats = { rx: number; tx: number }

function readIfaceBytes(iface: string): RawStats {
  if (!iface) return { rx: 0, tx: 0 }
  const lines = readFile("/proc/net/dev").split("\n")
  const line = lines.find(l => l.trim().startsWith(iface + ":"))
  if (!line) return { rx: 0, tx: 0 }
  const parts = line.trim().split(/\s+/)
  return { rx: parseInt(parts[1], 10), tx: parseInt(parts[9], 10) }
}

export type NetState =
  | { kind: "wired"; iface: string }
  | { kind: "wifi"; iface: string; ssid: string; strength: number; rxRate: number; txRate: number }
  | { kind: "offline" }

const offline: NetState = { kind: "offline" }

export const state = createExternal<NetState>(offline, (set) => {
  let prev: { rx: number; tx: number; time: number } | null = null
  return tick.subscribe(() => {
    const wired = network.wired
    if (wired?.get_device()?.state === AstalNetwork.DeviceState.ACTIVATED) {
      prev = null
      const iface = wired.get_device()?.get_iface() ?? "eth"
      set({ kind: "wired", iface })
      return
    }

    const wifi = network.wifi
    if (wifi) {
      const iface = wifi.get_device()?.get_iface() ?? ""
      const curr = readIfaceBytes(iface)
      const now = Date.now()
      let rxRate = 0, txRate = 0
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

export const label = state.as(s => {
  if (s.kind === "wired") return "󰈀 LAN"
  if (s.kind === "offline") return "󰤭 Offline"
  return `${wifiIcon(s.strength)}  ⇣ ${formatSpeed(s.rxRate)} ⇡ ${formatSpeed(s.txRate)}`
})

// IP lookup is not on a poll interval — it runs once when the iface
// changes. The state stream still drives strength/SSID into the tooltip
// via a cached `lastIp`.
export const tooltip = createExternal<string>("Not connected", (set) => {
  let cancelled = false
  let lastIface = ""
  let lastIp = ""

  function emit(s: NetState) {
    if (s.kind === "offline") { set("Not connected"); return }
    if (s.kind === "wired") {
      set(lastIp ? `${s.iface}\n${lastIp}` : s.iface)
      return
    }
    const head = `${s.ssid} · ${s.iface}`
    const ipLine = lastIp ? `\nIP: ${lastIp}` : ""
    set(`${head}${ipLine}\nSignal: ${s.strength}%`)
  }

  function refresh(s: NetState) {
    if (s.kind !== "offline" && s.iface !== lastIface) {
      lastIface = s.iface
      lastIp = ""
      execAsync(`ip -4 addr show ${s.iface} | grep 'inet ' | awk '{print $2}'`)
        .then(ip => {
          if (cancelled) return
          lastIp = ip.trim()
          emit(state.peek())
        })
        .catch(() => {})
    }
    if (s.kind === "offline") { lastIface = ""; lastIp = "" }
    emit(s)
  }

  refresh(state.peek())
  const off = state.subscribe(() => refresh(state.peek()))
  return () => { cancelled = true; off() }
})
