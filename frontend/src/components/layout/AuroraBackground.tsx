export default function AuroraBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(120% 90% at 50% 0%, #fff4ec 0%, #f0e8ff 55%, #e6f1ff 100%)",
        zIndex: -10,
        pointerEvents: "none",
      }}
    >
      {[
        { left: "-8%",  top: "-12%", size: 520, c1: "#ffc8b0", c2: "#ffe8dc", opacity: 0.85, anim: "aurora-drift-0 28s ease-in-out infinite" },
        { left: "62%",  top: "-6%",  size: 460, c1: "#c5d8ff", c2: "#e6efff", opacity: 0.8,  anim: "aurora-drift-1 32s ease-in-out infinite" },
        { left: "20%",  top: "55%",  size: 600, c1: "#cdf3df", c2: "#eafff3", opacity: 0.65, anim: "aurora-drift-2 36s ease-in-out infinite" },
        { left: "70%",  top: "60%",  size: 480, c1: "#f3cef7", c2: "#f8e6fc", opacity: 0.7,  anim: "aurora-drift-3 30s ease-in-out infinite" },
      ].map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${orb.c1}, ${orb.c2} 60%, transparent 72%)`,
            opacity: orb.opacity,
            filter: "blur(40px)",
            animation: orb.anim,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px)",
          mixBlendMode: "multiply",
          opacity: 0.6,
        }}
      />
    </div>
  )
}
