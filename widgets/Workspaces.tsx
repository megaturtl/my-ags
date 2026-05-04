import { createComputed, For } from "ags"
import { windowIcon } from "../lib/pure"
import { workspaces, focusedWorkspace, clients, dispatch } from "../services/hyprland"
import { PERSISTENT_WORKSPACES } from "../config"
import { Bubble } from "./Bubble"

const allIds = workspaces.as(ws => {
  const active = ws.map(w => w.get_id())
  return [...new Set([...PERSISTENT_WORKSPACES, ...active])].sort((a, b) => a - b)
})

function Workspace({ id }: { id: number }) {
  const isActive = focusedWorkspace(ws => ws?.get_id() === id)
  const idClients = clients(cs => cs.filter(c => c.get_workspace()?.get_id() === id))
  const isEmpty = idClients(cs => cs.length === 0)

  const icons = idClients(cs =>
    cs.map(c => windowIcon(c.get_class?.() ?? "", c.get_title?.() ?? "")).join(""),
  )

  const name = createComputed(() => {
    const parts = ["workspace"]
    if (isActive()) parts.push("active")
    if (isEmpty()) parts.push("empty")
    return parts.join(" ")
  })

  const tooltip = icons(i => i ? `Workspace ${id}\n${i.trim()}` : `Workspace ${id}`)
  const label = icons(i => i ? `${id}${i}` : String(id))

  return (
    <Bubble
      name={name}
      tooltip={tooltip}
      label={label}
      onLeftClick={() => dispatch("workspace", String(id))}
      onScroll={(dy) => dispatch("workspace", dy > 0 ? "+1" : "-1")}
    />
  )
}

export default function Workspaces() {
  return (
    <box cssClasses={["workspaces"]}>
      <For each={allIds}>
        {(id: number) => <Workspace id={id} />}
      </For>
    </box>
  )
}
