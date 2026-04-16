'use client'

import { useState, Dispatch, SetStateAction } from 'react'
import { X, CheckCircle, XCircle, User, Mail, Phone, MapPin, Calendar, Shield, Activity, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Seller } from '@/types/seller'
import { buildApiUrl, getAzureBlobUrl } from '@/lib/config'
import { invalidateUserDataCache } from '@/hooks/useUserData'

interface UserDetailsModalProps {
  selectedSeller: Seller
  setSelectedSeller: (seller: Seller | null) => void
  setSellers?: Dispatch<SetStateAction<Seller[]>>
  sellers?: Seller[]
  setUsers?: Dispatch<SetStateAction<Seller[]>>
  users?: Seller[]
  initialTab?: string
}

export default function UserDetailsModal({
  selectedSeller,
  setSelectedSeller,
  setSellers,
  sellers,
  setUsers,
  users,
  initialTab = 'info'
}: UserDetailsModalProps) {
  const [activeModalTab, setActiveModalTab] = useState(initialTab)
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [loadingId, setLoadingId] = useState(false)
  const [loadingRates, setLoadingRates] = useState(false)
  const [loadingTitle, setLoadingTitle] = useState(false)

  const updateUserData = (updatedUser: Seller) => {
    if (setSellers && sellers) {
      setSellers(sellers.map(s => s.id === updatedUser.id ? updatedUser : s))
    }
    if (setUsers && users) {
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" data-modal-tab-id="user-details">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={() => {
              setSelectedSeller(null)
              setActiveModalTab('info')
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveModalTab('info')}
              className={`py-4 px-2 border-b-2 transition-all ${activeModalTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Information
            </button>
            <button
              onClick={() => setActiveModalTab('id')}
              className={`py-4 px-2 border-b-2 transition-all ${activeModalTab === 'id' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              ID Verification
            </button>
            <button
              onClick={() => setActiveModalTab('rates')}
              className={`py-4 px-2 border-b-2 transition-all ${activeModalTab === 'rates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Rates Notice
            </button>
            <button
              onClick={() => setActiveModalTab('title')}
              className={`py-4 px-2 border-b-2 transition-all ${activeModalTab === 'title' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Title Search
            </button>
            <button
              onClick={() => setActiveModalTab('photo')}
              className={`py-4 px-2 border-b-2 transition-all ${activeModalTab === 'photo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Selfie Photo
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeModalTab === 'photo' ? (
            <>
              {/* Selfie Photo Tab */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Selfie Photo</h3>
                  {selectedSeller.photoazurebloburl && selectedSeller.photoazurebloburl.trim() !== '' ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img
                          src={getAzureBlobUrl(selectedSeller.photoazurebloburl)}
                          alt="Selfie Photo"
                          className="w-64 h-64 object-cover rounded-full border-4 border-gray-300 shadow-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                        <div className="flex items-center space-x-3">
                          {loadingPhoto && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                          <input
                            type="checkbox"
                            id="photoVerified"
                            checked={!!selectedSeller.photoverified}
                            disabled={loadingPhoto}
                            onChange={async (e) => {
                              const newVerified = e.target.checked
                              const newDate = newVerified ? new Date().toISOString() : null
                              setLoadingPhoto(true)

                              const updatedData = {
                                ...selectedSeller,
                                dateofbirth: selectedSeller.dateofbirth ? new Date(selectedSeller.dateofbirth).toISOString() : null,
                                dte: new Date(selectedSeller.dte).toISOString(),
                                idverified: selectedSeller.idverified ? new Date(selectedSeller.idverified).toISOString() : null,
                                ratesnoticeverified: selectedSeller.ratesnoticeverified ? new Date(selectedSeller.ratesnoticeverified).toISOString() : null,
                                titlesearchverified: selectedSeller.titlesearchverified ? new Date(selectedSeller.titlesearchverified).toISOString() : null,
                                photoverified: newDate
                              }

                              try {
                                const response = await fetch(buildApiUrl('/api/user'), {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedData)
                                })

                                if (response.ok) {
                                  const updatedSeller = { ...selectedSeller, photoverified: newDate }
                                  setSelectedSeller(updatedSeller)
                                  updateUserData(updatedSeller)
                                  invalidateUserDataCache() // Invalidate cache for all components
                                  toast.success(newVerified ? 'Photo verified successfully!' : 'Photo verification removed!')
                                } else {
                                  const errorText = await response.text()
                                  console.error('Update failed:', errorText)
                                  toast.error('Failed to update verification status. Check console for details.')
                                  e.target.checked = !newVerified
                                }
                              } catch (error) {
                                console.error('Failed to update verification:', error)
                                toast.error('Failed to update verification status: ' + error)
                                e.target.checked = !newVerified
                              } finally {
                                setLoadingPhoto(false)
                              }
                            }}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label htmlFor="photoVerified" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Photo Verified
                          </label>
                        </div>
                        {selectedSeller.photoverified && (
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 font-medium mb-2">No selfie photo submitted</p>
                      <p className="text-sm text-gray-500">The user has not uploaded their photo yet</p>
                      <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-gray-300">
                        <input
                          type="checkbox"
                          id="photoVerifiedDisabled"
                          checked={false}
                          disabled
                          className="w-5 h-5 text-gray-400 border-gray-300 rounded cursor-not-allowed opacity-50"
                        />
                        <label htmlFor="photoVerifiedDisabled" className="text-sm font-medium text-gray-400 cursor-not-allowed">
                          Photo Verified (disabled - no photo uploaded)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeModalTab === 'title' ? (
            <>
              {/* Title Search Tab */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Title Search Document</h3>
                  {selectedSeller.titlesearch && selectedSeller.titlesearch.trim() !== '' ? (
                    <div className="space-y-4">
                      <img
                        src={getAzureBlobUrl(selectedSeller.titlesearch)}
                        alt="Title Search"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-300"
                      />
                      <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                        <div className="flex items-center space-x-3">
                          {loadingTitle && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                          <input
                            type="checkbox"
                            id="titleVerified"
                            checked={!!selectedSeller.titlesearchverified}
                            disabled={loadingTitle}
                            onChange={async (e) => {
                              const newVerified = e.target.checked
                              const newDate = newVerified ? new Date().toISOString() : null
                              setLoadingTitle(true)

                              const updatedData = {
                                ...selectedSeller,
                                dateofbirth: selectedSeller.dateofbirth ? new Date(selectedSeller.dateofbirth).toISOString() : null,
                                dte: new Date(selectedSeller.dte).toISOString(),
                                idverified: selectedSeller.idverified ? new Date(selectedSeller.idverified).toISOString() : null,
                                ratesnoticeverified: selectedSeller.ratesnoticeverified ? new Date(selectedSeller.ratesnoticeverified).toISOString() : null,
                                titlesearchverified: newDate
                              }

                              try {
                                const response = await fetch(buildApiUrl('/api/user'), {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedData)
                                })

                                if (response.ok) {
                                  const updatedSeller = { ...selectedSeller, titlesearchverified: newDate }
                                  setSelectedSeller(updatedSeller)
                                  updateUserData(updatedSeller)
                                  invalidateUserDataCache() // Invalidate cache for all components
                                  toast.success(newVerified ? 'Title search verified successfully!' : 'Title search verification removed!')
                                } else {
                                  const errorText = await response.text()
                                  console.error('Update failed:', errorText)
                                  toast.error('Failed to update verification status. Check console for details.')
                                  e.target.checked = !newVerified
                                }
                              } catch (error) {
                                console.error('Failed to update verification:', error)
                                toast.error('Failed to update verification status: ' + error)
                                e.target.checked = !newVerified
                              } finally {
                                setLoadingTitle(false)
                              }
                            }}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label htmlFor="titleVerified" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Title Search Verified
                          </label>
                        </div>
                        {selectedSeller.titlesearchverified && (
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified on {new Date(selectedSeller.titlesearchverified).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 font-medium mb-2">No title search document submitted</p>
                      <p className="text-sm text-gray-500">The user has not uploaded their title search yet</p>
                      <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-gray-300">
                        <input
                          type="checkbox"
                          id="titleVerifiedDisabled"
                          checked={false}
                          disabled
                          className="w-5 h-5 text-gray-400 border-gray-300 rounded cursor-not-allowed opacity-50"
                        />
                        <label htmlFor="titleVerifiedDisabled" className="text-sm font-medium text-gray-400 cursor-not-allowed">
                          Title Search Verified (disabled - no document uploaded)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeModalTab === 'rates' ? (
            <>
              {/* Rates Notice Tab */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rates Notice Document</h3>
                  {selectedSeller.ratesnotice && selectedSeller.ratesnotice.trim() !== '' ? (
                    <div className="space-y-4">
                      <img
                        src={getAzureBlobUrl(selectedSeller.ratesnotice)}
                        alt="Rates Notice"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-300"
                      />
                      <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                        <div className="flex items-center space-x-3">
                          {loadingRates && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                          <input
                            type="checkbox"
                            id="ratesVerified"
                            checked={!!selectedSeller.ratesnoticeverified}
                            disabled={loadingRates}
                            onChange={async (e) => {
                              const newVerified = e.target.checked
                              const newDate = newVerified ? new Date().toISOString() : null
                              setLoadingRates(true)

                              const updatedData = {
                                ...selectedSeller,
                                dateofbirth: selectedSeller.dateofbirth ? new Date(selectedSeller.dateofbirth).toISOString() : null,
                                dte: new Date(selectedSeller.dte).toISOString(),
                                idverified: selectedSeller.idverified ? new Date(selectedSeller.idverified).toISOString() : null,
                                ratesnoticeverified: newDate,
                                titlesearchverified: selectedSeller.titlesearchverified ? new Date(selectedSeller.titlesearchverified).toISOString() : null
                              }

                              try {
                                const response = await fetch(buildApiUrl('/api/user'), {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedData)
                                })

                                if (response.ok) {
                                  const updatedSeller = { ...selectedSeller, ratesnoticeverified: newDate }
                                  setSelectedSeller(updatedSeller)
                                  updateUserData(updatedSeller)
                                  invalidateUserDataCache() // Invalidate cache for all components
                                  toast.success(newVerified ? 'Rates notice verified successfully!' : 'Rates notice verification removed!')
                                } else {
                                  const errorText = await response.text()
                                  console.error('Update failed:', errorText)
                                  toast.error('Failed to update verification status. Check console for details.')
                                  e.target.checked = !newVerified
                                }
                              } catch (error) {
                                console.error('Failed to update verification:', error)
                                toast.error('Failed to update verification status: ' + error)
                                e.target.checked = !newVerified
                              } finally {
                                setLoadingRates(false)
                              }
                            }}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label htmlFor="ratesVerified" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Rates Notice Verified
                          </label>
                        </div>
                        {selectedSeller.ratesnoticeverified && (
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified on {new Date(selectedSeller.ratesnoticeverified).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 font-medium mb-2">No rates notice document submitted</p>
                      <p className="text-sm text-gray-500">The user has not uploaded their rates notice yet</p>
                      <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-gray-300">
                        <input
                          type="checkbox"
                          id="ratesVerifiedDisabled"
                          checked={false}
                          disabled
                          className="w-5 h-5 text-gray-400 border-gray-300 rounded cursor-not-allowed opacity-50"
                        />
                        <label htmlFor="ratesVerifiedDisabled" className="text-sm font-medium text-gray-400 cursor-not-allowed">
                          Rates Notice Verified (disabled - no document uploaded)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeModalTab === 'info' ? (
            <>
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-600">First Name</label>
                    <p className="text-gray-900">{selectedSeller.firstname}</p>
                  </div>
                  {selectedSeller.middlename && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Middle Name</label>
                      <p className="text-gray-900">{selectedSeller.middlename}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Name</label>
                    <p className="text-gray-900">{selectedSeller.lastname}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900">{selectedSeller.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Mobile
                    </label>
                    <p className="text-gray-900">{selectedSeller.mobile}</p>
                  </div>
                  {selectedSeller.dateofbirth && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Date of Birth
                      </label>
                      <p className="text-gray-900">{new Date(selectedSeller.dateofbirth).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </label>
                    <p className="text-gray-900">{selectedSeller.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Residency Status</label>
                    <p className="text-gray-900">{selectedSeller.residencystatus}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Marital Status</label>
                    <p className="text-gray-900">{selectedSeller.maritalstatus}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Account Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Account ID</span>
                    <span className="text-gray-900">{selectedSeller.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Registration Date</span>
                    <span className="text-gray-900">{new Date(selectedSeller.dte).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Terms & Conditions</span>
                    <span className={selectedSeller.termsconditions ? 'text-green-600' : 'text-red-600'}>
                      {selectedSeller.termsconditions ? 'Accepted' : 'Not Accepted'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Privacy Policy</span>
                    <span className={selectedSeller.privacypolicy ? 'text-green-600' : 'text-red-600'}>
                      {selectedSeller.privacypolicy ? 'Accepted' : 'Not Accepted'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Admin Access</span>
                    <span className={selectedSeller.admin ? 'text-blue-600' : 'text-gray-600'}>
                      {selectedSeller.admin ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ID Verification Tab */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ID Document</h3>
                  {selectedSeller.idbloburl && selectedSeller.idbloburl.trim() !== '' ? (
                    <div className="space-y-4">
                      <img
                        src={getAzureBlobUrl(selectedSeller.idbloburl)}
                        alt="ID Document"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-300"
                      />
                      <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                        <div className="flex items-center space-x-3">
                          {loadingId && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                          <input
                            type="checkbox"
                            id="idVerified"
                            checked={!!selectedSeller.idverified}
                            disabled={loadingId}
                            onChange={async (e) => {
                              const newVerified = e.target.checked
                              const newDate = newVerified ? new Date().toISOString() : null
                              setLoadingId(true)

                              const updatedData = {
                                ...selectedSeller,
                                dateofbirth: selectedSeller.dateofbirth ? new Date(selectedSeller.dateofbirth).toISOString() : null,
                                dte: new Date(selectedSeller.dte).toISOString(),
                                idverified: newDate,
                                ratesnoticeverified: selectedSeller.ratesnoticeverified ? new Date(selectedSeller.ratesnoticeverified).toISOString() : null,
                                titlesearchverified: selectedSeller.titlesearchverified ? new Date(selectedSeller.titlesearchverified).toISOString() : null
                              }

                              try {
                                const response = await fetch(buildApiUrl('/api/user'), {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedData)
                                })

                                if (response.ok) {
                                  const updatedSeller = { ...selectedSeller, idverified: newDate }
                                  setSelectedSeller(updatedSeller)
                                  updateUserData(updatedSeller)
                                  invalidateUserDataCache() // Invalidate cache for all components
                                  toast.success(newVerified ? 'ID verified successfully!' : 'ID verification removed!')
                                } else {
                                  const errorText = await response.text()
                                  console.error('Update failed:', errorText)
                                  toast.error('Failed to update verification status. Check console for details.')
                                  e.target.checked = !newVerified
                                }
                              } catch (error) {
                                console.error('Failed to update verification:', error)
                                toast.error('Failed to update verification status: ' + error)
                                e.target.checked = !newVerified
                              } finally {
                                setLoadingId(false)
                              }
                            }}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label htmlFor="idVerified" className="text-sm font-medium text-gray-700 cursor-pointer">
                            ID Verified
                          </label>
                        </div>
                        {selectedSeller.idverified && (
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified on {new Date(selectedSeller.idverified).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 font-medium mb-2">No ID document submitted</p>
                      <p className="text-sm text-gray-500">The user has not uploaded their ID document yet</p>
                      <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-gray-300">
                        <input
                          type="checkbox"
                          id="idVerifiedDisabled"
                          checked={false}
                          disabled
                          className="w-5 h-5 text-gray-400 border-gray-300 rounded cursor-not-allowed opacity-50"
                        />
                        <label htmlFor="idVerifiedDisabled" className="text-sm font-medium text-gray-400 cursor-not-allowed">
                          ID Verified (disabled - no document uploaded)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setSelectedSeller(null)
                setActiveModalTab('info')
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
