import AstalMpris from "gi://AstalMpris"
import { createBinding, createComputed, createState } from "ags"
import { For } from "ags"
import { BubbleButton } from "./BubbleButton"
import { MarqueeLabel } from "./MarqueeLabel"

const mpris = AstalMpris.get_default()

function playerIcon(player: AstalMpris.Player): string {
  const id = player.get_bus_name() ?? ""
  if (/spotify/i.test(id)) return "󰓇"
  if (/vlc/i.test(id)) return "󰕼"
  return "󰝚"
}

let lastPlaying: AstalMpris.Player | null = null

function pickPlayer(ps: AstalMpris.Player[]): AstalMpris.Player | null {
  const playing = ps.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING)
  if (playing) return playing
  if (lastPlaying && ps.includes(lastPlaying)) return lastPlaying
  return ps.find(p => p.playbackStatus === AstalMpris.PlaybackStatus.PAUSED)
    ?? ps[0]
    ?? null
}

function Player({ player }: { player: AstalMpris.Player }) {
  const status = createBinding(player, "playbackStatus")
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const album = createBinding(player, "album")

  const appIcon = playerIcon(player)
  const statusIcon = status.as(s => s === AstalMpris.PlaybackStatus.PLAYING ? "" : "")

  const scrollText = createComputed(() =>
    [artist() ?? "", title() ?? ""].filter(Boolean).join(" - ")
  )

  const tooltip = createComputed(() => [
    title() ?? "",
    artist() ?? "",
    album() ?? "",
    "────────────────",
    "Left · play/pause",
    "Middle · previous",
    "Right · next",
  ].filter(Boolean).join("\n"))

  return (
    <BubbleButton
      name="mpris"
      tooltip={tooltip}
      onLeftClick={() => player.play_pause()}
      onMiddleClick={() => player.previous()}
      onRightClick={() => player.next()}
    >
      <box>
        <label label={`${appIcon}  `} />
        <MarqueeLabel label={scrollText} />
        <label label={statusIcon.as(s => `  ${s}`)} />
      </box>
    </BubbleButton>
  )
}

export default function Mpris() {
  lastPlaying = (mpris.players ?? []).find(
    p => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING
  ) ?? null

  const [active, setActive] = createState<AstalMpris.Player | null>(
    pickPlayer(mpris.players ?? [])
  )

  let statusSubs: (() => void)[] = []

  function rebind(ps: AstalMpris.Player[]) {
    statusSubs.forEach(f => f())
    statusSubs = ps.map(p =>
      createBinding(p, "playbackStatus").subscribe(() => {
        if (p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) lastPlaying = p
        setActive(pickPlayer(mpris.players ?? []))
      })
    )
  }

  createBinding(mpris, "players").subscribe(() => {
    const ps = mpris.players ?? []
    setActive(pickPlayer(ps))
    rebind(ps)
  })

  rebind(mpris.players ?? [])

  return (
    <box>
      <For each={active(p => p ? [p] : [])}>
        {(player: AstalMpris.Player) => <Player player={player} />}
      </For>
    </box>
  )
}
