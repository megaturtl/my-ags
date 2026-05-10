import { Accessor, createBinding, createComputed, createState, For } from "ags"
import { Gtk } from "ags/gtk4"
import AstalMpris from "gi://AstalMpris"
import { DIVIDER, onMiddleClick, onRightClick } from "../../../utils"

const playerIcon = (busName: string): string =>
  /spotify/i.test(busName) ? "󰓇" : /vlc/i.test(busName) ? "󰕼" : "󰝚"

const BROWSER_NAMES = ["firefox", "chrome", "chromium"]
const isBrowser = (p: AstalMpris.Player): boolean => {
  const name = p.get_bus_name() ?? ""
  return BROWSER_NAMES.some((b) => name.includes(b))
}

const realPlayers = (ps: AstalMpris.Player[]): AstalMpris.Player[] =>
  ps.filter((p) => !p.get_bus_name()?.includes("playerctld"))

const mpris = AstalMpris.get_default()
let lastPlaying: AstalMpris.Player | null = null

const pickPlayer = (ps: AstalMpris.Player[]): AstalMpris.Player | null => {
  const playing = ps.find(
    (p) => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING,
  )
  if (playing) return playing
  if (lastPlaying) {
    const lastName = lastPlaying.get_bus_name()
    const found = ps.find((p) => p.get_bus_name() === lastName)
    if (found) return found
  }
  const paused = ps.filter(
    (p) => p.playbackStatus === AstalMpris.PlaybackStatus.PAUSED,
  )
  const nonBrowserPaused = paused.find((p) => !isBrowser(p))
  if (nonBrowserPaused) return nonBrowserPaused
  if (paused.length > 0) return paused[0]
  return ps[0] ?? null
}

const initPlayers = realPlayers(mpris.players ?? [])
lastPlaying =
  initPlayers.find(
    (p) => p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING,
  ) ?? null
const [activePlayer, setActive] = createState<AstalMpris.Player | null>(
  pickPlayer(initPlayers),
)

let statusSubs: (() => void)[] = []
const rebind = (ps: AstalMpris.Player[]) => {
  statusSubs.forEach((f) => f())
  statusSubs = ps.map((p) =>
    createBinding(p, "playbackStatus").subscribe(() => {
      if (p.playbackStatus === AstalMpris.PlaybackStatus.PLAYING)
        lastPlaying = p
      setActive(pickPlayer(realPlayers(mpris.players ?? [])))
    }),
  )
}
createBinding(mpris, "players").subscribe(() => {
  const ps = realPlayers(mpris.players ?? [])
  setActive(pickPlayer(ps))
  rebind(ps)
})
rebind(initPlayers)

const Marquee = ({
  label,
  width = 160,
  speed = 20,
  pauseMs = 1200,
}: {
  label: Accessor<string>
  width?: number
  speed?: number
  pauseMs?: number
}) => (
  <scrolledwindow
    class="marquee"
    $={(sw: Gtk.ScrolledWindow) => {
      sw.set_policy(Gtk.PolicyType.EXTERNAL, Gtk.PolicyType.NEVER)
      sw.set_size_request(width, -1)
      sw.hexpand = false

      type S = "pause-start" | "forward" | "pause-end" | "backward"
      let state: S = "pause-start"
      let stateStart = 0
      let lastUpper = -1

      sw.add_tick_callback((_w, clock) => {
        const now = clock.get_frame_time() / 1000
        const adj = sw.get_hadjustment()
        const range = adj.get_upper() - adj.get_page_size()

        if (adj.get_upper() !== lastUpper) {
          lastUpper = adj.get_upper()
          adj.set_value(0)
          state = "pause-start"
          stateStart = now
          return true
        }
        if (range <= 0) {
          if (adj.get_value() !== 0) adj.set_value(0)
          return true
        }

        const elapsed = now - stateStart
        const scrollDuration = (range / speed) * 1000

        switch (state) {
          case "pause-start":
            if (elapsed >= pauseMs) {
              state = "forward"
              stateStart = now
            }
            break
          case "forward":
            if (elapsed >= scrollDuration) {
              adj.set_value(range)
              state = "pause-end"
              stateStart = now
            } else adj.set_value((elapsed / scrollDuration) * range)
            break
          case "pause-end":
            if (elapsed >= pauseMs) {
              state = "backward"
              stateStart = now
            }
            break
          case "backward":
            if (elapsed >= scrollDuration) {
              adj.set_value(0)
              state = "pause-start"
              stateStart = now
            } else adj.set_value(range * (1 - elapsed / scrollDuration))
            break
        }
        return true
      })
    }}
  >
    <label label={label} xalign={0} halign={Gtk.Align.START} />
  </scrolledwindow>
)

const Player = ({ player }: { player: AstalMpris.Player }) => {
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const album = createBinding(player, "album")
  const status = createBinding(player, "playbackStatus")

  const scrollText = createComputed(() =>
    [artist() ?? "", title() ?? ""].filter(Boolean).join(" - "),
  )
  const tooltip = createComputed(() =>
    [
      title() ?? "",
      artist() ?? "",
      album() ?? "",
      DIVIDER,
      "Left · play/pause",
      "Middle · previous",
      "Right · next",
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return (
    <Gtk.Button
      class="mpris"
      tooltipText={tooltip}
      onClicked={() => player.play_pause()}
    >
      {onMiddleClick(() => player.previous())}
      {onRightClick(() => player.next())}
      <box orientation={Gtk.Orientation.VERTICAL} spacing={0}>
        <box class="mpris-content" hexpand vexpand valign={Gtk.Align.CENTER}>
          <label label={`${playerIcon(player.get_bus_name() ?? "")}  `} />
          <Marquee label={scrollText} width={160} />
          <label
            label={status.as(
              (s) => `  ${s === AstalMpris.PlaybackStatus.PLAYING ? "" : ""}`,
            )}
          />
        </box>
        <levelbar
          valign={Gtk.Align.END}
          class="mpris-progress"
          minValue={0}
          maxValue={1}
          $={(self: Gtk.LevelBar) => {
            self.set_mode(Gtk.LevelBarMode.CONTINUOUS)
            self.set_value(0)

            let anchorPos = Math.max(0, player.position ?? 0)
            let anchorTime = Date.now()
            let playing =
              player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING

            const resync = () => {
              const pos = player.position ?? -1
              if (pos >= 0) anchorPos = pos
              anchorTime = Date.now()
              playing =
                player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING
            }
            createBinding(player, "position").subscribe(resync)
            createBinding(player, "playbackStatus").subscribe(resync)

            self.add_tick_callback(() => {
              const elapsed = (Date.now() - anchorTime) / 1000
              const estimated = playing ? anchorPos + elapsed : anchorPos
              const len = player.length ?? 0
              self.set_value(
                len > 0 ? Math.min(1, Math.max(0, estimated / len)) : 0,
              )
              return true
            })
          }}
        />
      </box>
    </Gtk.Button>
  )
}

export const Mpris = () => (
  <box>
    <For
      each={activePlayer.as((p) => (p ? [p] : []))}
      id={(p: AstalMpris.Player) => p.get_bus_name() ?? ""}
    >
      {(p: AstalMpris.Player) => <Player player={p} />}
    </For>
  </box>
)
