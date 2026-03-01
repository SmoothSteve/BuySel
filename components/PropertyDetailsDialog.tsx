'use client'

import React, { useState, useEffect } from 'react'
import { X, MapPin, Bed, Bath, Car, Home, Maximize, Calendar, Building, ChevronLeft, ChevronRight, MessageCircle, Bug, FileText, Loader2, DollarSign } from 'lucide-react'
import { Property } from '@/types/property'
import { getPhotoUrl } from '@/lib/r2-config'
import ChatModal from './ChatModal'
import WatermarkedDocumentViewer from './WatermarkedDocumentViewer'
import MakeOfferDialog from './MakeOfferDialog'
import { useAuth } from '@/hooks/useAuth'
import { useTimezoneCorrection } from '@/hooks/useTimezoneCorrection'
import { useUserData } from '@/hooks/useUserData'
interface Photo {
  id: number
  propertyid: number
  photobloburl: string
  title: string
  dte: string
  doc: boolean | null
}

interface PropertyDetailsDialogProps {
  property?: Property | null
  onClose: () => void
}

export default function PropertyDetailsDialog({ property, onClose }: PropertyDetailsDialogProps) {
  if (!property) return null
  const { userId, userRole } = useUserData()

  const { isAuthenticated, user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [showPestPdfDialog, setShowPestPdfDialog] = useState(false)
  const [showTitleSearchPdfDialog, setShowTitleSearchPdfDialog] = useState(false)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [requestingDoc, setRequestingDoc] = useState<string | null>(null)
  const correctDateForTimezone = useTimezoneCorrection()

  // Determine if user can view original documents (seller, admin, or conveyancer)
  const canViewOriginalDocs =
    userId === property.sellerid ||
    userRole === 'admin' ||
    userRole === 'conveyancer'
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`https://buysel.azurewebsites.net/api/propertyphoto/${property.id}`)
        if (response.ok) {
          const data = await response.json()
          setPhotos(data.filter((p: Photo) => !p.doc))
        }
      } catch (error) {
        console.error('Error fetching photos:', error)
      } finally {
        setLoadingPhotos(false)
      }
    }

    if (property.id > 0) {
      fetchPhotos()
    }
  }, [property.id])

  const handleRequestProperty = async (req:string) => {
    setRequestingDoc(req)
    try {
      const ep=`https://buysel.azurewebsites.net/api/user/email/${user?.email}`
      //alert(ep)


      // Fetch user data from email endpoint
      const userResponse = await fetch(ep)

      if (!userResponse.ok) {
        setToast('Failed to fetch user data')
        return
      }

      const userData: { email: string; id: number } = await userResponse.json()

      const payload = {
        id: 0,
        propertyid: property.id,
        dte: correctDateForTimezone(new Date()),
        buyerid: userData.id,
        requestdoc: req,
        action: null
      }

      const jsn = JSON.stringify(payload)
      console.log('Requesting '+req+' Inspection with payload:', payload)
      const response = await fetch('https://buysel.azurewebsites.net/api/propertybuyerdoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsn
      })

      console.log(req+' Inspection response status:', response.status)

      if (response.ok) {
        setToast(req+` Search requested for this property`)
      } else {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        setToast(`Failed to request ${req} Inspection: ${response.status}`)
      }
    } catch (error) {
      console.error('Error requesting '+req+' Inspection:', error)
      setToast(`Error requesting ${req} Inspection: ${error}`)
    } finally {
      setRequestingDoc(null)
    }
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Close Button - Sticky */}
        <div className="sticky top-0 right-0 z-20 flex justify-end p-4">
          <button
            onClick={onClose}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Photos Section - Full Width at Top */}
        <div className="relative -mt-16">
          {loadingPhotos ? (
            <div className="h-96 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <p className="text-gray-600">Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg flex flex-col items-center justify-center">
              <MapPin className="w-20 h-20 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No photos available</p>
            </div>
          ) : (
            <div>
              {/* Main Photo */}
              <div className="relative">
                <img
                  src={getPhotoUrl(photos[currentPhotoIndex].photobloburl) || ''}
                  alt={photos[currentPhotoIndex].title}
                  className="w-full object-contain rounded-t-lg max-h-[60vh]"
                />
                
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 p-3 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 p-3 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium">
                    {currentPhotoIndex + 1} / {photos.length}
                  </p>
                </div>
              </div>

              {/* Photo Thumbnails */}
              {photos.length > 1 && (
                <div className="bg-gray-900 px-4 py-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                          index === currentPhotoIndex
                            ? 'border-[#FF6600] ring-2 ring-[#FF6600]'
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={getPhotoUrl(photo.photobloburl) || ''}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property Details Section - Below Photos */}
        <div className="p-6">
          {/* Title and Price */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h2>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <p className="text-lg text-gray-600">{property.address}</p>
            </div>
            <p className="text-4xl font-bold text-[#FF6600]">
              ${property.price.toLocaleString()}
            </p>
          </div>

          {/* Key Features - Icon Grid */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Property Features</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.beds !== null && (
                <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Bed className="w-6 h-6 text-[#FF6600]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{property.beds}</p>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                  </div>
                </div>
              )}

              {property.baths !== null && (
                <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Bath className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{property.baths}</p>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                  </div>
                </div>
              )}

              {property.carspaces !== null && (
                <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm">
                  <div className="bg-green-100 rounded-full p-3">
                    <Car className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{property.carspaces}</p>
                    <p className="text-sm text-gray-600">Car Spaces</p>
                  </div>
                </div>
              )}

              {property.landsize !== null && (
                <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Maximize className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{property.landsize}</p>
                    <p className="text-sm text-gray-600">sqm</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {property.typeofprop && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Home className="w-5 h-5 text-[#FF6600]" />
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-semibold text-gray-900">{property.typeofprop}</p>
                </div>
              </div>
            )}

            {property.buildyear !== null && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-5 h-5 text-[#FF6600]" />
                <div>
                  <p className="text-sm text-gray-600">Year Built</p>
                  <p className="font-semibold text-gray-900">{property.buildyear}</p>
                </div>
              </div>
            )}

            {property.suburb && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Building className="w-5 h-5 text-[#FF6600]" />
                <div>
                  <p className="text-sm text-gray-600">Suburb</p>
                  <p className="font-semibold text-gray-900">{property.suburb}</p>
                </div>
              </div>
            )}

            {property.postcode && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <MapPin className="w-5 h-5 text-[#FF6600]" />
                <div>
                  <p className="text-sm text-gray-600">Postcode</p>
                  <p className="font-semibold text-gray-900">{property.postcode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Building Inspection Badge */}
            {property.buildinginspazureblob && property.buildinginspverified && (
              <div>
                {property.buildinginsppublic ? (
                  <button
                    onClick={() => setShowPdfDialog(true)}
                    className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-lg border-2 border-green-500 hover:bg-green-100 hover:shadow-lg transition-all w-full h-full"
                  >
                    <div className="bg-green-500 rounded-full p-4">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-700 font-medium mb-1">Verified Document</p>
                      <p className="font-bold text-green-900 mb-2">Building Inspection</p>
                      <p className="text-xs text-green-600">Click to view PDF</p>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestProperty('Building')}
                    disabled={requestingDoc !== null}
                    className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-lg border-2 border-green-500 hover:bg-green-100 hover:shadow-lg transition-all w-full h-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="bg-green-500 rounded-full p-4">
                      {requestingDoc === 'Building' ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Building className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-700 font-medium mb-1">Verified Document</p>
                      <p className="font-bold text-green-900 mb-2">Building Inspection</p>
                      <p className="text-xs text-green-600">
                        {requestingDoc === 'Building' ? 'Requesting...' : 'Click to request'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Pest Inspection Badge */}
            {property.pestinspazureblob && property.pestinspverified && (
              <div>
                {property.pestinsppublic ? (
                  <button
                    onClick={() => setShowPestPdfDialog(true)}
                    className="flex flex-col items-center gap-3 p-6 bg-amber-50 rounded-lg border-2 border-amber-500 hover:bg-amber-100 hover:shadow-lg transition-all w-full h-full"
                  >
                    <div className="bg-amber-500 rounded-full p-4">
                      <Bug className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-amber-700 font-medium mb-1">Verified Document</p>
                      <p className="font-bold text-amber-900 mb-2">Pest Inspection</p>
                      <p className="text-xs text-amber-600">Click to view PDF</p>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestProperty('Pest')}
                    disabled={requestingDoc !== null}
                    className="flex flex-col items-center gap-3 p-6 bg-amber-50 rounded-lg border-2 border-amber-500 hover:bg-amber-100 hover:shadow-lg transition-all w-full h-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="bg-amber-500 rounded-full p-4">
                      {requestingDoc === 'Pest' ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Bug className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-amber-700 font-medium mb-1">Verified Document</p>
                      <p className="font-bold text-amber-900 mb-2">Pest Inspection</p>
                      <p className="text-xs text-amber-600">
                        {requestingDoc === 'Pest' ? 'Requesting...' : 'Click to request'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Title Search Council Rates Badge */}
            {property.titlesrchcouncilrateazureblob && property.titlesrchcouncilrateverified && (
              <div>
                {property.titlesrchcouncilratepublic ? (
                  <button
                    onClick={() => setShowTitleSearchPdfDialog(true)}
                    className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-lg border-2 border-blue-500 hover:bg-blue-100 hover:shadow-lg transition-all w-full h-full"
                  >
                    <div className="bg-blue-500 rounded-full p-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-700 font-medium mb-1">Verified Document</p>
                      <p className="font-bold text-blue-900 mb-2">Title Search / Council Rates</p>
                      <p className="text-xs text-blue-600">Click to view PDF</p>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestProperty('Title or Council')}
                    disabled={requestingDoc !== null}
                    className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-lg border-2 border-blue-500 hover:bg-blue-100 hover:shadow-lg transition-all w-full h-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="bg-blue-500 rounded-full p-4">
                      {requestingDoc === 'Title or Council' ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <FileText className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-700 font-medium mb-1">Verified Document</p>
                      <p className="font-bold text-blue-900 mb-2">Title Search / Council Rates</p>
                      {userId !== property.sellerid &&

                      <p className="text-xs text-blue-600">
                        {requestingDoc === 'Title or Council' ? 'Requesting...' : 'Click to request access'}
                      </p>
}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            {isAuthenticated && userId !== property.sellerid && (
              <>
                <button
                  onClick={() => setShowChatModal(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
                <button
                  onClick={() => setShowOfferDialog(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-[#FF6600] text-white rounded-lg hover:bg-[#FF5500] transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  Make Offer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false)
          }}
          property={property}
          currentUserId={0}
        />
      )}

      {/* PDF Viewer Dialog - Building Inspection */}
      {showPdfDialog && property.buildinginspazureblob && (
        <WatermarkedDocumentViewer
          isOpen={showPdfDialog}
          onClose={() => setShowPdfDialog(false)}
          documentUrl={property.buildinginspazureblob}
          documentTitle="Building Inspection Report"
          propertyAddress={property.address}
          canViewOriginal={canViewOriginalDocs}
          viewerEmail={user?.email}
        />
      )}

      {/* PDF Viewer Dialog - Pest Inspection */}
      {showPestPdfDialog && property.pestinspazureblob && (
        <WatermarkedDocumentViewer
          isOpen={showPestPdfDialog}
          onClose={() => setShowPestPdfDialog(false)}
          documentUrl={property.pestinspazureblob}
          documentTitle="Pest Inspection Report"
          propertyAddress={property.address}
          canViewOriginal={canViewOriginalDocs}
          viewerEmail={user?.email}
        />
      )}

      {/* PDF Viewer Dialog - Title Search Council Rates */}
      {showTitleSearchPdfDialog && property.titlesrchcouncilrateazureblob && (
        <WatermarkedDocumentViewer
          isOpen={showTitleSearchPdfDialog}
          onClose={() => setShowTitleSearchPdfDialog(false)}
          documentUrl={property.titlesrchcouncilrateazureblob}
          documentTitle="Title Search / Council Rates"
          propertyAddress={property.address}
          canViewOriginal={canViewOriginalDocs}
          viewerEmail={user?.email}
        />
      )}

      {/* Make Offer Dialog */}
      {showOfferDialog && userId && (
        <MakeOfferDialog
          isOpen={showOfferDialog}
          onClose={() => setShowOfferDialog(false)}
          property={property}
          buyerId={userId}
          onOfferSubmitted={() => {
            setToast('Offer submitted successfully!')
            setTimeout(() => setToast(null), 3000)
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] animate-fade-in">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
