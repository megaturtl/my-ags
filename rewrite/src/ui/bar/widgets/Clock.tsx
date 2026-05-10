import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"
import { tick } from "../../../utils"

const getTimeStr = (s: string) =>
  tick.as(() => GLib.DateTime.new_now_local().format(s) ?? "")

export const time_hm = getTimeStr("%H:%M · %a %b %d")
export const time_hms = getTimeStr("%H:%M:%S · %a %b %d")

export const Clock = () => (
  <Gtk.Button
    class="clock"
    label={time_hm}
    tooltipText={time_hms}
    onClicked={() => 0}
  />
)
