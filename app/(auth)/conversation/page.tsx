'use client'

import React, { useState, useEffect, useMemo } from 'react'
import BuySelHeader from '@/components/BuySelHeader'
import Footer from '@/components/Footer'
import ChatModal from '@/components/ChatModal'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserData } from '@/hooks/useUserData'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Property } from '@/types/property'
import { ArrowUp, ArrowDown, MessageCircle, User, Calendar, Home, DollarSign, Filter } from 'lucide-react'
import { getPhotoUrl } from '@/lib/r2-config'
import { usePageView } from '@/hooks/useAudit'

interface Conversation {
  id: number
  property_id: number
  buyer_id: number
  seller_id: number
  created_at: string
  buyer?: string
  seller?: string
}

interface User {
  id: number
  email: string
  firstname: string
  lastname: string
}

interface PropertySummary {
  id: number
  title: string
  address: string
  dte: string
  price: number
  photobloburl: string | null
}

export default function ConversationPage() {
  usePageView('conversation')
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { userId, isLoading: userDataLoading } = useUserData()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  // Sort and filter state
  const [sortField, setSortField] = useState<keyof Conversation | null>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    property: '',
    buyer: '',
    seller: '',
    created_at: ''
  })

  useEffect(() => {
    if (authLoading || userDataLoading) return

    if (!isAuthenticated) {
      router.push('/')
      return
    }

    if (userId) {
      fetchConversations()
    }
  }, [authLoading, isAuthenticated, router, userId, userDataLoading])

  const fetchConversations = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch conversations
      const conversationsResponse = await fetch(
        `https://buysel.azurewebsites.net/api/conversation/user/${userId}`
      )
      if (!conversationsResponse.ok) {
        throw new Error(`Failed to fetch conversations: ${conversationsResponse.status}`)
      }
      const conversationsData: Conversation[] = await conversationsResponse.json()

      // Fetch all users
      const usersResponse = await fetch('https://buysel.azurewebsites.net/api/user')
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`)
      }
      const usersData: User[] = await usersResponse.json()

      // Fetch all properties
      const propertiesResponse = await fetch('https://buysel.azurewebsites.net/api/property/all')
      if (!propertiesResponse.ok) {
        throw new Error(`Failed to fetch properties: ${propertiesResponse.status}`)
      }
      const propertiesData: PropertySummary[] = await propertiesResponse.json()
      setProperties(propertiesData)

      // Transform conversations to include buyer and seller names
      const transformedConversations = conversationsData.map((conv) => {
        const seller = usersData.find((u) => u.id === conv.seller_id)
        const buyer = usersData.find((u) => u.id === conv.buyer_id)

        return {
          ...conv,
          seller: seller ? `${seller.firstname} ${seller.lastname}` : 'Unknown',
          buyer: buyer ? `${buyer.firstname} ${buyer.lastname}` : 'Unknown',
        }
      })

      setConversations(transformedConversations)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error fetching conversations:', error)
      setError(`Failed to load conversations: ${errorMessage}`)
      toast.error(`Failed to load conversations: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = async (conversation: Conversation) => {
    try {
      // Fetch the property data
      const response = await fetch(`https://buysel.azurewebsites.net/api/property/${conversation.property_id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch property')
      }
      const property: Property = await response.json()

      // Set the property and conversation ID, then open the modal
      setSelectedProperty(property)
      setSelectedConversationId(conversation.id.toString())
      setShowChatModal(true)
    } catch (error) {
      console.error('Error opening conversation:', error)
      toast.error('Failed to open conversation')
    }
  }

  const handleSort = (field: keyof Conversation) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = [...conversations]

    // Apply filters
    if (filters.property) {
      filtered = filtered.filter(conv => {
        const property = properties.find(p => p.id === conv.property_id)
        if (!property) return false
        const searchStr = `${property.title} ${property.price}`.toLowerCase()
        return searchStr.includes(filters.property.toLowerCase())
      })
    }
    if (filters.buyer) {
      filtered = filtered.filter(conv =>
        conv.buyer?.toLowerCase().includes(filters.buyer.toLowerCase())
      )
    }
    if (filters.seller) {
      filtered = filtered.filter(conv =>
        conv.seller?.toLowerCase().includes(filters.seller.toLowerCase())
      )
    }
    if (filters.created_at) {
      filtered = filtered.filter(conv =>
        new Date(conv.created_at).toLocaleDateString().includes(filters.created_at)
      )
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue === undefined || bValue === undefined) return 0

        let comparison = 0
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Check if it looks like a date string (for created_at field)
          if (sortField === 'created_at') {
            comparison = new Date(aValue).getTime() - new Date(bValue).getTime()
          } else {
            comparison = aValue.localeCompare(bValue)
          }
        }

        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [conversations, properties, filters, sortField, sortDirection])

  // Show loading state while checking authentication
  if (authLoading || userDataLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Conversations</h1>
          <p className="text-gray-600 mt-2">
            View all your property conversations
            {conversations.length > 0 && (
              <span className="ml-2 text-sm">
                ({filteredAndSortedConversations.length} of {conversations.length} shown)
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error Loading Conversations</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6600] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">You have no conversations yet</p>
            <p className="text-gray-500 text-sm">Start browsing properties to connect with sellers or buyers</p>
          </div>
        ) : filteredAndSortedConversations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">No conversations match your filters</p>
            <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
            <button
              onClick={() => setFilters({
                property: '',
                buyer: '',
                seller: '',
                created_at: ''
              })}
              className="mt-4 px-4 py-2 bg-[#FF6600] text-white rounded-lg hover:bg-[#FF5500] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Filters and Sort Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 border border-gray-200">
              {/* Filter Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-[#FF6600]" />
                <h2 className="text-lg font-semibold text-gray-900">Filters & Sort</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Property Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4" />
                    Property
                  </label>
                  <input
                    type="text"
                    placeholder="Search property..."
                    value={filters.property}
                    onChange={(e) => handleFilterChange('property', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition-all"
                  />
                </div>

                {/* Buyer Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Buyer
                  </label>
                  <input
                    type="text"
                    placeholder="Search buyer..."
                    value={filters.buyer}
                    onChange={(e) => handleFilterChange('buyer', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition-all"
                  />
                </div>

                {/* Seller Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-orange-600" />
                    Seller
                  </label>
                  <input
                    type="text"
                    placeholder="Search seller..."
                    value={filters.seller}
                    onChange={(e) => handleFilterChange('seller', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition-all"
                  />
                </div>

                {/* Date Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Created Date
                  </label>
                  <input
                    type="text"
                    placeholder="Search date..."
                    value={filters.created_at}
                    onChange={(e) => handleFilterChange('created_at', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
                <button
                  onClick={() => handleSort('created_at')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    sortField === 'created_at'
                      ? 'bg-[#FF6600] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Date
                  {sortField === 'created_at' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('property_id')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    sortField === 'property_id'
                      ? 'bg-[#FF6600] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Property
                  {sortField === 'property_id' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('buyer')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    sortField === 'buyer'
                      ? 'bg-[#FF6600] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Buyer
                  {sortField === 'buyer' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('seller')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    sortField === 'seller'
                      ? 'bg-[#FF6600] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Seller
                  {sortField === 'seller' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedConversations.map((conversation) => {
                      const property = properties.find(p => p.id === conversation.property_id)
                      return (
                        <tr
                          key={conversation.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleConversationClick(conversation)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {property?.photobloburl && getPhotoUrl(property.photobloburl) && (
                                <img
                                  src={getPhotoUrl(property.photobloburl) || ''}
                                  alt={property.title}
                                  className="h-12 w-12 rounded-lg object-cover mr-3"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {property?.title || 'Property not found'}
                                </div>
                                {property && (
                                  <div className="text-sm text-gray-500">
                                    ${property.price.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{conversation.buyer}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{conversation.seller}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(conversation.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleConversationClick(conversation)
                              }}
                              className="text-[#FF6600] hover:text-[#FF5500] font-semibold"
                            >
                              Open Chat
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="lg:hidden space-y-4">
              {filteredAndSortedConversations.map((conversation) => {
                const property = properties.find(p => p.id === conversation.property_id)
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200 hover:border-[#FF6600]"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Property Info */}
                      <div className="flex gap-3 sm:gap-4 mb-4">
                        {property?.photobloburl && getPhotoUrl(property.photobloburl) && (
                          <div className="relative flex-shrink-0">
                            <img
                              src={getPhotoUrl(property.photobloburl) || ''}
                              alt={property.title}
                              className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-xl shadow-sm"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-1.5">
                              <Home className="w-3.5 h-3.5 text-[#FF6600]" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1.5 line-clamp-2">
                            {property?.title || 'Property not found'}
                          </h3>
                          {property && (
                            <div className="flex items-center gap-1.5 text-[#FF6600] font-bold text-lg sm:text-xl mb-2">
                              <DollarSign className="w-5 h-5" />
                              {property.price.toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(conversation.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Buyer</div>
                            <div className="font-semibold text-gray-900 truncate text-sm">
                              {conversation.buyer}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Seller</div>
                            <div className="font-semibold text-gray-900 truncate text-sm">
                              {conversation.seller}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 sm:px-5 py-3 flex items-center justify-between hover:from-orange-100 hover:to-orange-150 transition-colors">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#FF6600]" />
                        View Conversation
                      </span>
                      <svg
                        className="w-5 h-5 text-[#FF6600] transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showChatModal && selectedProperty && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false)
            setSelectedProperty(null)
            setSelectedConversationId(null)
          }}
          property={selectedProperty}
          currentUserId={userId || 0}
          initialConversationId={selectedConversationId}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
