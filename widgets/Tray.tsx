import { createBinding, For } from "ags"
import { Gtk } from "ags/gtk4"
import { items, type TrayItem as Item } from "../services/tray"
import { createRawClickGesture } from "../lib/gestures"

function TrayItem({ item }: { item: Item }) {
  const gesture = createRawClickGesture((button, widget) => {
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
  return (
    <box cssClasses={["bubble", "tray"]}>
      <For each={items}>
        {(item: Item) => <TrayItem item={item} />}
      </For>
    </box>
  )
}
