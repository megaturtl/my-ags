// Notification daemon facade. Today: swaync subprocess. Swap the
// implementation here without touching widgets/Notifications.tsx —
// any future backend (AstalNotifd, mako, dunst…) only needs to provide
// the same exports below.

import { createState, createComputed } from "ags"
import { execAsync, subprocess } from "ags/process"

type State = { count: number; dnd: boolean }

const [state, setState] = createState<State>({ count: 0, dnd: false })

async function refresh() {
  const [count, dnd] = await Promise.all([
    execAsync("swaync-client -c").then(Number).catch(() => 0),
    execAsync("swaync-client -D").then(s => s.trim() === "true").catch(() => false),
  ])
  setState({ count, dnd })
}

refresh()
// One long-running subscription for the lifetime of the shell.
subprocess(["swaync-client", "--subscribe"], () => refresh())

export const count = state.as(s => s.count)
export const dnd = state.as(s => s.dnd)

export const tooltip = createComputed(() => {
  const c = count()
  return [
    `${c} notification${c !== 1 ? "s" : ""}`,
    `Do Not Disturb: ${dnd() ? "on" : "off"}`,
    "────────────────",
    "Left · toggle panel",
    "Right · clear all",
  ].join("\n")
})

export function togglePanel() {
  execAsync("swaync-client -t -sw").catch(() => {})
}

export function clearAll() {
  execAsync("swaync-client -C").catch(() => {})
}
