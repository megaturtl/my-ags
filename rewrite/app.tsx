import app from "ags/gtk4/app"
import style from "./src/styles/index.scss"
import Bar from "./src/ui/bar"

app.start({
  instanceName: "tshell",
  css: style,
  main() {
    app.get_monitors().map(Bar)
  },
})
