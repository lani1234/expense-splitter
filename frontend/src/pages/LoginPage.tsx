import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { signUp, confirmSignUp } from "@/lib/auth"
import { getAllInstances } from "@/api/instances"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuroraBackground from "@/components/layout/AuroraBackground"

type View = "signin" | "signup" | "verify"

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const redirectAfterLogin = async () => {
    try {
      const instances = await getAllInstances()
      const hasActive = instances.some((i) => i.status === "IN_PROGRESS")
      navigate(hasActive ? "/instances" : "/templates", { replace: true })
    } catch {
      navigate("/instances", { replace: true })
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signIn(email, password)
      await redirectAfterLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      setView("verify")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await confirmSignUp(email, code)
      await signIn(email, password)
      await redirectAfterLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <AuroraBackground />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            style={{
              fontWeight: 700,
              fontSize: 36,
              display: "flex",
              alignItems: "baseline",
              gap: 1,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "rgba(28,22,46,0.35)" }}>we</span>
            <span style={{ color: "#1c162e" }}>even</span>
            <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 6, transform: "translateY(-3px)" }}>
              <svg width="16" height="9" viewBox="0 0 12 7" style={{ display: "block" }}>
                <defs>
                  <linearGradient id="loginLogoG1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="oklch(0.66 0.16 218)" />
                    <stop offset="100%" stopColor="oklch(0.54 0.20 246)" />
                  </linearGradient>
                  <linearGradient id="loginLogoG2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="oklch(0.66 0.16 282)" />
                    <stop offset="100%" stopColor="oklch(0.54 0.20 310)" />
                  </linearGradient>
                  <mask id="loginLogoBite">
                    <rect width="12" height="7" fill="white" />
                    <circle cx="8.5" cy="3.5" r="4.1" fill="black" />
                  </mask>
                </defs>
                <circle cx="3.5" cy="3.5" r="3.5" fill="url(#loginLogoG1)" mask="url(#loginLogoBite)" />
                <circle cx="8.5" cy="3.5" r="3.5" fill="url(#loginLogoG2)" />
              </svg>
            </span>
          </div>
          <p className="text-sm text-foreground/45">Split expenses with ease</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6" style={{ borderRadius: "1.125rem" }}>
          {view === "signin" && (
            <>
              <h2 className="text-lg font-semibold text-foreground/85 mb-4">Sign in</h2>
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="text-xs text-foreground/50 mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="bg-white/80 border-black/12"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 mb-1 block">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/80 border-black/12"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <p className="text-center text-sm text-foreground/45 mt-4">
                Don't have an account?{" "}
                <button
                  onClick={() => { setView("signup"); setError("") }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {view === "signup" && (
            <>
              <h2 className="text-lg font-semibold text-foreground/85 mb-4">Create account</h2>
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="text-xs text-foreground/50 mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="bg-white/80 border-black/12"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 mb-1 block">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/80 border-black/12"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 mb-1 block">Confirm password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/80 border-black/12"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
              <p className="text-center text-sm text-foreground/45 mt-4">
                Already have an account?{" "}
                <button
                  onClick={() => { setView("signin"); setError("") }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </>
          )}

          {view === "verify" && (
            <>
              <h2 className="text-lg font-semibold text-foreground/85 mb-2">Check your email</h2>
              <p className="text-sm text-foreground/45 mb-4">
                We sent a verification code to <strong className="text-foreground/70">{email}</strong>
              </p>
              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label className="text-xs text-foreground/50 mb-1 block">Verification code</label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoFocus
                    placeholder="123456"
                    className="bg-white/80 border-black/12"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & sign in"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
