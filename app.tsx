import app from "ags/gtk4/app"
import style from "./src/styles/index.scss"
import Bar from "./src/ui/bar"
import Osd from "./src/ui/osd"

app.start({
  instanceName: "tshell",
  css: style,
  main() {
    const monitors = app.get_monitors()
    monitors.map(Bar)
    monitors.map(Osd)
  },
})
