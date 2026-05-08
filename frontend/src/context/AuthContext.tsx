import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { signIn as cognitoSignIn, signOut as cognitoSignOut, getSession } from "@/lib/auth"

interface AuthUser {
  email: string
  sub: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        const payload = session.getIdToken().decodePayload()
        setUser({ email: payload["email"] as string, sub: payload["sub"] as string })
      }
      setIsLoading(false)
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    const session = await cognitoSignIn(email, password)
    const payload = session.getIdToken().decodePayload()
    setUser({ email: payload["email"] as string, sub: payload["sub"] as string })
  }

  const signOut = () => {
    cognitoSignOut()
    setUser(null)
    queryClient.clear()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
