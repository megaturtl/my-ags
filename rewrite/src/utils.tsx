import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { TICK_INTERVAL_MS } from "./config"

export const DIVIDER = "────────────────"

// Shared ticking callback, by default it increments n by 1 per second
export const tick = createPoll(0, TICK_INTERVAL_MS, (n: number) => n + 1)

// Add to <Gtk.Button> as children to add click functionality
export const onRightClick = (h: () => void) => (
  <Gtk.GestureClick button={3} onPressed={h} />
)

export const onMiddleClick = (h: () => void) => (
  <Gtk.GestureClick button={2} onPressed={h} />
)

export const onVerticalScroll = (h: (dy: number) => void) => (
  <Gtk.EventControllerScroll
    flags={Gtk.EventControllerScrollFlags.VERTICAL}
    onScroll={(_c, _dx, dy) => {
      h(dy)
      return true
    }}
  />
)
