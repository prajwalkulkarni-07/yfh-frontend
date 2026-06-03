import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/types"
import { getProfile } from "@/services/api"

interface AuthContextValue {
  user: User | null
  token: string | null
  portal: "yfh" | "gita" | null
  isLoading: boolean
  signIn: (token: string, user: User) => void
  signOut: () => void
  setPortal: (portal: "yfh" | "gita") => void
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
  const [portal, setPortalState] = useState<"yfh" | "gita" | null>(() => {
    const stored = localStorage.getItem("yoga_portal")
    return stored === "gita" || stored === "yfh" ? stored : null
  })
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
        setPortalState(null)
        localStorage.removeItem("yoga_token")
        localStorage.removeItem("yoga_user")
        localStorage.removeItem("yoga_portal")
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
    localStorage.removeItem("yoga_portal")
    setToken(null)
    setUser(null)
    setPortalState(null)
  }

  const setPortal = (value: "yfh" | "gita") => {
    localStorage.setItem("yoga_portal", value)
    setPortalState(value)
  }

  return { user, token, portal, isLoading, signIn, signOut, setPortal }
}
