import AstalMpris from "gi://AstalMpris"
import { createBinding } from "ags"
import { For } from "ags"
import { Gtk } from "ags/gtk4"

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

  const label = status.as(() => {
    const t = title.peek() ?? ""
    const a = artist.peek() ?? ""
    const icon = playerIcon(player)
    const statusIcon = status.peek() === AstalMpris.PlaybackStatus.PLAYING ? "" : ""
    const dynamic = [a, t].filter(Boolean).join(" - ")
    const truncated = dynamic.length > 32 ? dynamic.slice(0, 32) + "…" : dynamic
    return `${icon}  ${truncated}  ${statusIcon}`
  })

  const gesture = new Gtk.GestureClick()
  gesture.button = 0
  gesture.connect("pressed", (_g: Gtk.GestureClick, _n: number, _x: number, _y: number) => {
    const button = gesture.get_current_button()
    if (button === 1) player.play_pause()
    if (button === 3) player.next()
    if (button === 2) player.previous()
  })

  return (
    <button
      cssClasses={["bubble", "mpris"]}
      $={(self) => self.add_controller(gesture)}
    >
      <label label={label} />
    </button>
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