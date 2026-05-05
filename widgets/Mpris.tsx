import { createBinding, createComputed, For } from "ags"
import { Gtk } from "ags/gtk4"
import { playerIcon } from "../lib/pure"
import { activePlayer, AstalMpris, type Player as MprisPlayer } from "../services/mpris"
import { Bubble } from "./Bubble"
import { MarqueeLabel } from "./MarqueeLabel"

function Player({ player }: { player: MprisPlayer }) {
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const status = createBinding(player, "playbackStatus")
  const album = createBinding(player, "album")

  const scrollText = createComputed(() =>
    [artist() ?? "", title() ?? ""].filter(Boolean).join(" - ")
  )

  const tooltip = createComputed(() => [
    title() ?? "", artist() ?? "", album() ?? "",
    "────────────────",
    "Left · play/pause", "Middle · previous", "Right · next",
  ].filter(Boolean).join("\n"))

  return (
    <Bubble
      name="mpris"
      tooltip={tooltip}
      onLeftClick={() => player.play_pause()}
      onMiddleClick={() => player.previous()}
      onRightClick={() => player.next()}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={0}>
        <box cssClasses={["mpris-content"]} hexpand vexpand valign={Gtk.Align.CENTER}>
          <label label={`${playerIcon(player.get_bus_name() ?? "")}  `} />
          <MarqueeLabel label={scrollText} width={160} />
          <label label={status.as(s =>
            `  ${s === AstalMpris.PlaybackStatus.PLAYING ? "" : ""}`
          )} />
        </box>
        <levelbar
          valign={Gtk.Align.END}
          cssClasses={["mpris-progress"]}
          minValue={0}
          maxValue={1}
          $={(self: Gtk.LevelBar) => {
            self.set_mode(Gtk.LevelBarMode.CONTINUOUS)
            self.set_value(0)

            let anchorPos = Math.max(0, player.position ?? 0)
            let anchorTime = Date.now()
            let playing = player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING

            const resync = () => {
              const pos = player.position ?? -1
              if (pos >= 0) anchorPos = pos
              anchorTime = Date.now()
              playing = player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING
            }

            createBinding(player, "position").subscribe(resync)
            createBinding(player, "playbackStatus").subscribe(resync)

            self.add_tick_callback(() => {
              const elapsed = (Date.now() - anchorTime) / 1000
              const estimated = playing ? anchorPos + elapsed : anchorPos
              const len = player.length ?? 0
              self.set_value(len > 0 ? Math.min(1, Math.max(0, estimated / len)) : 0)
              return true
            })
          }}
        />
      </box>
    </Bubble>
  )
}

export default function Mpris() {
  return (
    <box>
      <For each={activePlayer(p => p ? [p] : [])} id={(p: MprisPlayer) => p.get_bus_name() ?? ""}>
        {(player: MprisPlayer) => <Player player={player} />}
      </For>
    </box>
  )
}