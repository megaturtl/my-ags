import AstalWp from "gi://AstalWp"
import { createBinding, createComputed } from "ags"
import { execAsync } from "ags/process"
import { BubbleButton } from "./BubbleButton"

const wp = AstalWp.get_default()
const speaker = wp?.get_default_speaker()

function volumeIcon(volume: number, muted: boolean): string {
  if (muted) return "󰝟"
  if (volume > 0.66) return "󰕾"
  if (volume > 0.33) return "󰖀"
  return "󰕿"
}

export default function Audio() {
  if (!speaker) return <box />

  const volume = createBinding(speaker, "volume")
  const muted = createBinding(speaker, "mute")

  const label = createComputed(() => {
    const v = volume()
    const m = muted()
    return `${volumeIcon(v, m)}  ${Math.round(v * 100)}%`
  })

  const tooltip = createComputed(() => [
    `Volume: ${Math.round(volume() * 100)}%`,
    `Muted: ${muted() ? "yes" : "no"}`,
    "────────────────",
    "Left · open mixer",
    "Right · toggle mute",
    "Scroll · adjust volume",
  ].join("\n"))

  return (
    <BubbleButton
      name="audio"
      tooltip={tooltip}
      onLeftClick={() => execAsync("pwvucontrol")}
      onRightClick={() => speaker.set_mute(!speaker.get_mute())}
      onScroll={(dy) => {
        const current = speaker.get_volume()
        speaker.set_volume(Math.max(0, Math.min(1, current - dy * 0.05)))
      }}
    >
      <label label={label} />
    </BubbleButton>
  )
}
