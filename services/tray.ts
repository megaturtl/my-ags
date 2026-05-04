import AstalTray from "gi://AstalTray"
import { createBinding } from "ags"

export const tray = AstalTray.get_default()
export const items = createBinding(tray, "items")
export type TrayItem = AstalTray.TrayItem
