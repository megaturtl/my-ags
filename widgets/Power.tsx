import { execAsync } from "ags/process"
import { BubbleButton } from "./BubbleButton"

export default function PowerButton() {
  return (
    <BubbleButton
      name="power"
      tooltip={"Left · power menu (wlogout)\nRight · lock screen (hyprlock)"}
      onLeftClick={() => execAsync("wlogout")}
      onRightClick={() => execAsync("hyprlock")}
    >
      <label label="󰐥" />
    </BubbleButton>
  )
}
