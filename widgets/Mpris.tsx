import { createBinding, createComputed, For } from "ags"
import { playerIcon } from "../lib/pure"
import { activePlayer, AstalMpris, type Player as MprisPlayer } from "../services/mpris"
import { Bubble } from "./Bubble"
import { MarqueeLabel } from "./MarqueeLabel"

function Player({ player }: { player: MprisPlayer }) {
  const status = createBinding(player, "playbackStatus")
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const album = createBinding(player, "album")

  const appIcon = playerIcon(player.get_bus_name() ?? "")
  const statusIcon = status.as(s => s === AstalMpris.PlaybackStatus.PLAYING ? "" : "")

  const scrollText = createComputed(() =>
    [artist() ?? "", title() ?? ""].filter(Boolean).join(" - "),
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
    <Bubble
      name="mpris"
      tooltip={tooltip}
      onLeftClick={() => player.play_pause()}
      onMiddleClick={() => player.previous()}
      onRightClick={() => player.next()}
    >
      <box>
        <label label={`${appIcon}  `} />
        <MarqueeLabel label={scrollText} width={160} />
        <label label={statusIcon.as(s => `  ${s}`)} />
      </box>
    </Bubble>
  )
}

export default function Mpris() {
  return (
    <box>
      <For each={activePlayer(p => p ? [p] : [])}>
        {(player: MprisPlayer) => <Player player={player} />}
      </For>
    </box>
  )
}
