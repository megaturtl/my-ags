import { execAsync, subprocess } from "ags/process"
import { createState } from "ags"
import { Gtk } from "ags/gtk4"

type SwayncState = {
  count: number
  dnd: boolean
}

function icon(state: SwayncState): string {
  if (state.dnd) return "󰂛"
  if (state.count > 0) return "󰂚"
  return "󰂜"
}

async function getState(): Promise<SwayncState> {
  const [count, dnd] = await Promise.all([
    execAsync("swaync-client -c").then(Number).catch(() => 0),
    execAsync("swaync-client -D").then(s => s.trim() === "true").catch(() => false),
  ])
  return { count, dnd }
}

export default function Notifications() {
  const [state, setState] = createState<SwayncState>({ count: 0, dnd: false })

  getState().then(setState)

  subprocess(
    ["swaync-client", "--subscribe"],
    () => getState().then(setState),
  )

  const gesture = new Gtk.GestureClick()
  gesture.button = 0
  gesture.connect("pressed", (_gesture: Gtk.GestureClick, _nPress: number, _x: number, _y: number) => {
    const button = gesture.get_current_button()
    if (button === 1) execAsync("swaync-client -t -sw")
    if (button === 3) execAsync("swaync-client -C")
  })

  return (
    <button
      cssClasses={["bubble", "notifications"]}
      onClicked={() => execAsync("swaync-client -t -sw")}
      label={state(s => `${icon(s)}  ${s.count}`)}
      $={(self) => self.add_controller(gesture)}
    />
  )
}