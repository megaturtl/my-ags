import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { Audio } from "./widgets/Audio"
import { Battery } from "./widgets/Battery"
import { Clock } from "./widgets/Clock"
import { Hardware } from "./widgets/Hardware"
import { Mpris } from "./widgets/Mpris"
import { Network } from "./widgets/Network"
import { Notifications } from "./widgets/Notifications"
import { Power } from "./widgets/Power"
import { Tray } from "./widgets/Tray"
import { Vpn } from "./widgets/Vpn"
import { Workspaces } from "./widgets/Workspaces"

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
        <box $type="start">
          <Workspaces />
          <Mpris />
        </box>
        <box $type="center">
          <Notifications />
          <Clock />
          <Tray />
        </box>
        <box $type="end">
          <Hardware />
          <Battery />
          <Vpn />
          <Network />
          <Audio />
          <Power />
        </box>
      </centerbox>
    </window>
  )
}
