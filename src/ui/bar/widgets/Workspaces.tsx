import { createComputed, For } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"
import GLib from "gi://GLib"
import { PERSISTENT_WORKSPACES } from "../../../config"
import { onVerticalScroll } from "../../../utils"

type Client = {
  class: string
  title: string
}

type Workspace = {
  id: number
  clients: Client[]
  focused: boolean
}

const isNiri = GLib.getenv("NIRI_SOCKET") !== null
const focusHyprlandWorkspace = (workspace: number | string) =>
  `hyprctl dispatch 'hl.dsp.focus({ workspace = "${workspace}" })'`

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
  if (/obsproject/i.test(cls)) return " 󰄄 "
  return ""
}

const getHyprlandWorkspaces = async (): Promise<Workspace[]> => {
  const [workspaces, active, clients] = await Promise.all([
    execAsync("hyprctl -j workspaces").then(JSON.parse),
    execAsync("hyprctl -j activeworkspace").then(JSON.parse),
    execAsync("hyprctl -j clients").then(JSON.parse),
  ])

  return workspaces.map(({ id }: { id: number }) => ({
    id,
    focused: id === active.id,
    clients: clients
      .filter(({ workspace }: { workspace: { id: number } }) => workspace.id === id)
      .map(({ class: cls, title }: { class: string; title: string }) => ({
        class: cls,
        title,
      })),
  }))
}

const getNiriWorkspaces = async (): Promise<Workspace[]> => {
  const [workspaces, windows] = await Promise.all([
    execAsync("niri msg -j workspaces").then(JSON.parse),
    execAsync("niri msg -j windows").then(JSON.parse),
  ])
  const focused = workspaces.find(({ is_focused }: { is_focused: boolean }) => is_focused)
  const currentOutput = focused?.output

  return workspaces
    .filter(({ output }: { output: string | null }) => output === currentOutput)
    .map(({ id, idx, is_focused }: { id: number; idx: number; is_focused: boolean }) => ({
      id: idx,
      focused: is_focused,
      clients: windows
        .filter(({ workspace_id }: { workspace_id: number }) => workspace_id === id)
        .map(({ app_id, title }: { app_id: string | null; title: string }) => ({
          class: app_id ?? "",
          title,
        })),
    }))
}

const workspaces = createPoll<Workspace[]>([], 1000, () =>
  (isNiri ? getNiriWorkspaces() : getHyprlandWorkspaces()).catch(() => []),
)

const allIds = workspaces.as((current) =>
  [...new Set([...PERSISTENT_WORKSPACES, ...current.map(({ id }) => id)])].sort(
    (a, b) => a - b,
  ),
)

const Workspace = ({ id }: { id: number }) => {
  const workspace = workspaces.as((current) =>
    current.find((currentWorkspace) => currentWorkspace.id === id),
  )
  const icons = workspace.as((current) =>
    current?.clients
      .map(({ class: cls, title }) => windowIcon(cls, title))
      .join("") ?? "",
  )
  const klass = createComputed(() => {
    const current = workspace()
    const parts = ["workspace"]
    if (current?.focused) parts.push("active")
    if (!current?.clients.length) parts.push("empty")
    return parts.join(" ")
  })
  const tooltip = icons.as((current) =>
    current ? `Workspace ${id}\n${current.trim()}` : `Workspace ${id}`,
  )
  const label = icons.as((current) => (current ? `${id}${current}` : String(id)))

  return (
    <Gtk.Button
      class={klass}
      label={label}
      tooltipText={tooltip}
      onClicked={() =>
        execAsync(
          isNiri
            ? `niri msg action focus-workspace ${id}`
            : focusHyprlandWorkspace(id),
        ).catch(print)
      }
    >
      {onVerticalScroll((dy) =>
        execAsync(
          isNiri
            ? `niri msg action ${dy > 0 ? "focus-workspace-down" : "focus-workspace-up"}`
            : focusHyprlandWorkspace(dy > 0 ? "e+1" : "e-1"),
        ).catch(print),
      )}
    </Gtk.Button>
  )
}

export const Workspaces = () => (
  <box class="workspaces">
    <For each={allIds}>{(id: number) => <Workspace id={id} />}</For>
  </box>
)
