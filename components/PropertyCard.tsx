"use client";

import { useState } from 'react'
import { MapPin, Heart, Bed, Bath, Car, Home, Shield, CheckCircle, MessageCircle, FileText, Loader2, AlertCircle, Flame, Waves, Bug, Search, DollarSign } from 'lucide-react'
import { Property } from '@/types/property'
import { getPhotoUrl } from '@/lib/r2-config'

// Trust Badge Component
interface TrustBadgeProps {
  verified: boolean
  label: string
  icon: React.ReactNode
}

function TrustBadge({ verified, label, icon }: TrustBadgeProps) {
  return (
    <div
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${verified
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-gray-50 text-gray-400 border border-gray-200'
        }`}
      title={verified ? `${label} - Verified` : `${label} - Not verified`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {verified ? (
        <CheckCircle className="h-3 w-3 text-green-600" />
      ) : (
        <AlertCircle className="h-3 w-3 text-gray-300" />
      )}
    </div>
  )
}

interface PropertyCardProps {
  property: Property
  onClick: (property: Property) => void
  onChatClick?: (property: Property) => void
  onOfferClick?: (property: Property) => void
  onViewOffersClick?: (property: Property) => void  // For sellers to view received offers
  userId?: number | null
  fav?: boolean
  onFavToggle?: (propertyId: number, fav: boolean) => Promise<void>
  hasOffer?: boolean
  hasReceivedOffer?: boolean  // For sellers - shows when they have pending offers
}

export default function PropertyCard({ property, onClick, onChatClick, onOfferClick, onViewOffersClick, userId, fav = false, onFavToggle, hasOffer = false, hasReceivedOffer = false }: PropertyCardProps) {
  const [isFavLoading, setIsFavLoading] = useState(false)

  // 🔒 Guard clause — prevents crash
  if (!property) return null

  const handleFavClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onFavToggle || isFavLoading) return

    setIsFavLoading(true)
    try {
      await onFavToggle(property.id, !fav)
    } finally {
      setIsFavLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {property ? (
        <>
          <div className="relative h-48">
            {property.photobloburl ? (
              <img
                src={getPhotoUrl(property.photobloburl) || '/placeholder.jpg'}
                alt={property.title || 'Property Image'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <MapPin className="w-16 h-16 text-gray-400" />
              </div>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              {/* Seller offer indicator */}
              {hasReceivedOffer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOffersClick?.(property);
                  }}
                  className="p-2 bg-red-500 rounded-full shadow-md animate-pulse hover:bg-red-600 transition-colors"
                  title="You have pending offers! Click to view"
                >
                  <DollarSign className="h-5 w-5 text-white" />
                </button>
              )}

              {onOfferClick && userId && userId !== property?.sellerid && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOfferClick(property);
                  }}
                  className={`p-2 rounded-full shadow-md hover:shadow-lg transition-all ${hasOffer ? 'bg-green-500 hover:bg-green-600' : 'bg-white hover:bg-gray-100'
                    }`}
                  title={hasOffer ? "View your offer" : "Make an offer"}
                >
                  <DollarSign className={`h-5 w-5 ${hasOffer ? 'text-white' : 'text-gray-400'}`} />
                </button>
              )}

              {onChatClick && userId !== property?.sellerid && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatClick(property);
                  }}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                  title="Chat with seller"
                >
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </button>
              )}

              {userId && (
                <button
                  type="button"
                  onClick={handleFavClick}
                  disabled={isFavLoading}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isFavLoading ? (
                    <Loader2 className="h-5 w-5 text-[#FF6600] animate-spin" />
                  ) : (
                    <Heart
                      className={`h-5 w-5 ${fav ? 'text-green-500 fill-green-500 animate-pulse' : 'text-gray-600'
                        }`}
                    />
                  )}
                </button>
              )}
            </div>

            <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-lg font-semibold">
              ${property.price?.toLocaleString() || 'N/A'}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">
              <button
                type="button"
                onClick={() => onClick(property)}
                className="hover:text-blue-600 underline decoration-1 underline-offset-2"
              >
                {property.title || 'Untitled Property'}
              </button>
            </h3>

            <p className="text-gray-600 text-sm mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {property.address || 'Address not available'}
            </p>

            <div className="flex items-center space-x-4 text-gray-700 text-sm mb-3">
              <span className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {property.beds || 0}
              </span>
              <span className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                {property.baths || 0}
              </span>
              <span className="flex items-center">
                <Car className="h-4 w-4 mr-1" />
                {property.carspaces || 0}
              </span>
              <span className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                {property.landsize || 0}m²
              </span>
            </div>

            {/* Trust Verification Badge Strip */}
            <div className="border-t pt-3 mt-2">
              <div className="flex items-center gap-1 mb-2">
                <Shield className="h-3.5 w-3.5 text-[#FF6600]" />
                <span className="text-xs font-medium text-gray-700">Trust & Verification</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <TrustBadge
                  verified={property.contractsale === true}
                  label="Contract"
                  icon={<FileText className="h-3 w-3" />}
                />
                <TrustBadge
                  verified={property.smokealarm === true}
                  label="Smoke Alarm"
                  icon={<Flame className="h-3 w-3" />}
                />
                <TrustBadge
                  verified={property.poolcert === true}
                  label="Pool Cert"
                  icon={<Waves className="h-3 w-3" />}
                />
                <TrustBadge
                  verified={property.buildinginspverified === true}
                  label="Building"
                  icon={<Home className="h-3 w-3" />}
                />
                <TrustBadge
                  verified={property.pestinspverified === true}
                  label="Pest"
                  icon={<Bug className="h-3 w-3" />}
                />
                <TrustBadge
                  verified={property.titlesrchcouncilrateverified === true}
                  label="Title"
                  icon={<Search className="h-3 w-3" />}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 text-center text-gray-500">
          Loading property details...
        </div>
      )}
    </div>
  );
}