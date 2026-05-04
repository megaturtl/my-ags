import { createPoll } from "ags/time"
import { POLL_INTERVAL_MS } from "../config"

// Single shared timer driving every poll-based service.
// createPoll is lazy: the GLib timeout only runs while at least one
// subscriber is active, so this is free at idle.
export const tick = createPoll(0, POLL_INTERVAL_MS, (n: number) => n + 1)
