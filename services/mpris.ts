import AstalMpris from "gi://AstalMpris"
import { createBinding, createState } from "ags"

const mpris = AstalMpris.get_default()
let lastPlaying: AstalMpris.Player | null = null

function realPlayers(ps: AstalMpris.Player[]): AstalMpris.Player[] {
  return ps.filter(p => !p.get_bus_name()?.includes("playerctld"))
}

const BROWSER_NAMES = ["firefox", "chrome", "chromium"]

function isBrowser(p: AstalMpris.Player): boolean {
  const name = p.get_bus_name() ?? ""
  return BROWSER_NAMES.some(b => name.includes(b))
}

function pickPlayer(ps: AstalMpris.Player[]): AstalMpris.Player | null {
  // 1. anything playing
  const playing = ps.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING)
  if (playing) return playing

  // 2. last known playing player
  if (lastPlaying) {
    const lastName = lastPlaying.get_bus_name()
    const found = ps.find(p => p.get_bus_name() === lastName)
    if (found) return found
  }

  // 3. paused non-browser first, then paused browser
  const paused = ps.filter(p => p.playbackStatus === AstalMpris.PlaybackStatus.PAUSED)
  const nonBrowserPaused = paused.find(p => !isBrowser(p))
  if (nonBrowserPaused) return nonBrowserPaused
  if (paused.length > 0) return paused[0]

  // 4. any player as last resort
  return ps[0] ?? null
}

const initPlayers = realPlayers(mpris.players ?? [])
lastPlaying = initPlayers.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) ?? null
const [active, setActive] = createState<AstalMpris.Player | null>(pickPlayer(initPlayers))

let statusSubs: (() => void)[] = []

function rebind(ps: AstalMpris.Player[]) {
  statusSubs.forEach(f => f())
  statusSubs = ps.map(p =>
    createBinding(p, "playbackStatus").subscribe(() => {
      if (p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) lastPlaying = p
      setActive(pickPlayer(realPlayers(mpris.players ?? [])))
    })
  )
}

createBinding(mpris, "players").subscribe(() => {
  const ps = realPlayers(mpris.players ?? [])
  setActive(pickPlayer(ps))
  rebind(ps)
})

rebind(initPlayers)

export const activePlayer = active
export type Player = AstalMpris.Player
export { AstalMpris }