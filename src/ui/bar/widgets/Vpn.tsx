import { createExternal, For } from "ags"
import { Gtk } from "ags/gtk4"
import NM from "gi://NM"

const VPN_TYPES = ["wireguard", "vpn"]
const isVpn = (c: NM.Connection) => VPN_TYPES.includes(c.get_connection_type())

const client = NM.Client.new(null)

type VpnInfo = {
  saved: NM.RemoteConnection[]
  activeUuids: Set<string>
}

const state = createExternal<VpnInfo>(
  { saved: [], activeUuids: new Set() },
  (set) => {
    const compute = () => {
      const saved = client.get_connections().filter(isVpn)
      const activeUuids = new Set<string>()
      for (const a of client.get_active_connections()) {
        const c = a.get_connection()
        if (c && isVpn(c)) activeUuids.add(c.get_uuid())
      }
      set({ saved, activeUuids })
    }
    compute()
    const ids = [
      client.connect("connection-added", compute),
      client.connect("connection-removed", compute),
      client.connect("active-connection-added", compute),
      client.connect("active-connection-removed", compute),
    ]
    return () => ids.forEach((id) => client.disconnect(id))
  },
)

const toggle = (conn: NM.RemoteConnection) => {
  const active = client
    .get_active_connections()
    .find((a) => a.get_uuid() === conn.get_uuid())
  if (active) {
    client.deactivate_connection_async(active, null, (_src, result) => {
      try {
        client.deactivate_connection_finish(result)
      } catch (e) {
        print(e)
      }
    })
  } else {
    client.activate_connection_async(conn, null, null, null, (_src, result) => {
      try {
        client.activate_connection_finish(result)
      } catch (e) {
        print(e)
      }
    })
  }
}

const klass = state.as((s) => (s.activeUuids.size > 0 ? "vpn active" : "vpn"))

const label = state.as((s) => {
  const active = s.saved.find((c) => s.activeUuids.has(c.get_uuid()))
  return active ? `󰒃 ${active.get_id()}` : "󰒃 Off"
})

const tooltip = state.as((s) => {
  if (s.saved.length === 0) return "No VPN connections configured"
  return s.saved
    .map((c) => `${s.activeUuids.has(c.get_uuid()) ? "● " : "  "}${c.get_id()}`)
    .join("\n")
})

export const Vpn = () => {
  let popover: Gtk.Popover

  return (
    <Gtk.MenuButton
      class={klass}
      tooltipText={tooltip}
      $={(self) => {
        popover = new Gtk.Popover()
        const content = (
          <box
            orientation={Gtk.Orientation.VERTICAL}
            spacing={2}
            class="vpn-menu"
          >
            <For each={state.as((s) => s.saved)}>
              {(conn: NM.RemoteConnection) => (
                <Gtk.Button
                  label={state.as(
                    (s) =>
                      `${s.activeUuids.has(conn.get_uuid()) ? "● " : "  "}${conn.get_id()}`,
                  )}
                  onClicked={() => {
                    toggle(conn)
                    popover.popdown()
                  }}
                />
              )}
            </For>
          </box>
        ) as unknown as Gtk.Widget
        popover.set_child(content)
        self.set_popover(popover)
      }}
    >
      <label label={label} />
    </Gtk.MenuButton>
  )
}
