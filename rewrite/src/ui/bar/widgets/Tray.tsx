import { createBinding, For } from "ags"
import { Gtk } from "ags/gtk4"
import AstalTray from "gi://AstalTray"

const tray = AstalTray.get_default()
const items = createBinding(tray, "items")

const TrayItem = ({ item }: { item: AstalTray.TrayItem }) => (
  <Gtk.Button
    tooltipText={createBinding(item, "tooltipMarkup")}
    onClicked={() => {
      if (!item.isMenu) item.activate(0, 0)
    }}
    $={(self) => {
      self.insert_action_group("dbusmenu", item.get_action_group())
      const gesture = new Gtk.GestureClick()
      gesture.button = 3
      gesture.connect("pressed", () => {
        const model = item.get_menu_model()
        if (!model) return
        const popover = Gtk.PopoverMenu.new_from_model(model)
        popover.set_parent(self)
        popover.popup()
      })
      self.add_controller(gesture)
    }}
  >
    <image
      gicon={createBinding(item, "gicon")}
      iconSize={Gtk.IconSize.NORMAL}
    />
  </Gtk.Button>
)

export const Tray = () => (
  <box class="tray">
    <For each={items}>
      {(item: AstalTray.TrayItem) => <TrayItem item={item} />}
    </For>
  </box>
)
