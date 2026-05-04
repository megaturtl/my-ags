import { createComputed } from "ags"
import { execAsync } from "ags/process"
import { volumeIcon } from "../lib/pure"
import { speaker, volume, muted, description } from "../services/audio"
import { Bubble } from "./Bubble"

export default function Audio() {
  // Ensure the service objects exist before trying to create bindings
  if (!speaker || !volume || !muted || !description) return <box />

  const label = createComputed(() => {
    // Fallback values during computation
    const v = volume?.() ?? 0
    const m = muted?.() ?? false
    return `${volumeIcon(v, m)} ${Math.round(v * 100)}%`
  })

  const tooltip = createComputed(() => [
    `Device: ${description?.() ?? "Unknown"}`,
    `Muted: ${muted?.() ? "yes" : "no"}`,
    "────────────────",
    "Left · open mixer",
    "Right · toggle mute",
    "Scroll · adjust volume",
  ].join("\n"))

  return (
    <Bubble
      name="audio"
      tooltip={tooltip}
      label={label}
      onLeftClick={() => execAsync("pwvucontrol").catch(print)}
      onRightClick={() => speaker?.set_mute(!speaker?.get_mute())}
      onScroll={(dy) => {
        const current = speaker?.get_volume() ?? 0
        speaker?.set_volume(Math.max(0, Math.min(1, current - dy * 0.05)))
      }}
    />
  )
}