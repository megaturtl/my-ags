import { present, state, battLabel, profileLabel, tooltip, cycleProfile } from "../services/battery"
import { Bubble } from "./Bubble"

export default function Battery() {
  if (!present) return <box />

  return (
    <Bubble
      name={state.as(s => {
        if (s.charging) return "battery charging"
        if (s.percentage <= 15) return "battery critical"
        if (s.percentage <= 30) return "battery low"
        return "battery"
      })}
      tooltip={tooltip}
      onLeftClick={cycleProfile}
    >
      <box spacing={4}>
        <label cssClasses={["batt"]} label={battLabel} />
        <label cssClasses={["profile"]} label={profileLabel} />
      </box>
    </Bubble>
  )
}
