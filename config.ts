// Per-system configuration. Anything that varies by user or hardware belongs here

export const POLL_INTERVAL_MS = 2000

// First existing path wins
export const THERMAL_PATHS = [
  "/sys/class/thermal/thermal_zone2/temp",
  "/sys/class/thermal/thermal_zone1/temp",
  "/sys/class/thermal/thermal_zone0/temp",
]

export const PERSISTENT_WORKSPACES = [1, 2, 3, 4, 5]
