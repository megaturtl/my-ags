import AstalHyprland from "gi://AstalHyprland"
import { createBinding } from "ags"
import { For } from "ags"
import { BubbleButton } from "./BubbleButton"

const hyprland = AstalHyprland.get_default()

// Matches waybar's window-rewrite rules
function windowIcon(client: AstalHyprland.Client): string {
  const cls = client.get_class?.() ?? ""
  const title = client.get_title?.() ?? ""

  if (/bitwarden/i.test(cls)) return "   "
  if (/stremio/i.test(cls)) return " 󰎁 "
  if (/firefox|librewolf/i.test(cls)) return " 󰈹 "
  if (/zen/i.test(cls)) return " 󰈹 "
  if (/kitty|konsole|ghostty|wezterm/i.test(cls)) return "  "
  if (/thunderbird/i.test(cls)) return "   "
  if (/gmail/i.test(title)) return " 󰊫 "
  if (/discord|webcord|vesktop/i.test(cls)) return "  "
  if (/youtube/i.test(title)) return "   "
  if (/vlc/i.test(cls)) return " 󰕼 "
  if (/spotify/i.test(cls)) return " 󰓇 "
  if (/minecraft/i.test(cls)) return " 󰍳 "
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
  if (/tauon|audacious/i.test(cls)) return " 󰝚 "
  if (/electron/i.test(cls)) return " 󰠮 "
  return ""
}

const PERSISTENT_WORKSPACES = [1, 2, 3, 4, 5]

function Workspace({ id }: { id: number }) {
  const workspaces = createBinding(hyprland, "workspaces")
  const focusedWs = createBinding(hyprland, "focusedWorkspace")
  const clients = createBinding(hyprland, "clients")

  const isActive = focusedWs(ws => ws?.get_id() === id)
  const isEmpty = clients(cs => !cs.some(c => c.get_workspace()?.get_id() === id))

  const icons = clients(cs =>
    cs
      .filter(c => c.get_workspace()?.get_id() === id)
      .map(windowIcon)
      .join("")
  )

  const name = focusedWs(ws => {
  const active = ws?.get_id() === id
  const empty = !clients.get().some(c => c.get_workspace()?.get_id() === id)
  return `workspace ${active ? "active" : ""} ${empty ? "empty" : ""}`.trim()
})

  const tooltip = icons(i =>
    i ? `Workspace ${id}\n${i.trim()}` : `Workspace ${id}`
  )

  return (
    <BubbleButton
      name={name}
      tooltip={tooltip}
      onLeftClick={() => hyprland.dispatch("workspace", String(id))}
      onScroll={(dy) => {
        if (dy > 0) hyprland.dispatch("workspace", "+1")
        else hyprland.dispatch("workspace", "-1")
      }}
    >
      <label label={icons(i => i ? `${id}${i}` : String(id))} />
    </BubbleButton>
  )
}

export default function Workspaces() {
  return (
    <box cssClasses={["workspaces"]}>
      <For each={createBinding(hyprland, "workspaces").as(() => PERSISTENT_WORKSPACES)}>
        {(id: number) => <Workspace id={id} />}
      </For>
    </box>
  )
}