'use client'

import { useState, useEffect } from 'react'
import { Users, User, Mail, Search, Ban, UserCheck, Edit, ShoppingCart, Home as HomeIcon, Phone, MapPin, Calendar, Shield, CheckCircle, XCircle, Loader2, Hash, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import AdminHeader from '@/components/AdminHeader'
import Footer from '@/components/Footer'
import { getPublicFileUrl } from '@/lib/config'
import type { Seller } from '@/types/seller'
import UserDetailsModal from '@/components/UserDetailsModal'
import { usePageView } from '@/hooks/useAudit'

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
  role: 'buyer' | 'seller' | 'conveyancer' | 'admin'
  status: 'active' | 'suspended' | 'pending'
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  lastLoginAt: string
  listings?: number
  purchases?: number
  revenue?: number
  messages?: number
  properties?: {
    id: string
    title: string
    status: string
  }[]
}

const mockUsers: UserData[] = [
  {
    id: 'U123',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '0412 345 678',
    role: 'seller',
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-06-15',
    lastLoginAt: '2024-01-21',
    listings: 2,
    revenue: 1000,
    messages: 23,
    properties: [
      { id: 'L001', title: 'Modern Family Home in Edge Hill', status: 'live' },
      { id: 'L004', title: 'Investment Property', status: 'draft' }
    ]
  },
  {
    id: 'U124',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '0423 456 789',
    role: 'seller',
    status: 'active',
    emailVerified: true,
    phoneVerified: false,
    createdAt: '2023-08-20',
    lastLoginAt: '2024-01-20',
    listings: 1,
    revenue: 850,
    messages: 12,
    properties: [
      { id: 'L002', title: 'Beachfront Apartment', status: 'live' }
    ]
  },
  {
    id: 'U125',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    role: 'buyer',
    status: 'active',
    emailVerified: true,
    phoneVerified: false,
    createdAt: '2023-11-10',
    lastLoginAt: '2024-01-19',
    purchases: 0,
    messages: 8
  },
  {
    id: 'U126',
    name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    phone: '0434 567 890',
    role: 'buyer',
    status: 'suspended',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-09-05',
    lastLoginAt: '2024-01-10',
    purchases: 1,
    messages: 45
  },
  {
    id: 'CONV001',
    name: 'Jane Smith',
    email: 'jane@smithconveyancers.com.au',
    phone: '0412 345 678',
    role: 'conveyancer',
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-06-15',
    lastLoginAt: '2024-01-21'
  },
  {
    id: 'U127',
    name: 'Test User',
    email: 'test@example.com',
    role: 'buyer',
    status: 'pending',
    emailVerified: false,
    phoneVerified: false,
    createdAt: '2024-01-21',
    lastLoginAt: '2024-01-21',
    purchases: 0,
    messages: 0
  }
]

interface MockUserDetailsModalProps {
  user: UserData
  onClose: () => void
  onStatusChange: (userId: string, newStatus: UserData['status']) => void
}

