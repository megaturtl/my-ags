import { Gtk } from "ags/gtk4"

interface Props {
  label: any
  width?: number   // visible width in px
  speed?: number   // px/s
  pauseMs?: number // pause at each end before reversing
}

export function MarqueeLabel({ label: labelProp, width = 120, speed = 20, pauseMs = 1200 }: Props) {
  return (
    <scrolledwindow
      cssClasses={["marquee"]}
      $={(sw: Gtk.ScrolledWindow) => {
        // EXTERNAL: no scrollbar, size is independent of child's natural size
        sw.set_policy(Gtk.PolicyType.EXTERNAL, Gtk.PolicyType.NEVER)
        sw.set_size_request(width, -1)
        sw.hexpand = false

        type State = "pause-start" | "forward" | "pause-end" | "backward"
        let state: State = "pause-start"
        let stateStart = 0
        let lastUpper = -1

        sw.add_tick_callback((_w, clock) => {
          const now = clock.get_frame_time() / 1000 // µs → ms
          const adj = sw.get_hadjustment()
          const upper = adj.get_upper()
          const pageSize = adj.get_page_size()
          const range = upper - pageSize

          // Reset whenever text changes (detected via upper changing)
          if (upper !== lastUpper) {
            lastUpper = upper
            adj.set_value(0)
            state = "pause-start"
            stateStart = now
            return true
          }

          if (range <= 0) {
            if (adj.get_value() !== 0) adj.set_value(0)
            return true
          }

          const elapsed = now - stateStart
          const scrollDuration = (range / speed) * 1000

          switch (state) {
            case "pause-start":
              if (elapsed >= pauseMs) { state = "forward"; stateStart = now }
              break
            case "forward":
              if (elapsed >= scrollDuration) {
                adj.set_value(range)
                state = "pause-end"
                stateStart = now
              } else {
                adj.set_value((elapsed / scrollDuration) * range)
              }
              break
            case "pause-end":
              if (elapsed >= pauseMs) { state = "backward"; stateStart = now }
              break
            case "backward":
              if (elapsed >= scrollDuration) {
                adj.set_value(0)
                state = "pause-start"
                stateStart = now
              } else {
                adj.set_value(range * (1 - elapsed / scrollDuration))
              }
              break
          }

          return true
        })
      }}
    >
      <label
        label={labelProp}
        xalign={0}
        halign={Gtk.Align.START}
      />
    </scrolledwindow>
  )
}
