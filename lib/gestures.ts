import { Gtk } from "ags/gtk4"

export function createMultiClickGesture(handlers: Partial<Record<1 | 2 | 3, () => void>>) {
  const gesture = new Gtk.GestureClick()
  gesture.button = 0
  gesture.connect("pressed", () => {
    const btn = gesture.get_current_button() as 1 | 2 | 3
    if (handlers[btn]) {
      gesture.set_state(Gtk.EventSequenceState.CLAIMED)
      handlers[btn]!()
    }
  })
  return gesture
}

export function createScrollController(onScroll: (dy: number) => void) {
  const scroll = new Gtk.EventControllerScroll()
  scroll.flags = Gtk.EventControllerScrollFlags.VERTICAL
  scroll.connect("scroll", (_s: Gtk.EventControllerScroll, _dx: number, dy: number) => onScroll(dy))
  return scroll
}

// Per-button raw click gesture. Used when a widget needs the originating
// widget reference (e.g. tray items popping up a menu anchored on themselves).
export function createRawClickGesture(
  handler: (button: number, widget: Gtk.Widget | null) => void,
) {
  const gesture = new Gtk.GestureClick()
  gesture.button = 0
  gesture.connect("pressed", () => {
    handler(gesture.get_current_button(), gesture.get_widget())
  })
  return gesture
}
