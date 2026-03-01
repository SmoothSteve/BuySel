"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Shield, CheckCircle, Camera, List, Map as MapIcon, X, Heart } from 'lucide-react'
import Link from 'next/link'
import BuySelHeader from '@/components/BuySelHeader'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import PropertyDetailsDialog from '@/components/PropertyDetailsDialog'
import ChatModal from '@/components/ChatModal'
import MakeOfferDialog from '@/components/MakeOfferDialog'
import NotificationHeader from '@/components/NotificationHeader'
import { useAuth } from '@/hooks/useAuth'
import { useUserData } from '@/hooks/useUserData'
import { Property } from '@/types/property'
import { Offer } from '@/types/offer'
import type { GoogleMap } from '@/types/google-maps'
import { usePageView } from '@/hooks/useAudit'

interface UserPropertyFav {
  id: number
  user_id: number
  property_id: number
}

export default function HomePage() {
  usePageView('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [beds, setBeds] = useState('')
  const [baths, setBaths] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list')
  const [viewMode, setViewMode] = useState<'search' | 'favourites'>('search')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [chatProperty, setChatProperty] = useState<Property | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)
  const [offerProperty, setOfferProperty] = useState<Property | null>(null)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [favs, setFavs] = useState<UserPropertyFav[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const { user, isAuthenticated } = useAuth()
  const { userId } = useUserData()
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<GoogleMap | null>(null)

  useEffect(() => {
    fetchProperties()

    // Check if we have a stored callback URL (workaround for Microsoft auth)
    if (isAuthenticated) {
      const storedCallbackUrl = sessionStorage.getItem('auth_callback_url')
      if (storedCallbackUrl) {
        sessionStorage.removeItem('auth_callback_url')
        window.location.href = storedCallbackUrl
        return
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (userId) {
      fetchFavorites()
      fetchOffers()
    }
  }, [userId])

  const fetchProperties = async () => {
  try {
    const response = await fetch('/api/property')
    if (response.ok) {
      const data = await response.json()
      setProperties(data)
    }
  } catch (error) {
    console.error('Error fetching properties:', error)
  } finally {
    setLoading(false)
  }
}

const fetchFavorites = async () => {
  if (!userId) return
  try {
    const response = await fetch(`/api/userpropertyfav/${userId}`)
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
    const response = await fetch(`/api/offer/buyer/${userId}`)
    if (response.ok) {
      const data = await response.json()
      setOffers(Array.isArray(data) ? data : [])
    }
  } catch (error) {
    console.error('Error fetching offers:', error)
  }
}

const handleFavToggle = async (propertyId: number, fav: boolean) => {
  if (!userId) return

  if (fav) {
    try {
      const newFav = { user_id: userId, property_id: propertyId }

      const response = await fetch('/api/userpropertyfav', {
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
    const favToRemove = favs.find(f => f.property_id === propertyId)
    if (!favToRemove) return

    try {
      const response = await fetch(`/api/userpropertyfav/${favToRemove.id}`, {
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

const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const suburborpostcode = searchQuery || '~'
    const bedsParam = beds || '0'
    const bathsParam = baths || '0'

    const response = await fetch(
      `/api/property/search?query=${suburborpostcode}&beds=${bedsParam}&baths=${bathsParam}`
    )

    if (response.ok) {
      const data = await response.json()
      setProperties(data)
    } else {
      console.error('Search failed')
    }
  } catch (error) {
    console.error('Error searching properties:', error)
  } finally {
    setLoading(false)
  }
}

const handleClearSearch = () => {
  setSearchQuery('')
  setBeds('')
  setBaths('')
  fetchProperties()
}

const fetchFavouriteProperties = async () => {
  if (!user?.email) return
  setLoading(true)

  try {
    const response = await fetch(`/api/property/favs/${user.email}`)
    if (response.ok) {
      const data = await response.json()
      setProperties(data)
    }
  } catch (error) {
    console.error('Error fetching favourite properties:', error)
  } finally {
    setLoading(false)
  }
}

  const filteredProperties = properties

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || filteredProperties.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    const center = filteredProperties[0].lat && filteredProperties[0].lon 
      ? { lat: filteredProperties[0].lat, lng: filteredProperties[0].lon }
      : { lat: -19.2590, lng: 146.8169 }

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center,
    })

    googleMapRef.current = map

    filteredProperties.forEach((property) => {
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

    if (filteredProperties.some(p => p.lat && p.lon)) {
      map.fitBounds(bounds)
    }
  }, [filteredProperties])

  useEffect(() => {
    if (activeTab === 'map' && !window.google?.maps) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (filteredProperties.length > 0) {
          initializeMap()
        }
      }
      document.head.appendChild(script)
    } else if (activeTab === 'map' && window.google?.maps && filteredProperties.length > 0) {
      initializeMap()
    }
  }, [activeTab, filteredProperties, initializeMap])

  const badgeIcons = {
    contract: { icon: Shield, label: 'Contract Ready' },
    smoke_alarm: { icon: Shield, label: 'Smoke Alarm Certified' },
    pool_safety: { icon: Shield, label: 'Pool Safety' },
    building_pest: { icon: CheckCircle, label: 'Building & Pest' },
    title_search: { icon: CheckCircle, label: 'Title Search' },
    pro_photos: { icon: Camera, label: 'Professional Photos' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BuySelHeader user={user} isAuthenticated={isAuthenticated} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#FF6600] to-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Sell your house. Keep your price.
          </h1>
          <p className="text-xl mb-8">
            Verified property. No commission. Free to list during early access.
          </p>

          {/* Search/Favourites Toggle - Only show when logged in */}
          {user && (
            <div className="flex justify-center mb-6">
              <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-300">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                viewMode === 'search'
                  ? 'bg-[#FF6600] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="radio"
                  name="viewMode"
                  value="search"
                  checked={viewMode === 'search'}
                  onChange={() => {
                    setViewMode('search')
                    fetchProperties()
                  }}
                  className="sr-only"
                />
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                viewMode === 'favourites'
                  ? 'bg-[#FF6600] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="radio"
                  name="viewMode"
                  value="favourites"
                  checked={viewMode === 'favourites'}
                  onChange={() => {
                    setViewMode('favourites')
                    fetchFavouriteProperties()
                  }}
                  className="sr-only"
                />
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Favourites</span>
              </label>
            </div>
          </div>
          )}

          {/* Search Bar - Only show in search mode, or always show if not logged in */}
          {(viewMode === 'search' || !user) && (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Suburb or postcode"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value="0">Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
              <select
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value="0">Baths</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-[#FF6600] text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center flex-1"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                  title="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Properties</h2>
            <div className="flex items-center gap-4">
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
                  <span className="hidden sm:inline">List View</span>
                  <span className="sm:hidden">List</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'map'
                      ? 'bg-[#FF6600] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Map View</span>
                  <span className="sm:hidden">Map</span>
                </button>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No properties found matching your search.</p>
            </div>
          ) : activeTab === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={(prop) => setSelectedProperty(prop)}
                  onChatClick={isAuthenticated ? (prop) => {
                    setChatProperty(prop)
                    setShowChatModal(true)
                  } : undefined}
                  onOfferClick={isAuthenticated ? (prop) => {
                    setOfferProperty(prop)
                    setShowOfferDialog(true)
                  } : undefined}
                  userId={userId}
                  fav={favs.some(f => f.property_id === property.id)}
                  onFavToggle={handleFavToggle}
                  hasOffer={offers.some(o => o.property_id === property.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div ref={mapRef} className="h-[600px] w-full rounded" />
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">Trust what you see</h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
            Every listing shows verified compliance badges. Look for green ticks to ensure 
            properties meet all legal requirements and have been professionally documented.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(badgeIcons).map(([key, { icon: Icon, label }]) => (
              <div key={key} className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-[#333333]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#FF6600]">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">List Your Property</h3>
              <p className="text-gray-600">
                Complete our simple 5-step wizard. Get your Contract of Sale prepared by our licensed conveyancer partners.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#FF6600]">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Verified</h3>
              <p className="text-gray-600">
                Add compliance badges like smoke alarms, pool safety, and building & pest reports to build buyer trust.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#FF6600]">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect with Buyers</h3>
              <p className="text-gray-600">
                Receive messages through our secure platform. Share contact details only when you&apos;re ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#FF6600] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to sell without commission?</h2>
          <p className="text-xl mb-8">
            Free to list during early access. No hidden costs, no percentage commissions.
          </p>
          <Link href="/seller" className="inline-block bg-white text-[#FF6600] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Start Listing Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {selectedProperty && (
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

      {showOfferDialog && offerProperty && userId && (
        <MakeOfferDialog
          isOpen={showOfferDialog}
          onClose={() => {
            setShowOfferDialog(false)
            setOfferProperty(null)
            fetchOffers()
          }}
          property={offerProperty}
          buyerId={userId}
        />
      )}

      {isAuthenticated && (
        <NotificationHeader
          onOpenChat={async (propertyId, conversationId) => {
            // First try to find in local properties
            let property = properties.find(p => p.id === propertyId)
            
            // If not found locally, fetch from API
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
              console.log('HomePage: Opening chat with conversationId:', conversationId)
              setChatProperty(property)
              setChatConversationId(conversationId || null)
              setShowChatModal(true)
            }
          }}
        />
      )}
    </div>
  );
}
