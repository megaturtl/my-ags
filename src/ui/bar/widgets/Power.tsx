import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { onRightClick } from "../../../utils"

export const Power = () => (
  <Gtk.Button
    class="power"
    label="󰐥"
    tooltipText={"Left · power menu (wlogout)\nRight · lock screen (hyprlock)"}
    onClicked={() => execAsync("wlogout")}
  >
    {onRightClick(() => execAsync("hyprlock"))}
  </Gtk.Button>
)
