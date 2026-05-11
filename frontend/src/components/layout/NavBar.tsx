import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const links = [
  { to: "/templates", label: "Templates" },
  { to: "/instances", label: "Active" },
  { to: "/settled", label: "History" },
]

export default function NavBar() {
  const { signOut } = useAuth()

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        borderBottom: "1px solid rgba(255,255,255,0.6)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            display: "flex",
            alignItems: "baseline",
            gap: 1,
          }}
        >
          <span style={{ color: "rgba(28,22,46,0.40)" }}>we</span>
          <span style={{ color: "rgba(28,22,46,0.88)" }}>even</span>
          <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 5, transform: "translateY(-2px)" }}>
            <svg width="12" height="7" viewBox="0 0 12 7" style={{ display: "block" }}>
              <defs>
                <linearGradient id="logoG1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.66 0.16 218)" />
                  <stop offset="100%" stopColor="oklch(0.54 0.20 246)" />
                </linearGradient>
                <linearGradient id="logoG2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.66 0.16 282)" />
                  <stop offset="100%" stopColor="oklch(0.54 0.20 310)" />
                </linearGradient>
                <mask id="logoBite">
                  <rect width="12" height="7" fill="white" />
                  <circle cx="8.5" cy="3.5" r="4.1" fill="black" />
                </mask>
              </defs>
              <circle cx="3.5" cy="3.5" r="3.5" fill="url(#logoG1)" mask="url(#logoBite)" />
              <circle cx="8.5" cy="3.5" r="3.5" fill="url(#logoG2)" />
            </svg>
          </span>
        </div>

        <nav
          className="glass-pill"
          style={{ display: "flex", alignItems: "center", gap: 3, padding: 4, borderRadius: 999 }}
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/80 text-foreground shadow-sm"
                    : "text-foreground/45 hover:text-foreground/75"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="text-sm text-foreground/35 hover:text-foreground/65 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
