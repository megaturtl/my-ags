import AstalTray from "gi://AstalTray"
import { createBinding } from "ags"
import { For } from "ags"
import { Gtk } from "ags/gtk4"

const tray = AstalTray.get_default()

function TrayItem({ item }: { item: AstalTray.TrayItem }) {
  const gesture = new Gtk.GestureClick()
  gesture.button = 0
  gesture.connect("pressed", (_gesture: Gtk.GestureClick, _nPress: number, _x: number, _y: number) => {
    const button = gesture.get_current_button()
    const widget = gesture.get_widget()
    if (button === 1 && !item.isMenu) item.activate(0, 0)
    if (button === 3 && widget) {
      const model = item.get_menu_model()
      if (model) {
        const popover = Gtk.PopoverMenu.new_from_model(model)
        popover.set_parent(widget)
        popover.popup()
      }
    }
  })

  return (
    <button
      tooltipText={createBinding(item, "tooltipMarkup")}
      $={(self) => {
        self.add_controller(gesture)
        self.insert_action_group("dbusmenu", item.get_action_group())
      }}
    >
      <image gicon={createBinding(item, "gicon")} iconSize={Gtk.IconSize.NORMAL} />
    </button>
  )
}

export default function Tray() {
  const items = createBinding(tray, "items")

  return (
    <box cssClasses={["bubble", "tray"]}>
      <For each={items}>
        {(item: AstalTray.TrayItem) => <TrayItem item={item} />}
      </For>
    </box>
  )
}