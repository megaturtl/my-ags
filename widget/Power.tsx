import { execAsync } from "ags/process"
import { Gtk } from "ags/gtk4"

const gesture = new Gtk.GestureClick()
gesture.button = 0
gesture.connect("pressed", (_gesture: Gtk.GestureClick, _nPress: number, _x: number, _y: number) => {
  const button = gesture.get_current_button()
  if (button === 1) execAsync("wlogout")
  if (button === 3) execAsync("hyprlock")
})

export default function PowerButton() {
  return (
    <button
      cssClasses={["bubble", "power"]}
      onClicked={() => execAsync("wlogout")}
      tooltipText="Left click: power menu | Right click: lock"
      $={(self) => self.add_controller(gesture)}
    >
      <label label="󰐥" />
    </button>
  )
}