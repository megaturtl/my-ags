export const humanBytes = (n: number) => {
  const u = ["B","K","M","G","T"]; let i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 ? 1 : 0)}${u[i]}`
}

export type Stat = { idle: number; total: number }

export function parseStat(line: string): Stat {
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  return { idle: parts[3], total: parts.reduce((a, b) => a + b, 0) }
}

export function cpuPercent(curr: Stat, prev: Stat): number {
  const di = curr.idle - prev.idle
  const dt = curr.total - prev.total
  return dt <= 0 ? 0 : Math.round((1 - di / dt) * 100)
}

export function formatCores(cores: number[]): string {
  const lines: string[] = []
  for (let i = 0; i < cores.length; i += 2) {
    const a = `Core ${i}: ${cores[i]}%`
    const b = i + 1 < cores.length ? `  Core ${i + 1}: ${cores[i + 1]}%` : ""
    lines.push(a + b)
  }
  return lines.join("\n")
}

export function wifiIcon(strength: number): string {
  if (strength > 80) return "󰤨"
  if (strength > 60) return "󰤥"
  if (strength > 40) return "󰤢"
  return "󰤟"
}

// Always returns 4 chars so the speed section never changes width
export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 10 * 1024 * 1024) return `${Math.round(bytesPerSec / 1024 / 1024)}M`.padStart(4)
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)}M`.padStart(4)
  if (bytesPerSec >= 1024) return `${Math.round(bytesPerSec / 1024)}K`.padStart(4)
  return `${bytesPerSec}B`.padStart(4)
}

export function volumeIcon(volume: number, muted: boolean): string {
  if (muted) return "󰝟"
  if (volume > 0.66) return "󰕾"
  if (volume > 0.33) return "󰖀"
  return "󰕿"
}

export function notifIcon(count: number, dnd: boolean): string {
  if (dnd) return "󰂛"
  if (count > 0) return "󰂚"
  return "󰂜"
}

export function playerIcon(busName: string): string {
  if (/spotify/i.test(busName)) return "󰓇"
  if (/vlc/i.test(busName)) return "󰕼"
  return "󰝚"
}

export function windowIcon(cls: string, title: string): string {
  if (/bitwarden/i.test(cls)) return "  "
  if (/stremio/i.test(cls)) return " 󰎁 "
  if (/firefox|librewolf/i.test(cls)) return " 󰈹 "
  if (/zen/i.test(cls)) return " 󰈹 "
  if (/kitty|konsole|ghostty|wezterm/i.test(cls)) return "  "
  if (/thunderbird/i.test(cls)) return "   "
  if (/gmail/i.test(title)) return " 󰊫 "
  if (/discord|webcord|vesktop/i.test(cls)) return "  "
  if (/youtube/i.test(title)) return "   "
  if (/vlc/i.test(cls)) return " 󰕼 "
  if (/spotify/i.test(cls)) return " 󰓇 "
  if (/minecraft/i.test(cls)) return " 󰍳 "
  if (/vscode|codium/i.test(cls)) return " 󰨞 "
  if (/github/i.test(title)) return " 󰊤 "
  if (/nvim/i.test(title)) return "  "
  if (/vim/i.test(title)) return "  "
  if (/jetbrains-idea/i.test(cls)) return "  "
  if (/polkit/i.test(cls)) return " 󰒃 "
  if (/pavucontrol|pwvucontrol/i.test(cls)) return " 󱡫 "
  if (/steam/i.test(cls)) return " 󰓓 "
  if (/dolphin|thunar|nemo/i.test(cls)) return " 󰉋 "
  if (/gimp/i.test(cls)) return "  "
  if (/tauon|audacious/i.test(cls)) return " 󰝚 "
  if (/electron/i.test(cls)) return " 󰠮 "
  return ""
}
