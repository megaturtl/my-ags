import { Gdk } from "ags/gtk4"
import { createMultiClickGesture, createScrollController } from "../lib/gestures"

interface Props {
  name: any
  tooltip?: any
  onLeftClick?: () => void
  onMiddleClick?: () => void
  onRightClick?: () => void
  onScroll?: (dy: number) => void
  children?: any
}

export function BubbleButton({ name, tooltip, onLeftClick, onMiddleClick, onRightClick, onScroll, children }: Props) {
  const hasClicks = onLeftClick || onMiddleClick || onRightClick
  const gesture = hasClicks
    ? createMultiClickGesture({ 1: onLeftClick, 2: onMiddleClick, 3: onRightClick })
    : null

  const classes = typeof name === "string"
  ? ["bubble", name]
  : name((n: string) => ["bubble", ...n.split(" ").filter(Boolean)])

  return (
    <button
      cssClasses={classes}
      tooltipText={tooltip}
      $={(self) => {
        if (hasClicks || onScroll)
          self.set_cursor(Gdk.Cursor.new_from_name("pointer", null))
        if (gesture) self.add_controller(gesture)
        if (onScroll) self.add_controller(createScrollController(onScroll))
      }}
    >
      {children}
    </button>
  )
}