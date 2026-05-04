import AstalMpris from "gi://AstalMpris"
import { createBinding, createState } from "ags"

const mpris = AstalMpris.get_default()

let lastPlaying: AstalMpris.Player | null = null

function pickPlayer(ps: AstalMpris.Player[]): AstalMpris.Player | null {
  const playing = ps.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING)
  if (playing) return playing
  if (lastPlaying && ps.includes(lastPlaying)) return lastPlaying
  return ps.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PAUSED) ?? ps[0] ?? null
}

const initial = (() => {
  const ps = mpris.players ?? []
  lastPlaying = ps.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) ?? null
  return pickPlayer(ps)
})()

const [active, setActive] = createState<AstalMpris.Player | null>(initial)

let statusSubs: (() => void)[] = []
function rebind(ps: AstalMpris.Player[]) {
  statusSubs.forEach(f => f())
  statusSubs = ps.map(p =>
    createBinding(p, "playbackStatus").subscribe(() => {
      if (p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) lastPlaying = p
      setActive(pickPlayer(mpris.players ?? []))
    }),
  )
}

createBinding(mpris, "players").subscribe(() => {
  const ps = mpris.players ?? []
  setActive(pickPlayer(ps))
  rebind(ps)
})
rebind(mpris.players ?? [])

export const activePlayer = active
export type Player = AstalMpris.Player
export { AstalMpris }
