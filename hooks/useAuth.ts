import { useAuth as useAuthContext } from '@/lib/auth/auth-context'

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthContext()

  return { user, isAuthenticated, isLoading }
}
