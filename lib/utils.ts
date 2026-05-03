import GLib from "gi://GLib"

export const fmtTime = (d: GLib.DateTime, seconds = true) =>
  d.format(seconds ? "%H:%M:%S" : "%H:%M")!
export const fmtDate = (d: GLib.DateTime) => d.format("%a %b %-d")!

export const humanBytes = (n: number) => {
  const u = ["B","K","M","G","T"]; let i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 ? 1 : 0)}${u[i]}`
}
