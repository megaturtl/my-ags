import app from "ags/gtk4/app"
import style from "./src/styles/index.scss"
import Bar from "./src/ui/bar"
import Osd from "./src/ui/osd"

app.start({
  instanceName: "tshell",
  css: style,
  main() {
    const monitors = app.get_monitors()

    if (monitors.length > 0) {
      const firstMonitor = monitors[0]

      // Show bar only on monitor 1
      Bar(firstMonitor)

      // Show OSD on all monitors
      monitors.map(Osd)
    }
  },
})