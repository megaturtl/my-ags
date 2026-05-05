import { state, label, tooltip, toggle } from "../services/vpn"
import { Bubble } from "./Bubble"

export default function Vpn() {
  return (
    <Bubble
      name={state.as(s => s.active ? "vpn active" : "vpn")}
      label={label}
      tooltip={tooltip}
      onLeftClick={toggle}
    />
  )
}
