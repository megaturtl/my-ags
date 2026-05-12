import { createBinding, createComputed } from "ags"
import { Gtk } from "ags/gtk4"
import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"

const device = AstalBattery.Device.get_default()
const profiles = AstalPowerProfiles.get_default()

const present = !!(device?.isBattery && device?.powerSupply)

const batteryIcon = (pct: number, charging: boolean): string => {
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

const profileIcon = (p: string): string =>
  p === "power-saver" ? "󰌪" : p === "performance" ? "󱐋" : "󰾅"

const formatTime = (secs: number): string => {
  if (secs <= 0) return ""
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const profileOrder = ["power-saver", "balanced", "performance"]

const cycleProfile = () => {
  if (!profiles) return
  const idx = profileOrder.indexOf(profiles.activeProfile)
  profiles.set_active_profile(profileOrder[(idx + 1) % profileOrder.length])
}

export const Battery = () => {
  if (!present || !device) return <box />

  const percentage = createBinding(device, "percentage")
  const charging = createBinding(device, "charging")
  const timeToEmpty = createBinding(device, "timeToEmpty")
  const timeToFull = createBinding(device, "timeToFull")
  const profile = profiles ? createBinding(profiles, "activeProfile") : null

  // percentage is 0.0-1.0, so multiply by 100 for display
  const pct = createComputed(() => Math.round(percentage() * 100))

  const klass = createComputed(() => {
    if (charging()) return "battery charging"
    if (pct() <= 15) return "battery critical"
    if (pct() <= 30) return "battery low"
    return "battery"
  })

  const battLabel = createComputed(() =>
    `${batteryIcon(pct(), charging())} ${pct()}%`
  )

  const profileLabel = profile ? profile.as(profileIcon) : ""

  const tooltip = createComputed(() => {
    const c = charging()
    const p = profile?.() ?? "balanced"
    const timeStr = c
      ? timeToFull() > 0
        ? `Full in ${formatTime(timeToFull())}`
        : "Charging"
      : timeToEmpty() > 0
        ? `${formatTime(timeToEmpty())} remaining`
        : ""
    return [`Battery: ${pct()}%`, timeStr, `Profile: ${p}`]
      .filter(Boolean)
      .join("\n")
  })

  return (
    <Gtk.Button class={klass} tooltipText={tooltip} onClicked={cycleProfile}>
      <box spacing={4}>
        <label class="batt" label={battLabel} />
        <label class="profile" label={profileLabel} />
      </box>
    </Gtk.Button>
  )
}