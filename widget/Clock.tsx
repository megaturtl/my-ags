import { createPoll } from "ags/time"

export default function Clock() {
  const time = createPoll("", 1000, "date '+%H:%M · %a %b %d'")

  return (
    <box cssClasses={["bubble", "clock"]}>
      <label label={time} />
    </box>
  )
}