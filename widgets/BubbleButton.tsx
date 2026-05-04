import { createMultiClickGesture, createScrollController } from "../lib/gestures"

interface Props {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltip?: any
  onLeftClick?: () => void
  onMiddleClick?: () => void
  onRightClick?: () => void
  onScroll?: (dy: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any
}

export function BubbleButton({ name, tooltip, onLeftClick, onMiddleClick, onRightClick, onScroll, children }: Props) {
  const hasClicks = onLeftClick || onMiddleClick || onRightClick
  const gesture = hasClicks
    ? createMultiClickGesture({ 1: onLeftClick, 2: onMiddleClick, 3: onRightClick })
    : null

  return (
    <button
      cssClasses={["bubble", name]}
      tooltipText={tooltip}
      $={(self) => {
        if (gesture) self.add_controller(gesture)
        if (onScroll) self.add_controller(createScrollController(onScroll))
      }}
    >
      {children}
    </button>
  )
}
