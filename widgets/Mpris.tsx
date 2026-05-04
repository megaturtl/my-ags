import AstalMpris from "gi://AstalMpris"
import { createBinding, createComputed } from "ags"
import { For } from "ags"
import { BubbleButton } from "./BubbleButton"

const mpris = AstalMpris.get_default()

function playerIcon(player: AstalMpris.Player): string {
  const id = player.get_bus_name() ?? ""
  if (/spotify/i.test(id)) return "󰓇"
  if (/vlc/i.test(id)) return "󰕼"
  return "󰝚"
}

function Player({ player }: { player: AstalMpris.Player }) {
  const status = createBinding(player, "playbackStatus")
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const album = createBinding(player, "album")

  const label = createComputed(() => {
    const t = title() ?? ""
    const a = artist() ?? ""
    const s = status()
    const icon = playerIcon(player)
    const statusIcon = s === AstalMpris.PlaybackStatus.PLAYING ? "" : ""
    const dynamic = [a, t].filter(Boolean).join(" - ")
    const truncated = dynamic.length > 32 ? dynamic.slice(0, 32) + "…" : dynamic
    return `${icon}  ${truncated}  ${statusIcon}`
  })

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
      <label label={label} />
    </BubbleButton>
  )
}

export default function Mpris() {
  const players = createBinding(mpris, "players").as(ps => ps.slice(0, 1))

  return (
    <box>
      <For each={players}>
        {(player: AstalMpris.Player) => <Player player={player} />}
      </For>
    </box>
  )
}
