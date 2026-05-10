import { createBinding, createComputed } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import AstalWp from "gi://AstalWp"
import { DIVIDER, onRightClick, onVerticalScroll } from "../../../utils"

const volumeIcon = (v: number, m: boolean) => {
  if (m) return "󰝟"
  if (v > 0.66) return "󰕾"
  if (v > 0.33) return "󰖀"
  return "󰕿"
}

const speaker = AstalWp.get_default()?.get_default_speaker() ?? null

export const Audio = () => {
  if (!speaker) return <box />

  const volume = createBinding(speaker, "volume")
  const muted = createBinding(speaker, "mute")
  const description = createBinding(speaker, "description")

  const label = createComputed(
    () => `${volumeIcon(volume(), muted())} ${Math.round(volume() * 100)}%`,
  )
  const tooltip = createComputed(() =>
    [
      `Device: ${description()}`,
      `Muted: ${muted() ? "yes" : "no"}`,
      DIVIDER,
      "Left · open mixer",
      "Right · toggle mute",
      "Scroll · adjust volume",
    ].join("\n"),
  )

  return (
    <Gtk.Button
      class="audio"
      label={label}
      tooltipText={tooltip}
      onClicked={() => execAsync("pwvucontrol").catch(print)}
    >
      {onRightClick(() => speaker.set_mute(!speaker.get_mute()))}
      {onVerticalScroll(dy => {
        const v = speaker.get_volume()
        speaker.set_volume(Math.max(0, Math.min(1, v - dy * 0.05)))
      })}
    </Gtk.Button>
  )
}
