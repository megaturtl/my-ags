export const TICK_INTERVAL_MS = 1000

// First existing path wins (used by Hardware for CPU temperature)
export const THERMAL_PATHS = [
  "/sys/class/thermal/thermal_zone2/temp",
  "/sys/class/thermal/thermal_zone1/temp",
  "/sys/class/thermal/thermal_zone0/temp",
]

// Workspace IDs always shown in the bar even when empty
export const PERSISTENT_WORKSPACES = [1, 2, 3, 4, 5]