function MockUserDetailsModal({ user, onClose, onStatusChange }: MockUserDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-semibold">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.status === 'active' ? 'bg-green-100 text-green-800' :
                user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {user.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium flex items-center">
                {user.email}
                {user.emailVerified && <UserCheck className="h-4 w-4 ml-1 text-green-600" />}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium flex items-center">
                {user.phone || 'Not provided'}
                {user.phone && user.phoneVerified && <UserCheck className="h-4 w-4 ml-1 text-green-600" />}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Login</p>
              <p className="font-medium">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Activity Stats */}
          {user.role === 'seller' && (
            <div>
              <h4 className="font-medium mb-3">Seller Activity</h4>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-600">Listings</p>
                  <p className="text-2xl font-bold">{user.listings || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold">${user.revenue || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold">{user.messages || 0}</p>
                </div>
              </div>
              
              {user.properties && user.properties.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Properties</h5>
                  <div className="space-y-2">
                    {user.properties.map((property) => (
                      <div key={property.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{property.title}</span>
                        <Link 
                          href={`/admin/listings?id=${property.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user.role === 'buyer' && (
            <div>
              <h4 className="font-medium mb-3">Buyer Activity</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-600">Properties Purchased</p>
                  <p className="text-2xl font-bold">{user.purchases || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Messages Sent</p>
                  <p className="text-2xl font-bold">{user.messages || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Actions</h4>
            <div className="flex space-x-3">
              {user.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => onStatusChange(user.id, 'suspended')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend User
                </button>
              ) : user.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => onStatusChange(user.id, 'active')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Reactivate User
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStatusChange(user.id, 'active')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve User
                </button>
              )}
              <button type="button" className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
              <Link href={`/admin/audit?user=${user.id}`} className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                View Audit Log
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const hasValidPhotoUrl = (photoBlobPath: string | null | undefined): string | null => {
  if (!photoBlobPath || photoBlobPath.trim() === '') return null
  const photoUrl = getPublicFileUrl(photoBlobPath)
  return photoUrl.trim() === '' ? null : photoUrl
}

export default function AdminUsersPage() {
  usePageView('admin-users')
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [apiUsers, setApiUsers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null)
  const [users, setUsers] = useState(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [selectedApiUser, setSelectedApiUser] = useState<Seller | null>(null)
  const [selectedApiUserTab, setSelectedApiUserTab] = useState<string>('info')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const normalizeSeller = (raw: Partial<Seller>): Seller => ({
    id: Number(raw.id || 0),
    email: typeof raw.email === 'string' ? raw.email : '',
    role: raw.role || 'user',
    firstname: typeof raw.firstname === 'string' ? raw.firstname : '',
    lastname: typeof raw.lastname === 'string' ? raw.lastname : '',
    mobile: typeof raw.mobile === 'string' ? raw.mobile : '',
    address: typeof raw.address === 'string' ? raw.address : '',
    idbloburl: typeof raw.idbloburl === 'string' ? raw.idbloburl : '',
    idverified: raw.idverified || null,
    dte: typeof raw.dte === 'string' ? raw.dte : '',
    termsconditions: Boolean(raw.termsconditions),
    privacypolicy: Boolean(raw.privacypolicy),
    middlename: typeof raw.middlename === 'string' ? raw.middlename : '',
    dateofbirth: raw.dateofbirth || null,
    residencystatus: typeof raw.residencystatus === 'string' ? raw.residencystatus : '',
    maritalstatus: typeof raw.maritalstatus === 'string' ? raw.maritalstatus : '',
    powerofattorney: typeof raw.powerofattorney === 'string' ? raw.powerofattorney : '',
    idtype: typeof raw.idtype === 'string' ? raw.idtype : 'none',
    ratesnotice: raw.ratesnotice || null,
    ratesnoticeverified: raw.ratesnoticeverified || null,
    titlesearch: raw.titlesearch || null,
    titlesearchverified: raw.titlesearchverified || null,
    admin: Boolean(raw.admin),
    photoazurebloburl: raw.photoazurebloburl || null,
    photoverified: raw.photoverified ? String(raw.photoverified) : null,
  })

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
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      fetchUsers()
    }
  }, [authLoading, isAuthenticated, user?.role])

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

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-md border border-red-100 p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin access required</h1>
          <p className="text-gray-600 mb-4">
            Your account is authenticated but does not have the <span className="font-semibold">admin</span> role,
            so the users API returns <span className="font-semibold">403 Forbidden</span>.
          </p>
          <p className="text-sm text-gray-500">
            Ask an existing administrator to grant admin permissions to this account, then sign out and sign back in.
          </p>
        </div>
      </div>
    )
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setUsersLoadError(null)
      const response = await fetch('/api/user')
      if (response.ok) {
        const rawData = await response.json()
        const data: Seller[] = Array.isArray(rawData) ? rawData.map(normalizeSeller) : []
        setApiUsers(data)
      } else {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        const message = response.status === 403
          ? 'Forbidden: admin role required to view users.'
          : payload?.error || `Failed to fetch users (${response.status})`
        console.error(message)
        setUsersLoadError(message)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsersLoadError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false
    if (filterStatus !== 'all' && user.status !== filterStatus) return false
    if (searchQuery && 
        !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleStatusChange = (userId: string, newStatus: UserData['status']) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: newStatus } : u
    ))
    // Log audit action
    console.log(`Audit Log: Admin changed user ${userId} status to ${newStatus}`)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedUsers = [...apiUsers].sort((a, b) => {
    if (!sortField) return 0

    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'name':
        aValue = `${a.firstname} ${a.lastname}`.toLowerCase()
        bValue = `${b.firstname} ${b.lastname}`.toLowerCase()
        break
      case 'address':
        aValue = a.address?.toLowerCase() || ''
        bValue = b.address?.toLowerCase() || ''
        break
      case 'idverified':
        aValue = a.idverified ? 1 : 0
        bValue = b.idverified ? 1 : 0
        break
      case 'photoverified':
        aValue = a.photoverified ? 1 : 0
        bValue = b.photoverified ? 1 : 0
        break
      case 'joined':
        aValue = a.dte ? new Date(a.dte).getTime() : 0
        bValue = b.dte ? new Date(b.dte).getTime() : 0
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const stats = {
    total: apiUsers.length,
    sellers: apiUsers.filter((user) => user.role === 'seller').length,
    buyers: apiUsers.filter((user) => user.role === 'buyer').length
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} isAuthenticated={isAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="conveyancer">Conveyancers</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {usersLoadError && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {usersLoadError}
          </div>
        )}

        {/* Users Table/Cards */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center">
              <Loader2 className="animate-spin h-8 w-8 text-red-600" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          </div>
        ) : apiUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        User
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center gap-2">
                        Address
                        {sortField === 'address' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('idverified')}
                    >
                      <div className="flex items-center gap-2">
                        ID Verified
                        {sortField === 'idverified' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('photoverified')}
                    >
                      <div className="flex items-center gap-2">
                        Photo Verified
                        {sortField === 'photoverified' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('joined')}
                    >
                      <div className="flex items-center gap-2">
                        Joined
                        {sortField === 'joined' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors text-black ${!user.idbloburl || user.idbloburl.trim() === '' ? 'bg-red-200' : user.idverified ? 'bg-green-200' : 'bg-orange-200'}`}>
                      <td className="px-6 py-4">
                        {hasValidPhotoUrl(user.photoazurebloburl) ? (
                          <img
                            src={hasValidPhotoUrl(user.photoazurebloburl) || ''}
                            alt={`${user.firstname} ${user.lastname}`}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.firstname} {user.middlename || ''} {user.lastname}</p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          {user.mobile && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.mobile}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>{user.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {!user.idbloburl || user.idbloburl.trim() === '' ? (
                            <>
                              <Shield className="h-4 w-4 text-red-500 mr-2" />
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-200 text-red-900">
                                No ID
                              </span>
                            </>
                          ) : user.idverified ? (
                            <>
                              <Shield className="h-4 w-4 text-green-500 mr-2" />
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                ID Verified
                              </span>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApiUserTab('id')
                                setSelectedApiUser(user)
                              }}
                              className="flex items-center gap-2 px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                            >
                              <Shield className="h-4 w-4 text-gray-400" />
                              ID To be Verified
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {!hasValidPhotoUrl(user.photoazurebloburl) ? (
                            <>
                              <Shield className="h-4 w-4 text-red-500 mr-2" />
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-200 text-red-900">
                                No Photo
                              </span>
                            </>
                          ) : user.photoverified ? (
                            <>
                              <Shield className="h-4 w-4 text-green-500 mr-2" />
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Photo Verified
                              </span>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApiUserTab('photo')
                                setSelectedApiUser(user)
                              }}
                              className="flex items-center gap-2 px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                            >
                              <Shield className="h-4 w-4 text-gray-400" />
                              Photo To be Verified
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {user.dte ? new Date(user.dte).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedApiUserTab('info')
                            setSelectedApiUser(user)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on Desktop */}
            <div className="lg:hidden space-y-4 mb-6">
              {sortedUsers.map((user) => (
                <div key={user.id} className={`rounded-lg shadow-sm border border-gray-200 overflow-hidden text-black ${!user.idbloburl || user.idbloburl.trim() === '' ? 'bg-red-200' : user.idverified ? 'bg-green-200' : 'bg-orange-200'}`}>
                  <div className="p-4">
                    {/* Header with Photo and Name */}
                    <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-200">
                      {hasValidPhotoUrl(user.photoazurebloburl) ? (
                        <img
                          src={hasValidPhotoUrl(user.photoazurebloburl) || ''}
                          alt={`${user.firstname} ${user.lastname}`}
                          className="w-16 h-16 object-cover rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {user.firstname} {user.middlename || ''} {user.lastname}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.mobile && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            <span>{user.mobile}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs text-gray-500 block mb-0.5">Address</span>
                          <span className="text-gray-900">{user.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center mb-1">
                            <Shield className={`h-4 w-4 mr-1.5 ${
                              !user.idbloburl || user.idbloburl.trim() === '' ? 'text-red-500' :
                              user.idverified ? 'text-green-500' : 'text-gray-400'
                            }`} />
                            <span className="text-xs text-gray-500">ID Status</span>
                          </div>
                          {!user.idbloburl || user.idbloburl.trim() === '' ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-200 text-red-900">
                              No ID
                            </span>
                          ) : user.idverified ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              ID Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApiUserTab('id')
                                setSelectedApiUser(user)
                              }}
                              className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                            >
                              ID To be Verified
                            </button>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <Shield className={`h-4 w-4 mr-1.5 ${
                              !hasValidPhotoUrl(user.photoazurebloburl) ? 'text-red-500' :
                              user.photoverified ? 'text-green-500' : 'text-gray-400'
                            }`} />
                            <span className="text-xs text-gray-500">Photo Status</span>
                          </div>
                          {!hasValidPhotoUrl(user.photoazurebloburl) ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-200 text-red-900">
                              No Photo
                            </span>
                          ) : user.photoverified ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Photo Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApiUserTab('photo')
                                setSelectedApiUser(user)
                              }}
                              className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                            >
                              Photo To be Verified
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Joined Date */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-xs text-gray-500 mr-2">Joined:</span>
                        <span className="text-gray-900 font-medium">
                          {user.dte ? new Date(user.dte).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => {
                        setSelectedApiUserTab('info')
                        setSelectedApiUser(user)
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 hover:shadow-lg transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit User</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stats - Moved to Bottom */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Buyers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.buyers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Sellers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sellers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <HomeIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* User Details Modal (Mock) */}
        {selectedUser && (
          <MockUserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onStatusChange={(userId, newStatus) => {
              handleStatusChange(userId, newStatus)
              setSelectedUser(null)
            }}
          />
        )}

        {/* API User Details Modal */}
        {selectedApiUser && (
          <UserDetailsModal
            selectedSeller={selectedApiUser}
            setSelectedSeller={(user) => {
              setSelectedApiUser(user)
              setSelectedApiUserTab('info')
            }}
            setUsers={setApiUsers}
            users={apiUsers}
            initialTab={selectedApiUserTab}
          />
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
