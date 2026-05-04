import { createComputed } from "ags"
import { notifIcon } from "../lib/pure"
import { count, dnd, tooltip, togglePanel, clearAll } from "../services/notifications"
import { Bubble } from "./Bubble"

export default function Notifications() {
  const label = createComputed(() => `${notifIcon(count(), dnd())} ${count()}`)

  return (
    <Bubble
      name="notifications"
      tooltip={tooltip}
      label={label}
      onLeftClick={togglePanel}
      onRightClick={clearAll}
    />
  )
}
