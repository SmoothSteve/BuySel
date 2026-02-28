"use client";

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, List, Map, ListPlus, DollarSign } from 'lucide-react'
import BuySelHeader from '@/components/BuySelHeader'
import Footer from '@/components/Footer'
import AddPropertyDialog from '@/components/AddPropertyDialog'
import PropertyCard from '@/components/PropertyCard'
import PropertyDetailsDialog from '@/components/PropertyDetailsDialog'
import ChatModal from '@/components/ChatModal'
import OffersList from '@/components/OffersList'
import NotificationHeader from '@/components/NotificationHeader'
import UserProfile from '@/components/UserProfile'
import { useAuth as useAuthHook } from '@/hooks/useAuth'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserData } from '@/hooks/useUserData'
import { useTimezoneCorrection } from '@/hooks/useTimezoneCorrection'
import toast, { Toaster } from 'react-hot-toast'
import { Property } from '@/types/property'
import { Offer } from '@/types/offer'
import type { GoogleMap } from '@/types/google-maps'
import { useRouter } from 'next/navigation'
import { usePageView } from '@/hooks/useAudit'

interface UserPropertyFav {
  id: number
  user_id: number
  property_id: number
}

export default function SellerPage() {
  usePageView('seller')
  const { user, isAuthenticated: authContextIsAuthenticated, isLoading: authLoading } = useAuth()
  const { isAuthenticated } = useAuthHook()
  const router = useRouter()
  const { userId, isProfileComplete, isLoading: userDataLoading, refetchUserData, dateofbirth, idbloburl, idverified } = useUserData()
  const correctDateForTimezone = useTimezoneCorrection()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list')
  const [error, setError] = useState<string | null>(null)
  
  const [newProperty, setNewProperty] = useState<Property|null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showViewOptionDialog, setShowViewOptionDialog] = useState(false)
  const [chatProperty, setChatProperty] = useState<Property | null>(null)
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [favs, setFavs] = useState<UserPropertyFav[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [showOffersPopup, setShowOffersPopup] = useState(false)
  const [offersPopupProperty, setOffersPopupProperty] = useState<Property | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<GoogleMap | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  useEffect(() => {
    if (authLoading || userDataLoading) return // Still loading authentication status or user data

    if (!isAuthenticated) {
      // Redirect to home page - they can sign in from there
      router.push('/')
    } else if (isAuthenticated && !isProfileComplete) {
      // Profile is incomplete
      toast.error('Please complete your profile to list properties', { duration: 5000 })
      setShowProfileDialog(true)
      setLoading(false)
    } else if (isAuthenticated && isProfileComplete) {
      // Profile is complete, fetch properties
      fetchProperties()
    }
  }, [authLoading, isAuthenticated, router, isProfileComplete, userDataLoading])

  const initializeMap = React.useCallback(() => {
    if (!mapRef.current || !window.google?.maps || properties.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    const center = properties[0].lat && properties[0].lon 
      ? { lat: properties[0].lat, lng: properties[0].lon }
      : { lat: -33.8688, lng: 151.2093 }

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center,
    })

    googleMapRef.current = map

    properties.forEach((property) => {
      if (property.lat && property.lon && window.google?.maps) {
        const priceLabel = `$${(property.price / 1000).toFixed(0)}k`
        
        const marker = new window.google.maps.Marker({
          position: { lat: property.lat, lng: property.lon },
          map,
          title: property.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="50" viewBox="0 0 120 50">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                  </filter>
                </defs>
                <g filter="url(#shadow)">
                  <rect x="5" y="5" width="110" height="36" rx="18" fill="white" stroke="#FF6600" stroke-width="2"/>
                  <text x="60" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#FF6600">${priceLabel}</text>
                </g>
                <polygon points="60,41 55,46 65,46" fill="white" stroke="#FF6600" stroke-width="2"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(120, 50),
            anchor: new window.google.maps.Point(60, 46),
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${property.title}</h3>
              <p style="font-size: 14px; margin: 0 0 8px 0; color: #6b7280;">${property.address}</p>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; font-size: 18px; color: #FF6600;">$${property.price.toLocaleString()}</span>
              </div>
            </div>
          `,
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })

        bounds.extend({ lat: property.lat, lng: property.lon })
      }
    })

    if (properties.some(p => p.lat && p.lon)) {
      map.fitBounds(bounds)
    }
  }, [properties])

  useEffect(() => {
    if (activeTab === 'map' && !window.google?.maps) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (properties.length > 0) {
          initializeMap()
        }
      }
      document.head.appendChild(script)
    } else if (activeTab === 'map' && window.google?.maps && properties.length > 0) {
      initializeMap()
    }
  }, [activeTab, properties, initializeMap])

  useEffect(() => {
    if (userId) {
      fetchFavorites()
      fetchOffers()
    }
  }, [userId])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      const ep='https://buysel.azurewebsites.net/api/property/sellerusername/'+user?.email
      //alert(ep)
      const response = await fetch(ep)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error fetching properties:', error)
      setError(`Failed to load properties: ${errorMessage}`)
      toast.error(`Failed to load properties: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    if (!userId) return
    try {
      const response = await fetch(`https://buysel.azurewebsites.net/api/userpropertyfav/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setFavs(data)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  const fetchOffers = async () => {
    if (!userId) return
    try {
      const response = await fetch(`https://buysel.azurewebsites.net/api/offer/seller/${userId}`)
      if (response.ok) {
        const data: Offer[] = await response.json()
        setOffers(data)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    }
  }

  const handleFavToggle = async (propertyId: number, fav: boolean) => {
    if (!userId) return

    if (fav) {
      // Add to favorites
      try {
        const newFav = { id: 0, user_id: userId, property_id: propertyId }
        const response = await fetch('https://buysel.azurewebsites.net/api/userpropertyfav', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFav)
        })
        if (response.ok) {
          const createdFav = await response.json()
          setFavs([...favs, createdFav])
        }
      } catch (error) {
        console.error('Error adding favorite:', error)
      }
    } else {
      // Remove from favorites
      const favToRemove = favs.find(f => f.property_id === propertyId)
      if (favToRemove) {
        try {
          const response = await fetch(`https://buysel.azurewebsites.net/api/userpropertyfav/${favToRemove.id}`, {
            method: 'DELETE'
          })
          if (response.ok) {
            setFavs(favs.filter(f => f.id !== favToRemove.id))
          }
        } catch (error) {
          console.error('Error removing favorite:', error)
        }
      }
    }
  }

  const handleAddProperty = async (property: Property) => {
    try {
      const jsn=JSON.stringify(property)
      //alert(jsn);
      const response = await fetch('https://buysel.azurewebsites.net/api/property', {
        method: (property.id==0)?'POST':'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsn,
      })
      if (response.ok) {
        toast.success('Property saved successfully!')
        setNewProperty(null)
        fetchProperties()
      }
    } catch (error) {
      console.error('Error adding property:', error)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6600] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the page content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
<Toaster position="top-right" />
<BuySelHeader user={user} isAuthenticated={isAuthenticated} />


      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Layout: Two rows */}
        <div className="lg:hidden mb-8 space-y-3">
          {/* Row 1: Title + List Button */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <button
              onClick={() => {
                if (!dateofbirth) {
                  toast.error('Please complete your profile with your date of birth')
                  setShowProfileDialog(true)
                  return
                }
                const today = correctDateForTimezone(new Date())
                const birthDate = new Date(dateofbirth)
                const age = today.getFullYear() - birthDate.getFullYear()
                const monthDiff = today.getMonth() - birthDate.getMonth()
                const isOver18 = age > 18 || (age === 18 && monthDiff >= 0 && today.getDate() >= birthDate.getDate())

                if (!isOver18) {
                  toast.error('You must be 18 years or older to list properties')
                  return
                }

                if (!idbloburl) {
                  toast.error('Please upload your ID document in your profile')
                  setShowProfileDialog(true)
                  return
                }

                if (!idverified) {
                  toast.error('Your ID needs to be verified before you can list properties')
                  return
                }

                setNewProperty(
                  {
                    id: 0,
                    title: '',
                    address: '',
                    dte: correctDateForTimezone(new Date()),
                    sellerid: userId || 0,
                    price: 0,
                    lat: 0,
                    lon: 0,
                    photobloburl: null,
                    typeofprop: null,
                    suburb: null,
                    postcode: null,
                    beds: null,
                    baths: null,
                    carspaces: null,
                    landsize: null,
                    buildyear: null,
                    state:null,
                    country:null,
                    buildinginspazureblob: null,
                    buildinginspverified: null,
                    pestinspazureblob: null,
                    pestinspverified: null,
                    titlesrchcouncilrateazureblob: null,
                    titlesrchcouncilrateverified: null,
                    titlesrchcouncilratepublic:null,
                    pestinsppublic:null,
                    buildinginsppublic:null,
                    status:'draft',
                    rejecvtedreason: null,
                    contractsale:null,
                    poolcert:null,smokealarm:null
                  }
                )
              }}
              className="flex items-center gap-2 bg-gray-900 text-white  px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors font-bold"
            >
              <ListPlus className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => router.push('/seller/offers')}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold"
            >
              <DollarSign className="w-4 h-4" />
              <span>Offers</span>
            </button>
          </div>

          {/* Row 2: View toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'list'
                  ? 'bg-[#FF6600] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'map'
                  ? 'bg-[#FF6600] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <Map className="w-4 h-4" />
              Map View
            </button>
          </div>
        </div>

        {/* Desktop Layout: Single row */}
        <div className="hidden lg:flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!dateofbirth) {
                  toast.error('Please complete your profile with your date of birth')
                  setShowProfileDialog(true)
                  return
                }
                const today = correctDateForTimezone(new Date())
                const birthDate = new Date(dateofbirth)
                const age = today.getFullYear() - birthDate.getFullYear()
                const monthDiff = today.getMonth() - birthDate.getMonth()
                const isOver18 = age > 18 || (age === 18 && monthDiff >= 0 && today.getDate() >= birthDate.getDate())

                if (!isOver18) {
                  toast.error('You must be 18 years or older to list properties')
                  return
                }

                if (!idbloburl) {
                  toast.error('Please upload your ID document in your profile')
                  setShowProfileDialog(true)
                  return
                }

                if (!idverified) {
                  toast.error('Your ID needs to be verified before you can list properties')
                  return
                }

                setNewProperty(
                  {
                    id: 0,
                    title: '',
                    address: '',
                    dte: correctDateForTimezone(new Date()),
                    sellerid: userId || 0,
                    price: 0,
                    lat: 0,
                    lon: 0,
                    photobloburl: null,
                    typeofprop: null,
                    suburb: null,
                    postcode: null,
                    beds: null,
                    baths: null,
                    carspaces: null,
                    landsize: null,
                    buildyear: null,
                    state:null,
                    country:null,
                    buildinginspazureblob: null,
                    buildinginspverified: null,
                    pestinspazureblob: null,
                    pestinspverified: null,
                    titlesrchcouncilrateazureblob: null,
                    titlesrchcouncilrateverified: null,
                    titlesrchcouncilratepublic:null,
                    pestinsppublic:null,
                    buildinginsppublic:null,
                    status:'draft',
                    rejecvtedreason: null,
                    contractsale:null,
                    poolcert:null,smokealarm:null
                  }
                )
              }}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-bold"
            >
              <ListPlus className="w-4 h-4" />
              <span>List Property</span>
            </button>

            <button
              onClick={() => router.push('/seller/offers')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold"
            >
              <DollarSign className="w-4 h-4" />
              <span>Offers</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'list'
                    ? 'bg-[#FF6600] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
                List View
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'map'
                    ? 'bg-[#FF6600] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <Map className="w-4 h-4" />
                Map View
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error Loading Properties</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading properties...</p>
          </div>
        ) : activeTab === 'list' ? (
          properties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-4">You have no properties listed</p>
              <button
                onClick={() => {
                  if (!dateofbirth) {
                    toast.error('Please complete your profile with your date of birth')
                    setShowProfileDialog(true)
                    return
                  }

                  const today = correctDateForTimezone(new Date())
                  const birthDate = new Date(dateofbirth)
                  const age = today.getFullYear() - birthDate.getFullYear()
                  const monthDiff = today.getMonth() - birthDate.getMonth()
                  const isOver18 = age > 18 || (age === 18 && monthDiff >= 0 && today.getDate() >= birthDate.getDate())
                  
                  if (!isOver18) {
                    toast.error('You must be 18 years or older to list properties')
                    return
                  }
                  
                  if (!idbloburl) {
                    toast.error('Please upload your ID document in your profile')
                    setShowProfileDialog(true)
                    return
                  }
                  
                  if (!idverified) {
                    toast.error('Your ID needs to be verified before you can list properties')
                    return
                  }

                  setNewProperty(
                    {
                      id: 0,
                      title: '',
                      address: '',
                      dte: correctDateForTimezone(new Date()),
                      sellerid: userId || 0,
                      price: 0,
                      lat: 0,
                      lon: 0,
                      photobloburl: null,
                      typeofprop: null,
                      suburb: null,
                      postcode: null,
                      beds: null,
                      baths: null,
                      carspaces: null,
                      landsize: null,
                      buildyear: null,
                      state:null,
                      country:null,
                      buildinginspazureblob: null,
                      buildinginspverified: null,
                      pestinspazureblob: null,
                      pestinspverified: null,
                      titlesrchcouncilrateazureblob: null,
                      titlesrchcouncilrateverified: null,
                      titlesrchcouncilratepublic:null,
                      pestinsppublic:null,
                      buildinginsppublic:null,
                      status:'draft',
                      rejecvtedreason: null,
                      contractsale:null,
                      poolcert:null,
                    smokealarm:null,
                    }
                  )
                }}
                className="flex items-center gap-2 bg-[#FF6600] text-white px-6 py-3 rounded-lg hover:bg-[#FF5500] transition-colors mx-auto"
              >
                <ListPlus className="w-5 h-5" />
                <span>List a Property</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={(prop) => {
                    setSelectedProperty(prop)
                    setShowViewOptionDialog(true)
                  }}
                  onChatClick={(prop) => {
                    setChatProperty(prop)
                    setShowChatModal(true)
                  }}
                  onViewOffersClick={(prop) => {
                    setOffersPopupProperty(prop)
                    setShowOffersPopup(true)
                  }}
                  userId={userId}
                  fav={favs.some(f => f.property_id === property.id)}
                  onFavToggle={handleFavToggle}
                  hasReceivedOffer={offers.some(o => o.property_id === property.id && o.status === 'pending')}
                />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div ref={mapRef} className="h-[600px] w-full rounded" />
            <div className="mt-4 space-y-2">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#FF6600]" />
                  <span className="font-medium">{property.title}</span>
                  <span className="text-gray-500">
                    ({property.lat}, {property.lon})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    {newProperty &&  <AddPropertyDialog
        onClose={() => {
          setNewProperty(null)
          fetchProperties()
        }}
        onSave={handleAddProperty}
        property={newProperty}
        admin={false}
      />}
      {showProfileDialog && user?.email && (
        <UserProfile
          email={user.email}
          isOpen={showProfileDialog}
          onClose={() => {
            setShowProfileDialog(false)
            refetchUserData()
          }}
        />
      )}
      
      {showViewOptionDialog && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">View Property</h2>
            <p className="text-gray-600 mb-6">How would you like to view this property?</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowViewOptionDialog(false)
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#FF6600] text-white px-6 py-3 rounded-lg hover:bg-[#FF5500] transition-colors"
              >
                Public View
              </button>
              <button
                onClick={() => {
                  setShowViewOptionDialog(false)
                  setNewProperty(selectedProperty)
                  setSelectedProperty(null)
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit View
              </button>
              <button
                onClick={() => {
                  setShowViewOptionDialog(false)
                  setSelectedProperty(null)
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!showViewOptionDialog && selectedProperty && (
        <PropertyDetailsDialog
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
      
      {showChatModal && chatProperty && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false)
            setChatProperty(null)
            setChatConversationId(null)
          }}
          property={chatProperty}
          currentUserId={0}
          initialConversationId={chatConversationId}
        />
      )}

      {/* Offers Popup Dialog */}
      {showOffersPopup && offersPopupProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Offers Received</h2>
                <p className="text-sm text-gray-500 mt-1">{offersPopupProperty.address}</p>
                <p className="text-lg font-semibold text-[#FF6600]">${offersPopupProperty.price?.toLocaleString()}</p>
              </div>
              <button
                onClick={() => {
                  setShowOffersPopup(false)
                  setOffersPopupProperty(null)
                  fetchOffers()
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl text-gray-500"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <OffersList
                propertyId={offersPopupProperty.id}
                property={offersPopupProperty}
                mode="seller"
              />
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <NotificationHeader
          onOpenChat={async (propertyId, conversationId) => {
            // First try to find in local properties
            let property = properties.find(p => p.id === propertyId)
            
            // If not found locally, fetch from API (could be another seller's property)
            if (!property) {
              try {
                const response = await fetch(`https://buysel.azurewebsites.net/api/property/${propertyId}`)
                if (response.ok) {
                  property = await response.json()
                }
              } catch (error) {
                console.error('Failed to fetch property:', error)
              }
            }
            
            if (property) {
              console.log('Seller page: Opening chat for property:', property, 'conversation:', conversationId)
              setChatProperty(property)
              setChatConversationId(conversationId || null)
              setShowChatModal(true)
            } else {
              console.error('Seller page: Could not find/fetch property:', propertyId)
            }
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
