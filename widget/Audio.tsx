import AstalWp from "gi://AstalWp"
import { createBinding } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"

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

  const label = volume.as(() => {
    const v = volume.peek()
    const m = muted.peek()
    return `${volumeIcon(v, m)}  ${Math.round(v * 100)}%`
  })

  const gesture = new Gtk.GestureClick()
  gesture.button = 0
  gesture.connect("pressed", (_g: Gtk.GestureClick, _n: number, _x: number, _y: number) => {
    const button = gesture.get_current_button()
    if (button === 1) execAsync("pwvucontrol")
    if (button === 3) speaker.set_mute(!speaker.get_mute())
  })

  const scroll = new Gtk.EventControllerScroll()
  scroll.flags = Gtk.EventControllerScrollFlags.VERTICAL
  scroll.connect("scroll", (_s: Gtk.EventControllerScroll, _dx: number, dy: number) => {
    const current = speaker.get_volume()
    speaker.set_volume(Math.max(0, Math.min(1, current - dy * 0.05)))
  })

  return (
    <button
      cssClasses={["bubble", "audio"]}
      $={(self) => {
        self.add_controller(gesture)
        self.add_controller(scroll)
      }}
    >
      <label label={label} />
    </button>
  )
}