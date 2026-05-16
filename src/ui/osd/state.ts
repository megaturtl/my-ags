import { createState } from "ags"
import { monitorFile, readFile } from "ags/file"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import AstalWp from "gi://AstalWp"
import { OSD_TIMEOUT_MS } from "../../config"

export type OsdKind = "volume" | "brightness"

export type OsdState = {
  visible: boolean
  kind: OsdKind
  value: number
  muted: boolean
}

const [state, setState] = createState<OsdState>({
  visible: false,
  kind: "volume",
  value: 0,
  muted: false,
})

export const osdState = state

let hideTimer: number | null = null

// Suppress events during startup so AstalWp's initial property-population
// signals don't pop the OSD as the shell launches.
const STARTUP_GRACE_MS = 800
const startupAt = GLib.get_monotonic_time()
const isStartup = () =>
  (GLib.get_monotonic_time() - startupAt) / 1000 < STARTUP_GRACE_MS

function show(partial: Omit<OsdState, "visible">) {
  if (isStartup()) return
  setState({ ...partial, visible: true })
  if (hideTimer !== null) GLib.source_remove(hideTimer)
  hideTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, OSD_TIMEOUT_MS, () => {
    setState((s) => ({ ...s, visible: false }))
    hideTimer = null
    return GLib.SOURCE_REMOVE
  })
}

// Audio: react to volume + mute on the default speaker.
const speaker = AstalWp.get_default()?.get_default_speaker() ?? null
if (speaker) {
  const onChange = () =>
    show({ kind: "volume", value: speaker.get_volume(), muted: speaker.get_mute() })
  speaker.connect("notify::volume", onChange)
  speaker.connect("notify::mute", onChange)
}

// Brightness: watch sysfs backlight, no-op if no device is present.
const BACKLIGHT_ROOT = "/sys/class/backlight"
function findBacklightDevice(): string | null {
  if (!GLib.file_test(BACKLIGHT_ROOT, GLib.FileTest.IS_DIR)) return null
  try {
    const dir = Gio.File.new_for_path(BACKLIGHT_ROOT)
    const enumerator = dir.enumerate_children(
      Gio.FILE_ATTRIBUTE_STANDARD_NAME,
      Gio.FileQueryInfoFlags.NONE,
      null,
    )
    const info = enumerator.next_file(null)
    enumerator.close(null)
    return info ? `${BACKLIGHT_ROOT}/${info.get_name()}` : null
  } catch {
    return null
  }
}

const backlightDir = findBacklightDevice()
if (backlightDir) {
  const brightnessPath = `${backlightDir}/brightness`
  const max = Number(readFile(`${backlightDir}/max_brightness`).trim()) || 1
  monitorFile(brightnessPath, () => {
    const v = Number(readFile(brightnessPath).trim()) / max
    show({ kind: "brightness", value: Math.max(0, Math.min(1, v)), muted: false })
  })
}
