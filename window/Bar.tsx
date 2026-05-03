import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import Clock from "../widget/Clock"
import Network from "../widget/Network"
import Notifications from "../widget/Notifications"
import Tray from "../widget/Tray"
import Power from "../widget/Power"
import Hardware from "../widget/Hardware"
import Workspaces from "../widget/Workspaces"
import Mpris from "../widget/Mpris"
import Audio from "../widget/Audio"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      cssName="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>
        <box $type="start" hexpand halign={Gtk.Align.START}>
          <Workspaces />
          <Mpris />
        </box>
        <box $type="center">
          <Notifications />
          <Clock />
        </box>
        <box $type="end" hexpand halign={Gtk.Align.END}>
          <Tray />
          <Hardware />
          <Audio />
          <Network />
          <Power />
        </box>
      </centerbox>

    </window>
  )
}