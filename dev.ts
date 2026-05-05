import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./windows/Bar"

app.start({
  instanceName: "dev", // This lets me start alongside the prod ags instance
  css: style,
  main() {
    app.get_monitors().map(Bar)
  },
})
