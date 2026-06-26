import { createBinding, createComputed, createExternal, For } from "ags"
import { Gtk } from "ags/gtk4"
import AstalHyprland from "gi://AstalHyprland"
import GObject from "gi://GObject?version=2.0"
import { PERSISTENT_WORKSPACES } from "../../../config"
import { onVerticalScroll } from "../../../utils"

const { connect, disconnect } = GObject.Object.prototype

const windowIcon = (cls: string, title: string): string => {
  if (/bitwarden/i.test(cls)) return "  "
  if (/stremio/i.test(cls)) return " 󰎁 "
  if (/firefox|librewolf/i.test(cls)) return " 󰈹 "
  if (/zen/i.test(cls)) return " 󰈹 "
  if (/kitty|konsole|ghostty|wezterm|foot|footclient/i.test(cls)) return "  "
  if (/thunderbird/i.test(cls)) return "   "
  if (/gmail/i.test(title)) return " 󰊫 "
  if (/discord|webcord|vesktop/i.test(cls)) return "  "
  if (/youtube/i.test(title)) return "   "
  if (/vlc/i.test(cls)) return " 󰕼 "
  if (/spotify/i.test(cls)) return " 󰓇 "
  if (/minecraft|prismlauncher|waywall/i.test(cls)) return " 󰍳 "
  if (/vscode|codium/i.test(cls)) return " 󰨞 "
  if (/github/i.test(title)) return " 󰊤 "
  if (/nvim/i.test(title)) return "  "
  if (/vim/i.test(title)) return "  "
  if (/jetbrains-idea/i.test(cls)) return "  "
  if (/polkit/i.test(cls)) return " 󰒃 "
  if (/pavucontrol|pwvucontrol/i.test(cls)) return " 󱡫 "
  if (/steam/i.test(cls)) return " 󰓓 "
  if (/dolphin|thunar|nemo/i.test(cls)) return " 󰉋 "
  if (/gimp/i.test(cls)) return "  "
  if (/tauon|feishin|audacious/i.test(cls)) return " 󰝚 "
  if (/logseq|affine|obsidian/i.test(cls)) return " 󰠮 "
  return ""
}

const hyprland = AstalHyprland.get_default()
const workspaces = createBinding(hyprland, "workspaces")
const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")

const clients = createExternal(hyprland.get_clients(), (set) => {
  const update = () => set([...hyprland.get_clients()])
  const watchers = new Map<AstalHyprland.Client, number>()

  const watch = (c: AstalHyprland.Client) => {
    if (!watchers.has(c)) {
      watchers.set(c, connect.call(c, "notify::workspace", update))
    }
  }

  hyprland.get_clients().forEach(watch)
  const id = connect.call(hyprland, "notify::clients", () => {
    const current = hyprland.get_clients()
    for (const [c, sigId] of watchers) {
      if (!current.includes(c)) {
        disconnect.call(c, sigId)
        watchers.delete(c)
      }
    }
    current.forEach(watch)
    update()
  })

  return () => {
    disconnect.call(hyprland, id)
    watchers.forEach((sigId, c) => disconnect.call(c, sigId))
    watchers.clear()
  }
})

const allIds = workspaces.as((ws) => {
  const active = ws.map((w) => w.get_id())
  return [...new Set([...PERSISTENT_WORKSPACES, ...active])].sort(
    (a, b) => a - b,
  )
})

const Workspace = ({ id }: { id: number }) => {
  const isActive = focusedWorkspace.as((ws) => ws?.get_id() === id)
  const idClients = clients.as((cs) =>
    cs.filter((c) => c.get_workspace()?.get_id() === id),
  )
  const isEmpty = idClients.as((cs) => cs.length === 0)
  const icons = idClients.as((cs) =>
    cs
      .map((c) => windowIcon(c.get_class?.() ?? "", c.get_title?.() ?? ""))
      .join(""),
  )

  const klass = createComputed(() => {
    const parts = ["workspace"]
    if (isActive()) parts.push("active")
    if (isEmpty()) parts.push("empty")
    return parts.join(" ")
  })

  const tooltip = icons.as((i) =>
    i ? `Workspace ${id}\n${i.trim()}` : `Workspace ${id}`,
  )
  const label = icons.as((i) => (i ? `${id}${i}` : String(id)))

  return (
    <Gtk.Button
      class={klass}
      label={label}
      tooltipText={tooltip}
      onClicked={() => hyprland.dispatch("workspace", String(id))}
    >
      {onVerticalScroll(dy => hyprland.dispatch("workspace", dy > 0 ? "+1" : "-1"))}
    </Gtk.Button>
  )
}

export const Workspaces = () => (
  <box class="workspaces">
    <For each={allIds}>{(id: number) => <Workspace id={id} />}</For>
  </box>
)
