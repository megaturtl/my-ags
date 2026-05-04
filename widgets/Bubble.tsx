import { Accessor } from "ags"
import { BubbleButton } from "./BubbleButton"

type Reactive<T> = T | Accessor<T>

interface BubbleProps {
  name: Reactive<string>
  tooltip?: Reactive<string>
  label?: Reactive<string>
  icon?: Reactive<string>
  onLeftClick?: () => void
  onMiddleClick?: () => void
  onRightClick?: () => void
  onScroll?: (dy: number) => void
  children?: any
}

// Higher-level composition over BubbleButton: simple widgets pass `label`
// (and optionally `icon`); widgets needing custom inner layout pass
// `children` and skip both. Click and scroll handlers wire through.
export function Bubble({
  name, tooltip, label, icon, children,
  onLeftClick, onMiddleClick, onRightClick, onScroll,
}: BubbleProps) {
  return (
    <BubbleButton
      name={name}
      tooltip={tooltip}
      onLeftClick={onLeftClick}
      onMiddleClick={onMiddleClick}
      onRightClick={onRightClick}
      onScroll={onScroll}
    >
      {children ?? (
        icon != null
          ? <box spacing={4}><label label={icon} /><label label={label ?? ""} /></box>
          : <label label={label ?? ""} />
      )}
    </BubbleButton>
  )
}
