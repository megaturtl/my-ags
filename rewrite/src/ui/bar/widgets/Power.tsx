import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"

export const Power = () => (
  <Gtk.Button
    class="power"
    label="󰐥"
    tooltipText={"Left · power menu (wlogout)\nRight · lock screen (hyprlock)"}
    onClicked={() => execAsync("wlogout")}
  >
    <Gtk.GestureClick button={3} onPressed={() => execAsync("hyprlock")} />
  </Gtk.Button>
)
