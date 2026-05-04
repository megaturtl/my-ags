import GLib from "gi://GLib"
import { createPoll } from "ags/time"
import { Bubble } from "./Bubble"

// Both pollers are cheap GLib calls — no shell spawn. createPoll only
// fires subscribers when the formatted string changes, so the visible
// label re-renders once per minute and the tooltip once per second.
const time = createPoll("", 1000, () => {
  const now = GLib.DateTime.new_now_local()
  return now?.format("%H:%M · %a %b %d") ?? ""
})

const tooltip = createPoll("", 1000, () => {
  const now = GLib.DateTime.new_now_local()
  return [
    now?.format("%H:%M:%S") ?? "",
    now?.format("%A, %-d %B %Y") ?? "",
  ].join("\n")
})

export default function Clock() {
  return <Bubble name="clock" tooltip={tooltip} label={time} />
}
