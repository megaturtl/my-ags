import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { brightnessIcon, volumeIcon } from "../../utils"
import { osdState } from "./state"

export default function Osd(gdkmonitor: Gdk.Monitor) {
  const visible = osdState.as((s) => s.visible)
  const klass = osdState.as((s) => {
    const parts = ["osd", s.kind]
    if (s.kind === "volume" && s.muted) parts.push("muted")
    return parts.join(" ")
  })
  const icon = osdState.as((s) =>
    s.kind === "volume" ? volumeIcon(s.value, s.muted) : brightnessIcon(s.value),
  )
  const value = osdState.as((s) => s.value)
  const pct = osdState.as((s) =>
    s.kind === "volume" && s.muted ? "muted" : `${Math.round(s.value * 100)}%`,
  )

  return (
    <window
      name="osd"
      cssName="Osd"
      gdkmonitor={gdkmonitor}
      application={app}
      visible={visible}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.NONE}
      exclusivity={Astal.Exclusivity.NONE}
      anchor={Astal.WindowAnchor.TOP}
    >
      <box class={klass} spacing={14}>
        <label class="osd-icon" label={icon} />
        <Gtk.LevelBar value={value} maxValue={1} hexpand valign={Gtk.Align.CENTER} />
        <label class="osd-pct" label={pct} />
      </box>
    </window>
  )
}
