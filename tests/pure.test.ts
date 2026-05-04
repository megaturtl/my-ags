import {
  humanBytes, parseStat, cpuPercent, formatCores,
  wifiIcon, formatSpeed, volumeIcon, notifIcon, playerIcon, windowIcon,
} from "../lib/pure"

let passed = 0, failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (e) {
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`)
    failed++
  }
}

function eq<T>(actual: T, expected: T) {
  if (actual !== expected)
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

// humanBytes
console.log("\nhumanBytes")
test("bytes",       () => eq(humanBytes(500),           "500B"))
test("kilobytes",   () => eq(humanBytes(1024),          "1.0K"))
test("megabytes",   () => eq(humanBytes(1024 ** 2),     "1.0M"))
test("gigabytes",   () => eq(humanBytes(1024 ** 3),     "1.0G"))
test("terabytes",   () => eq(humanBytes(1024 ** 4),     "1.0T"))
test("fractional",  () => eq(humanBytes(1536),          "1.5K"))
test("2-digit K",   () => eq(humanBytes(10 * 1024),     "10K"))

// parseStat
console.log("\nparseStat")
test("idle field",  () => eq(parseStat("cpu  474908 20 107907 3764933 8517 0 6838 0 0 0").idle, 3764933))
test("total field", () => eq(
  parseStat("cpu  474908 20 107907 3764933 8517 0 6838 0 0 0").total,
  474908 + 20 + 107907 + 3764933 + 8517 + 0 + 6838 + 0 + 0 + 0,
))

// cpuPercent
console.log("\ncpuPercent")
test("zero delta returns 0", () => eq(cpuPercent({ idle: 0, total: 0 }, { idle: 0, total: 0 }), 0))
test("100% idle = 0% cpu",   () => eq(cpuPercent({ idle: 200, total: 200 }, { idle: 100, total: 100 }), 0))
test("full load = 100%",     () => eq(cpuPercent({ idle: 0, total: 100 }, { idle: 0, total: 0 }), 100))
test("50% load",             () => eq(cpuPercent({ idle: 50, total: 100 }, { idle: 0, total: 0 }), 50))

// formatCores
console.log("\nformatCores")
test("even count", () => eq(
  formatCores([10, 20, 30, 40]),
  "Core 0: 10%  Core 1: 20%\nCore 2: 30%  Core 3: 40%",
))
test("odd count", () => eq(
  formatCores([10, 20, 30]),
  "Core 0: 10%  Core 1: 20%\nCore 2: 30%",
))
test("single core", () => eq(formatCores([75]), "Core 0: 75%"))

// wifiIcon
console.log("\nwifiIcon")
test("strength > 80", () => eq(wifiIcon(90), "󰤨"))
test("strength > 60", () => eq(wifiIcon(70), "󰤥"))
test("strength > 40", () => eq(wifiIcon(50), "󰤢"))
test("strength <= 40", () => eq(wifiIcon(20), "󰤟"))

// formatSpeed
console.log("\nformatSpeed")
test("always 4 chars (bytes)",  () => eq(formatSpeed(500).length, 4))
test("always 4 chars (KB)",     () => eq(formatSpeed(2048).length, 4))
test("always 4 chars (MB)",     () => eq(formatSpeed(2 * 1024 * 1024).length, 4))
test("bytes padded",            () => eq(formatSpeed(500), "500B"))
test("kilobytes",               () => eq(formatSpeed(2048), "  2K"))
test("megabytes fractional",    () => eq(formatSpeed(1.5 * 1024 * 1024), "1.5M"))
test("megabytes large",         () => eq(formatSpeed(20 * 1024 * 1024), " 20M"))

// volumeIcon
console.log("\nvolumeIcon")
test("muted",         () => eq(volumeIcon(1.0, true),  "󰝟"))
test("high volume",   () => eq(volumeIcon(0.8, false), "󰕾"))
test("mid volume",    () => eq(volumeIcon(0.5, false), "󰖀"))
test("low volume",    () => eq(volumeIcon(0.1, false), "󰕿"))
test("muted at 0",    () => eq(volumeIcon(0.0, true),  "󰝟"))

// notifIcon
console.log("\nnotifIcon")
test("dnd on",            () => eq(notifIcon(0, true),  "󰂛"))
test("dnd with count",    () => eq(notifIcon(5, true),  "󰂛"))
test("unread",            () => eq(notifIcon(3, false), "󰂚"))
test("empty",             () => eq(notifIcon(0, false), "󰂜"))

// playerIcon
console.log("\nplayerIcon")
test("spotify",   () => eq(playerIcon("org.mpris.MediaPlayer2.spotify"), "󰓇"))
test("vlc",       () => eq(playerIcon("org.mpris.MediaPlayer2.vlc"),     "󰕼"))
test("unknown",   () => eq(playerIcon("org.mpris.MediaPlayer2.other"),   "󰝚"))

// windowIcon
console.log("\nwindowIcon")
test("firefox",         () => eq(windowIcon("firefox", ""),         " 󰈹 "))
test("librewolf",       () => eq(windowIcon("librewolf", ""),       " 󰈹 "))
test("zen",             () => eq(windowIcon("zen", ""),             " 󰈹 "))
test("kitty",           () => eq(windowIcon("kitty", ""),           "  "))
test("discord",         () => eq(windowIcon("discord", ""),         "  "))
test("spotify class",   () => eq(windowIcon("spotify", ""),         " 󰓇 "))
test("youtube title",   () => eq(windowIcon("chromium", "YouTube"), "   "))
test("nvim title",      () => eq(windowIcon("", "nvim"),            "  "))
test("unknown",         () => eq(windowIcon("unknown", "untitled"), ""))

// summary
console.log(`\n${passed + failed} tests: ${passed} passed${failed ? `, ${failed} failed` : ""}`)
if (failed > 0) throw new Error(`${failed} test(s) failed`)
