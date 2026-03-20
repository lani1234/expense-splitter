import { Outlet } from "react-router-dom"
import NavBar from "./NavBar"
import { Toaster } from "@/components/ui/toaster"

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
