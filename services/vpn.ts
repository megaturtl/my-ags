import { createExternal } from "ags"
import { execAsync } from "ags/process"
import { tick } from "./ticker"

const SERVICE = "wg-quick-wg-home"

export type VpnState = {
  active: boolean
  iface: string
  ip: string
}

const initial: VpnState = { active: false, iface: "", ip: "" }

export const state = createExternal<VpnState>(initial, (set) => {
  let busy = false
  return tick.subscribe(() => {
    if (busy) return
    busy = true
    execAsync(`systemctl is-active ${SERVICE}`)
      .then(() => true).catch(() => false)
      .then(async (active) => {
        if (!active) { set({ active: false, iface: "", ip: "" }); return }
        const linkOut = await execAsync("ip -o link show type wireguard").catch(() => "")
        const iface = linkOut.match(/^\d+:\s+(\S+?)[@:]/m)?.[1] ?? "wg0"
        const addrOut = await execAsync(`ip -4 addr show ${iface}`).catch(() => "")
        const ip = addrOut.match(/inet\s+(\S+)/)?.[1] ?? ""
        set({ active: true, iface, ip })
      })
      .finally(() => { busy = false })
  })
})

export const label = state.as(s => s.active ? "󰒃 On" : "󰒃 Off")

export const tooltip = state.as(s => {
  if (!s.active) {
    return [
      "VPN: Inactive",
      "────────────────",
      "Click to connect",
    ].join("\n")
  }
  return [
    "VPN: Active",
    s.iface ? `Interface: ${s.iface}` : null,
    s.ip    ? `IP: ${s.ip}` : null,
    "────────────────",
    "Click to disconnect",
  ].filter(Boolean).join("\n")
})

// Requires pkexec/polkit or a sudoers NOPASSWD rule for systemctl start/stop.
export function toggle() {
  const { active } = state.peek()
  execAsync(`pkexec systemctl ${active ? "stop" : "start"} ${SERVICE}`).catch(print)
}
