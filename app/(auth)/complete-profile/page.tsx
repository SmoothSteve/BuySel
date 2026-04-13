'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import UserProfile from '@/components/UserProfile'
import BuySelHeader from '@/components/BuySelHeader'
import Footer from '@/components/Footer'
import { usePageView } from '@/hooks/useAudit'

export default function CompleteProfilePage() {
  usePageView('complete-profile')
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/')
    } else if (user?.email) {
      // Check if user already has a profile
      checkExistingProfile()
    }
  }, [isLoading, isAuthenticated, user, router])

  const checkExistingProfile = async () => {
    try {
      const response = await fetch(`/api/user/email/${encodeURIComponent(user?.email || '')}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData && userData.id) {
          // User already has a profile, redirect to home
          router.push('/')
        } else {
          // Show profile form
          setShowProfile(true)
        }
      } else {
        // User doesn't exist, show profile form
        setShowProfile(true)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      setShowProfile(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <BuySelHeader user={user || null} isAuthenticated={isAuthenticated} />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h1>
          
          <p className="text-gray-600 mb-8 text-center">
            To use all features of BuySel, including messaging with buyers and sellers, 
            you need to complete your profile.
          </p>

          {showProfile && user?.email ? (
            <UserProfile
              email={user.email}
              isOpen={true}
              onClose={() => {
                // After profile completion, redirect to home
                router.push('/')
              }}
            />
          ) : (
            <div className="text-center">
              <button
                onClick={() => setShowProfile(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Complete Profile Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
