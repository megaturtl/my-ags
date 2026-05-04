import { label, tooltip } from "../services/network"
import { Bubble } from "./Bubble"

export default function Network() {
  return <Bubble name="network" tooltip={tooltip} label={label} />
}
