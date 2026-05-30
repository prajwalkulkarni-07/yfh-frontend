import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/types"
import { getProfile } from "@/services/api"

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  signIn: (token: string, user: User) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("yoga_user")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("yoga_token")
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    getProfile()
      .then((u) => setUser(u))
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem("yoga_token")
        localStorage.removeItem("yoga_user")
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const signIn = (t: string, u: User) => {
    localStorage.setItem("yoga_token", t)
    localStorage.setItem("yoga_user", JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const signOut = () => {
    localStorage.removeItem("yoga_token")
    localStorage.removeItem("yoga_user")
    setToken(null)
    setUser(null)
  }

  return { user, token, isLoading, signIn, signOut }
}
