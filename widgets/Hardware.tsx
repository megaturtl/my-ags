import { state, tooltip } from "../services/hardware"
import { Bubble } from "./Bubble"

const pad3 = (s: string) => s.padStart(3)

export default function Hardware() {
  return (
    <Bubble name="hardware" tooltip={tooltip}>
      <box spacing={4}>
        <label cssClasses={["cpu"]}  label={state(s => `󰍛${pad3(s.overall.toString())}%`)} />
        <label cssClasses={["temp"]} label={state(s => `󰔏 ${pad3(s.tempC)}`)} />
        <label cssClasses={["mem"]}  label={state(s => ` ${pad3(s.memPct.toString())}%`)} />
      </box>
    </Bubble>
  )
}
