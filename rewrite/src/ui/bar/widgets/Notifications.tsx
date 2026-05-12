import { createComputed, createState } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync, subprocess } from "ags/process"
import { DIVIDER, onRightClick } from "../../../utils"

const notifIcon = (c: number, dnd: boolean) => (dnd ? "󰂛" : c > 0 ? "󰂚" : "󰂜")

const [state, setState] = createState({ count: 0, dnd: false })

const refresh = async () => {
  const [count, dnd] = await Promise.all([
    execAsync("swaync-client -c")
      .then(Number)
      .catch(() => 0),
    execAsync("swaync-client -D")
      .then((s) => s.trim() === "true")
      .catch(() => false),
  ])
  setState({ count, dnd })
}

refresh()
subprocess(["swaync-client", "--subscribe"], () => refresh())

const togglePanel = () => execAsync("swaync-client -t -sw").catch(() => {})
const clearAll = () => execAsync("swaync-client -C").catch(() => {})

export const Notifications = () => {
  const klass = state.as((s) => (s.dnd ? "notifications dnd" : "notifications"))
  const label = state.as((s) => `${notifIcon(s.count, s.dnd)} ${s.count}`)
  const tooltip = createComputed(() => {
    const { count, dnd } = state()
    return [
      `${count} notification${count !== 1 ? "s" : ""}`,
      `Do Not Disturb: ${dnd ? "on" : "off"}`,
      DIVIDER,
      "Left · toggle panel",
      "Right · clear all",
    ].join("\n")
  })

  return (
    <Gtk.Button
      class={klass}
      label={label}
      tooltipText={tooltip}
      onClicked={togglePanel}
    >
      {onRightClick(clearAll)}
    </Gtk.Button>
  )
}
