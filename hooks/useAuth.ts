import { useEffect, useState } from "react"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      })
      .catch(() => {
        setUser(null)
        setIsAuthenticated(false)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { user, isAuthenticated, isLoading }
}