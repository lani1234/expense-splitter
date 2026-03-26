import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

const links = [
  { to: "/templates", label: "Templates" },
  { to: "/instances", label: "Active" },
  { to: "/settled", label: "History" },
]

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-nav shadow-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-8 px-4">
        <span className="text-xl font-bold"><span className="text-blue-300">we</span><span className="text-white">even</span></span>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
