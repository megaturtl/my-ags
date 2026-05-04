import { execAsync } from "ags/process"
import { Bubble } from "./Bubble"

export default function PowerButton() {
  return (
    <Bubble
      name="power"
      tooltip={`Left · power menu (wlogout)\nRight · lock screen (hyprlock)`}
      label="󰐥"
      onLeftClick={() => execAsync("wlogout")}
      onRightClick={() => execAsync("hyprlock")}
    />
  )
}
