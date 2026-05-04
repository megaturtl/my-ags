import GLib from "gi://GLib"
import { createPoll } from "ags/time"
import { BubbleButton } from "./BubbleButton"

export default function Clock() {
  const time = createPoll("", 1000, "date '+%H:%M · %a %b %d'")
  const tooltip = createPoll("", 1000, () => {
    const now = GLib.DateTime.new_now_local()
    return [
      now?.format("%H:%M:%S") ?? "",
      now?.format("%A, %-d %B %Y") ?? "",
    ].join("\n")
  })

  return (
    <BubbleButton name="clock" tooltip={tooltip}>
      <label label={time} />
    </BubbleButton>
  )
}
