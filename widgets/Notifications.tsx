import { execAsync, subprocess } from "ags/process"
import { createState } from "ags"
import { BubbleButton } from "./BubbleButton"

type SwayncState = {
  count: number
  dnd: boolean
}

function icon(state: SwayncState): string {
  if (state.dnd) return "󰂛"
  if (state.count > 0) return "󰂚"
  return "󰂜"
}

async function getState(): Promise<SwayncState> {
  const [count, dnd] = await Promise.all([
    execAsync("swaync-client -c").then(Number).catch(() => 0),
    execAsync("swaync-client -D").then(s => s.trim() === "true").catch(() => false),
  ])
  return { count, dnd }
}

export default function Notifications() {
  const [state, setState] = createState<SwayncState>({ count: 0, dnd: false })

  getState().then(setState)

  subprocess(
    ["swaync-client", "--subscribe"],
    () => getState().then(setState),
  )

  const tooltip = state(s => [
    `${s.count} notification${s.count !== 1 ? "s" : ""}`,
    `Do Not Disturb: ${s.dnd ? "on" : "off"}`,
    "────────────────",
    "Left · toggle panel",
    "Right · clear all",
  ].join("\n"))

  return (
    <BubbleButton
      name="notifications"
      tooltip={tooltip}
      onLeftClick={() => execAsync("swaync-client -t -sw")}
      onRightClick={() => execAsync("swaync-client -C")}
    >
      <label label={state(s => `${icon(s)}  ${s.count}`)} />
    </BubbleButton>
  )
}
