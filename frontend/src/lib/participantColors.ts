const PARTICIPANT_HUES = [218, 282, 155, 25]

export function participantGradient(index: number): string {
  const hue = PARTICIPANT_HUES[index % PARTICIPANT_HUES.length]
  return `linear-gradient(135deg, oklch(0.66 0.16 ${hue}) 0%, oklch(0.54 0.20 ${(hue + 28) % 360}) 100%)`
}

const PILL_COLORS = [
  { bg: "rgba(219,234,254,0.65)", border: "rgba(147,197,253,0.75)", text: "#1d4ed8" },
  { bg: "rgba(237,233,254,0.65)", border: "rgba(196,181,253,0.75)", text: "#7c3aed" },
  { bg: "rgba(209,250,229,0.65)", border: "rgba(110,231,183,0.75)", text: "#059669" },
  { bg: "rgba(255,237,213,0.65)", border: "rgba(253,186,116,0.75)", text: "#c2410c" },
]

export function participantPillColors(index: number) {
  return PILL_COLORS[index % PILL_COLORS.length]
}
