import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import { createExternal } from "ags"
import { tick } from "./ticker"

const device = AstalBattery.Device.get_default()
const profiles = AstalPowerProfiles.get_default()

export const present = !!(device?.isBattery && device?.powerSupply)

export type BatteryState = {
  percentage: number
  charging: boolean
  profile: string
  wattage: number
  timeToEmpty: number
  timeToFull: number
}

const initial: BatteryState = {
  percentage: 0,
  charging: false,
  profile: "balanced",
  wattage: 0,
  timeToEmpty: 0,
  timeToFull: 0,
}

export const state = createExternal<BatteryState>(initial, (set) => {
  return tick.subscribe(() => {
    set({
      percentage: Math.round((device?.percentage ?? 0) * 100),
      charging: device?.charging ?? false,
      wattage: device?.energy_rate ?? 0,
      profile: profiles?.activeProfile ?? "balanced",
      timeToEmpty: device?.timeToEmpty ?? 0,
      timeToFull: device?.timeToFull ?? 0,
    })
  })
})

function batteryIcon(pct: number, charging: boolean): string {
  if (charging) return "󰂄"
  if (pct >= 90) return "󰁹"
  if (pct >= 80) return "󰂂"
  if (pct >= 70) return "󰂁"
  if (pct >= 60) return "󰂀"
  if (pct >= 50) return "󰁿"
  if (pct >= 40) return "󰁾"
  if (pct >= 30) return "󰁽"
  if (pct >= 20) return "󰁼"
  if (pct >= 10) return "󰁻"
  return "󰂃"
}

function profileIcon(profile: string): string {
  switch (profile) {
    case "power-saver": return "󰌪"
    case "performance": return "󱐋"
    default: return "󰾅"
  }
}

function formatTime(secs: number): string {
  if (secs <= 0) return ""
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const battLabel = state.as(s =>
  `${batteryIcon(s.percentage, s.charging)} ${s.percentage}%`
)

export const profileLabel = state.as(s => profileIcon(s.profile))

export const tooltip = state.as(s => {
  const timeStr = s.charging
    ? (s.timeToFull > 0 ? `Full in ${formatTime(s.timeToFull)}` : "Charging")
    : (s.timeToEmpty > 0 ? `${formatTime(s.timeToEmpty)} remaining` : "")

  return [
    `Battery: ${s.percentage}%`,
    `Energy: ${s.wattage}W`,
    timeStr,
    `Profile: ${s.profile}`,
  ].filter(Boolean).join("\n")
})

const profileOrder = ["power-saver", "balanced", "performance"]

export function cycleProfile() {
  if (!profiles) return
  const current = profiles.activeProfile
  const idx = profileOrder.indexOf(current)
  profiles.set_active_profile(profileOrder[(idx + 1) % profileOrder.length])
}
