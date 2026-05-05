import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import Clock from "../widgets/Clock"
import Network from "../widgets/Network"
import Notifications from "../widgets/Notifications"
import Tray from "../widgets/Tray"
import Power from "../widgets/Power"
import Hardware from "../widgets/Hardware"
import Workspaces from "../widgets/Workspaces"
import Mpris from "../widgets/Mpris"
import Audio from "../widgets/Audio"
import Vpn from "../widgets/Vpn"

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
          <Tray />
        </box>
        <box $type="end" hexpand halign={Gtk.Align.END}>
          <Hardware />
          <Vpn />
          <Network />
          <Audio />
          <Power />
        </box>
      </centerbox>

    </window>
  )
}