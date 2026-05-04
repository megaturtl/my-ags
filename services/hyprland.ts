import AstalHyprland from "gi://AstalHyprland"
import { createBinding } from "ags"

export const hyprland = AstalHyprland.get_default()

export const workspaces = createBinding(hyprland, "workspaces")
export const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")
export const clients = createBinding(hyprland, "clients")

export function dispatch(cmd: string, arg: string) {
  hyprland.dispatch(cmd, arg)
}
