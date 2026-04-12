'use client'

import { useState, useEffect } from 'react'
import { Home, Eye, Pause, Trash2, Star, AlertCircle, CheckCircle, Clock, Search, Filter, MoreVertical, Loader2, Edit, User, Calendar, FileCheck, Building2, MapPin, Bed, Bath, Car, Ruler, DollarSign, ListChecks, XCircle, ShieldCheck, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { buildApiUrl, getAzureBlobUrl } from '@/lib/config'
import { Property } from '@/types/property'
import AddPropertyDialog from '@/components/AddPropertyDialog'
import AuditProperty from '@/components/AuditProperty'
import UserProfile from '@/components/UserProfile'
import { usePageView } from '@/hooks/useAudit'
import { useAuth } from '@/lib/auth/auth-context'
import AdminHeader from '@/components/AdminHeader'
import Footer from '@/components/Footer'

interface User {
  id: number
  firstname: string
  lastname: string
  email: string
}

interface Listing {
  id: string
  title: string
  address: string
  suburb: string
  price: number
  seller: {
    name: string
    email: string
    id: string
  }
  status: 'draft' | 'review' | 'live' | 'paused' | 'archived' | 'sold'
  featured: boolean
  views: number
  inquiries: number
  badges: string[]
  createdAt: string
  updatedAt: string
  revenue: number
}

const mockListings: Listing[] = [
  {
    id: 'L001',
    title: 'Modern Family Home in Edge Hill',
    address: '42 Sunset Drive',
    suburb: 'Edge Hill',
    price: 750000,
    seller: { name: 'John Smith', email: 'john@email.com', id: 'U123' },
    status: 'live',
    featured: true,
    views: 1234,
    inquiries: 23,
    badges: ['contract', 'smoke_alarm', 'building_pest', 'pro_photos'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    revenue: 500
  },
  {
    id: 'L002',
    title: 'Beachfront Apartment',
    address: '15 Ocean View',
    suburb: 'North Ward',
    price: 450000,
    seller: { name: 'Sarah Johnson', email: 'sarah@email.com', id: 'U124' },
    status: 'live',
    featured: false,
    views: 856,
    inquiries: 12,
    badges: ['contract', 'smoke_alarm'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-19',
    revenue: 500
  },
  {
    id: 'L003',
    title: 'Rural Property with Acreage',
    address: '200 Country Lane',
    suburb: 'Charters Towers',
    price: 550000,
    seller: { name: 'Michael Brown', email: 'michael@email.com', id: 'U125' },
    status: 'review',
    featured: false,
    views: 0,
    inquiries: 0,
    badges: ['contract'],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    revenue: 0
  }
]

const getStatusDisplay = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'draft': 'Draft',
    'pendingapproval': 'Pending Approval',
    'needsfix': 'Needs Fix',
    'published': 'Published',
    'rejected': 'Rejected',
    'archived': 'Unpublish/Suspend'
  }
  return statusMap[status] || status
}

const getStatusBgColor = (status: string): string => {
  const lowerStatus = status?.toLowerCase() || ''
  if (lowerStatus === 'published') return 'bg-green-100'
  if (lowerStatus === 'needsfix') return 'bg-amber-200'
  if (lowerStatus === 'rejected') return 'bg-red-100'
  if (lowerStatus === 'archived') return 'bg-gray-100'
  return 'bg-white' // draft and default
}

export default function AdminListingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  usePageView('admin-listings')
  const [properties, setProperties] = useState<Property[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState(mockListings)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState<{type: string, listing: Listing} | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<Property | null>(null)
  const [verificationLoading, setVerificationLoading] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [auditPropertyId, setAuditPropertyId] = useState<number | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('')

  // Check authentication
  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.replace('/')
      return
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch data when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchUsers()
      fetchProperties()
    }
  }, [authLoading, isAuthenticated])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render admin content if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/user'))
      if (response.ok) {
        const data: User[] = await response.json()
        setUsers(data)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://buysel.azurewebsites.net/api/property/all')
      if (response.ok) {
        const data: Property[] = await response.json()
        setProperties(data)
      } else {
        console.error('Failed to fetch properties')
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = listings.filter(listing => {
    if (filterStatus !== 'all' && listing.status !== filterStatus) return false
    if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !listing.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !listing.suburb.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

 

  const handleStatusChange = (listingId: string, newStatus: Listing['status']) => {
    setListings(listings.map(l => 
      l.id === listingId ? { ...l, status: newStatus } : l
    ))
    setShowConfirmDialog(null)
  }

  const handleUnlist = (listing: Listing) => {
    setShowConfirmDialog({ type: 'unlist', listing })
  }

  const confirmUnlist = () => {
    if (showConfirmDialog && showConfirmDialog.listing) {
      handleStatusChange(showConfirmDialog.listing.id, 'archived')
      // Log audit action
      console.log(`Audit Log: Admin unlisted property ${showConfirmDialog.listing.id}`)
    }
  }

  const handleVerificationToggle = async (propertyId: number, field: 'buildinginspverified' | 'pestinspverified' | 'titlesrchcouncilrateverified') => {
    if (!selectedProperty || verificationLoading) return

    const newValue = !selectedProperty[field]
    setVerificationLoading(field)

    try {
      const updatedProperty = { ...selectedProperty, [field]: newValue }

      const response = await fetch('https://buysel.azurewebsites.net/api/property', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProperty),
      })

      if (response.ok) {
        setSelectedProperty(updatedProperty)
        setProperties(properties.map(p => p.id === propertyId ? updatedProperty : p))
        console.log(`Audit Log: Admin ${newValue ? 'verified' : 'unverified'} ${field} for property ${propertyId}`)
      }
    } catch (error) {
      console.error('Error updating verification:', error)
    } finally {
      setVerificationLoading(null)
    }
  }

  const handleDeleteProperty = async () => {
    if (!showDeleteDialog) return

    try {
      const response = await fetch(`https://buysel.azurewebsites.net/api/property/${showDeleteDialog.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log(`Audit Log: Admin deleted property ${showDeleteDialog.id}`)
        setShowDeleteDialog(null)
        // Refresh the properties list
        await fetchProperties()
      } else {
        console.error('Failed to delete property')
        alert('Failed to delete property. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Error deleting property. Please try again.')
    }
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    setShowEditDialog(true)
  }

  const handleSaveEditedProperty = async (property: Property) => {
    try {
      const response = await fetch('https://buysel.azurewebsites.net/api/property', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(property),
      })

      if (response.ok) {
        console.log(`Audit Log: Admin edited property ${property.id}`)
        setShowEditDialog(false)
        setEditingProperty(null)
        // Refresh the properties list
        await fetchProperties()
      } else {
        console.error('Failed to save property')
        alert('Failed to save property. Please try again.')
      }
    } catch (error) {
      console.error('Error saving property:', error)
      alert('Error saving property. Please try again.')
    }
  }

  const stats = {
    total: properties.length,
    published: properties.filter(p => p.status?.toLowerCase() === 'published' || p.status?.toLowerCase() === 'live').length,
    draft: properties.filter(p => p.status?.toLowerCase() === 'draft').length,
    needFix: properties.filter(p => p.status?.toLowerCase() === 'needsfix').length
  }

  const filteredProperties = properties.filter(property => {
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        property.title?.toLowerCase().includes(searchLower) ||
        property.address?.toLowerCase().includes(searchLower) ||
        property.suburb?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'published') {
        return property.status?.toLowerCase() === 'published' || property.status?.toLowerCase() === 'live'
      } else if (filterStatus === 'draft') {
        return property.status?.toLowerCase() === 'draft'
      } else if (filterStatus === 'needfix') {
        return property.status?.toLowerCase() === 'needsfix'
      }
    }

    return true
  })

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} isAuthenticated={isAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="needfix">Need Fix</option>
            </select>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center">
              <Loader2 className="animate-spin h-8 w-8 text-red-600" />
              <span className="ml-3 text-gray-600">Loading properties...</span>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">There are no properties matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[28%]">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[22%]">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.map((property) => {
                    const seller = users.find(u => u.id === property.sellerid)
                    const hasUnverifiedDocs = (property.titlesrchcouncilrateazureblob && !property.titlesrchcouncilrateverified) ||
                                             (property.buildinginspazureblob && !property.buildinginspverified) ||
                                             (property.pestinspazureblob && !property.pestinspverified)

                    return (
                      <tr key={property.id} className={`${getStatusBgColor(property.status || '')} hover:bg-gray-50 transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {property.photobloburl ? (
                              <img
                                src={getAzureBlobUrl(property.photobloburl)}
                                alt={property.title}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Home className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                            <div className="ml-4">
                              <p className="text-sm font-semibold text-gray-900">{property.title}</p>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {property.address}
                              </p>
                              <p className="text-base font-bold text-blue-600 mt-1">${property.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                              {property.typeofprop || 'N/A'}
                            </p>
                            <p className="flex items-center">
                              <Bed className="h-4 w-4 mr-2 text-gray-400" />
                              {property.beds} bed · {property.baths} bath · {property.carspaces} car
                            </p>
                            <p className="flex items-center">
                              <Ruler className="h-4 w-4 mr-2 text-gray-400" />
                              {property.landsize}m² · Built {property.buildyear}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-2 rounded-full">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="ml-2">
                              <button
                                onClick={() => {
                                  if (seller?.email) {
                                    setSelectedUserEmail(seller.email)
                                    setShowUserProfile(true)
                                  }
                                }}
                                disabled={!seller?.email}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors text-left disabled:cursor-not-allowed"
                              >
                                {seller ? `${seller.firstname} ${seller.lastname}` : `User #${property.sellerid}`}
                              </button>
                              <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                <Calendar className="h-3 w-3 mr-1" />
                                {property.dte ? new Date(property.dte).toLocaleDateString() : 'N/A'}
                              </p>
                              <button
                                onClick={() => setAuditPropertyId(property.id)}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                              >
                                <Activity className="h-3 w-3 mr-1" />
                                Audit
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {getStatusDisplay(property.status || '')}
                              </span>
                            </div>
                            {hasUnverifiedDocs ? (
                              <button
                                onClick={() => {
                                  setSelectedProperty(property)
                                  setShowDocumentsModal(true)
                                }}
                                className="flex items-center bg-amber-100 hover:bg-amber-200 rounded-lg px-3 py-2 transition-all hover:scale-105"
                              >
                                <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                                <span className="text-xs font-medium text-amber-800">Needs Verification</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedProperty(property)
                                  setShowDocumentsModal(true)
                                }}
                                className="flex items-center bg-white hover:bg-green-50 rounded-lg px-3 py-2 border border-green-200 transition-all hover:scale-105"
                              >
                                <ShieldCheck className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-xs font-medium text-green-700">All Verified</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => handleEditProperty(property)}
                              className="w-32 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <Edit className="h-4 w-4" />
                             Review
                            </button>
                            
                            <button
                              onClick={() => setShowDeleteDialog(property)}
                              className="w-32 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on Desktop */}
            <div className="lg:hidden space-y-4">
              {filteredProperties.map((property) => {
                const seller = users.find(u => u.id === property.sellerid)
                const hasUnverifiedDocs = (property.titlesrchcouncilrateazureblob && !property.titlesrchcouncilrateverified) ||
                                         (property.buildinginspazureblob && !property.buildinginspverified) ||
                                         (property.pestinspazureblob && !property.pestinspverified)

                return (
                  <div key={property.id} className={`${getStatusBgColor(property.status || '')} rounded-lg shadow-sm border border-gray-200 overflow-hidden`}>
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-100">
                      {property.photobloburl ? (
                        <img
                          src={getAzureBlobUrl(property.photobloburl)}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {hasUnverifiedDocs ? (
                        <button
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowDocumentsModal(true)
                          }}
                          className="absolute top-3 right-3 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all hover:scale-105"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Needs Verification
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowDocumentsModal(true)
                          }}
                          className="absolute top-3 right-3 bg-white hover:bg-green-50 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-green-200 transition-all hover:scale-105"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </button>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.address}
                      </p>
                      <p className="text-2xl font-bold text-blue-600 mb-4">${property.price.toLocaleString()}</p>

                      {/* Property Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {property.typeofprop || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Bed className="h-4 w-4 mr-2 text-gray-400" />
                          {property.beds} bed
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Bath className="h-4 w-4 mr-2 text-gray-400" />
                          {property.baths} bath
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Car className="h-4 w-4 mr-2 text-gray-400" />
                          {property.carspaces} car
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Ruler className="h-4 w-4 mr-2 text-gray-400" />
                          {property.landsize}m²
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          Built {property.buildyear}
                        </div>
                      </div>

                      {/* Seller Info */}
                      <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <button
                            onClick={() => {
                              if (seller?.email) {
                                setSelectedUserEmail(seller.email)
                                setShowUserProfile(true)
                              }
                            }}
                            disabled={!seller?.email}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors text-left disabled:cursor-not-allowed"
                          >
                            {seller ? `${seller.firstname} ${seller.lastname}` : `User #${property.sellerid}`}
                          </button>
                          <p className="text-xs text-gray-500">
                            Listed: {property.dte ? new Date(property.dte).toLocaleDateString() : 'N/A'}
                          </p>
                          <button
                            onClick={() => setAuditPropertyId(property.id)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            View Audit Log
                          </button>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {getStatusDisplay(property.status || '')}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-2 font-medium"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Property
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowDocumentsModal(true)
                          }}
                          className="w-full px-4 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center justify-center gap-2 font-medium"
                        >
                          <FileCheck className="h-4 w-4" />
                          Verify Documents
                        </button>
                        <button
                          onClick={() => setShowDeleteDialog(property)}
                          className="w-full px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2 font-medium"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Property
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to unlist &ldquo;{showConfirmDialog.listing.title}&rdquo;? This action will be logged in the audit trail.
              </p>
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50" onClick={() => setShowConfirmDialog(null)}>
                  Cancel
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={confirmUnlist}>
                  Unlist Property
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Confirm Deletion</h3>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete this property?
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-4 border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">{showDeleteDialog.title}</p>
                <p className="text-sm text-gray-600 flex items-center mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {showDeleteDialog.address}
                </p>
                <p className="text-lg font-bold text-blue-600 flex items-center">
                  <DollarSign className="h-5 w-5 mr-1" />
                  {showDeleteDialog.price.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>This action cannot be undone. All property data and associated documents will be permanently deleted.</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  onClick={() => setShowDeleteDialog(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  onClick={handleDeleteProperty}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Property
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Property Dialog */}
        {showEditDialog && editingProperty && (
          <AddPropertyDialog
            property={editingProperty}
            onClose={() => {
              setShowEditDialog(false)
              setEditingProperty(null)
            }}
            onSave={handleSaveEditedProperty}
            admin={true}
          />
        )}

        {/* Documents Verification Modal */}
        {showDocumentsModal && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Verify Documents</h3>
                    <p className="text-sm text-gray-600">{selectedProperty.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Title Search/Council Rates Document */}
                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedProperty.titlesrchcouncilrateverified ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <FileCheck className={`h-5 w-5 ${selectedProperty.titlesrchcouncilrateverified ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Title Search or Council Rates Notice</h4>
                    </div>
                    {selectedProperty.titlesrchcouncilrateazureblob && (
                      <button
                        onClick={() => handleVerificationToggle(selectedProperty.id, 'titlesrchcouncilrateverified')}
                        disabled={verificationLoading === 'titlesrchcouncilrateverified'}
                        className={`px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all ${
                          selectedProperty.titlesrchcouncilrateverified
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                      >
                        {verificationLoading === 'titlesrchcouncilrateverified' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {selectedProperty.titlesrchcouncilrateverified ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Verified
                          </>
                        ) : (
                          'Mark as Verified'
                        )}
                      </button>
                    )}
                  </div>
                  {selectedProperty.titlesrchcouncilrateazureblob ? (
                    <div className="bg-gray-50 rounded p-2">
                      <iframe
                        src={getAzureBlobUrl(selectedProperty.titlesrchcouncilrateazureblob) || ''}
                        className="w-full h-96 rounded"
                        title="Title Search or Council Rates"
                      />
                      <button
                        onClick={() => window.open(getAzureBlobUrl(selectedProperty.titlesrchcouncilrateazureblob!) || '', '_blank')}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No document uploaded</p>
                  )}
                </div>

                {/* Building Inspection Report */}
                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedProperty.buildinginspverified ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <FileCheck className={`h-5 w-5 ${selectedProperty.buildinginspverified ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Building Inspection Report</h4>
                    </div>
                    {selectedProperty.buildinginspazureblob && (
                      <button
                        onClick={() => handleVerificationToggle(selectedProperty.id, 'buildinginspverified')}
                        disabled={verificationLoading === 'buildinginspverified'}
                        className={`px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all ${
                          selectedProperty.buildinginspverified
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                      >
                        {verificationLoading === 'buildinginspverified' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {selectedProperty.buildinginspverified ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Verified
                          </>
                        ) : (
                          'Mark as Verified'
                        )}
                      </button>
                    )}
                  </div>
                  {selectedProperty.buildinginspazureblob ? (
                    <div className="bg-gray-50 rounded p-2">
                      <iframe
                        src={getAzureBlobUrl(selectedProperty.buildinginspazureblob) || ''}
                        className="w-full h-96 rounded"
                        title="Building Inspection"
                      />
                      <button
                        onClick={() => window.open(getAzureBlobUrl(selectedProperty.buildinginspazureblob!) || '', '_blank')}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No document uploaded</p>
                  )}
                </div>

                {/* Pest Inspection Report */}
                <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedProperty.pestinspverified ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <FileCheck className={`h-5 w-5 ${selectedProperty.pestinspverified ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Pest Inspection Report</h4>
                    </div>
                    {selectedProperty.pestinspazureblob && (
                      <button
                        onClick={() => handleVerificationToggle(selectedProperty.id, 'pestinspverified')}
                        disabled={verificationLoading === 'pestinspverified'}
                        className={`px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all ${
                          selectedProperty.pestinspverified
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                      >
                        {verificationLoading === 'pestinspverified' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {selectedProperty.pestinspverified ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Verified
                          </>
                        ) : (
                          'Mark as Verified'
                        )}
                      </button>
                    )}
                  </div>
                  {selectedProperty.pestinspazureblob ? (
                    <div className="bg-gray-50 rounded p-2">
                      <iframe
                        src={getAzureBlobUrl(selectedProperty.pestinspazureblob) || ''}
                        className="w-full h-96 rounded"
                        title="Pest Inspection"
                      />
                      <button
                        onClick={() => window.open(getAzureBlobUrl(selectedProperty.pestinspazureblob!) || '', '_blank')}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No document uploaded</p>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white border-t px-6 py-4">
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary - Moved to Bottom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setFilterStatus('published')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Published</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.published}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setFilterStatus('draft')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Draft</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.draft}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setFilterStatus('needfix')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Need Fix</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.needFix}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Property Modal */}
      {auditPropertyId && (
        <AuditProperty
          propertyid={auditPropertyId}
          onClose={() => setAuditPropertyId(null)}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUserEmail && (
        <UserProfile
          email={selectedUserEmail}
          isOpen={showUserProfile}
          onClose={() => {
            setShowUserProfile(false)
            setSelectedUserEmail('')
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
