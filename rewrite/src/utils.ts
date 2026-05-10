import { createPoll } from "ags/time"
import { TICK_INTERVAL_MS } from "./config"

// Shared ticking callback, by default it increments n by 1 per second
export const tick = createPoll(0, TICK_INTERVAL_MS, (n: number) => n + 1)
