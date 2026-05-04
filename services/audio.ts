import AstalWp from "gi://AstalWp"
import { createBinding } from "ags"

const wp = AstalWp.get_default()
export const speaker = wp?.get_default_speaker() ?? null

export const volume = speaker ? createBinding(speaker, "volume") : null
export const muted = speaker ? createBinding(speaker, "mute") : null
export const description = speaker ? createBinding(speaker, "description") : null
