'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  History
} from 'lucide-react'
import { Offer, OfferConditions, OfferStatus, OfferConditionRecord, OfferHistoryRecord, CreateOfferHistoryRequest } from '@/types/offer'
import { Property } from '@/types/property'
import { buildApiUrl } from '@/lib/config'

interface OffersListProps {
  propertyId?: number
  buyerId?: number
  sellerId?: number
  property?: Property
  mode: 'seller' | 'buyer'
  onCounterOffer?: (offer: Offer) => void
}

export default function OffersList({
  propertyId,
  buyerId,
  property,
  mode,
  onCounterOffer
}: OffersListProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOfferId, setExpandedOfferId] = useState<number | null>(null)
  const [processingOfferId, setProcessingOfferId] = useState<number | null>(null)
  const [offerConditions, setOfferConditions] = useState<Record<number, OfferConditionRecord[]>>({})
  const [processingConditionId, setProcessingConditionId] = useState<number | null>(null)
  const [offerHistory, setOfferHistory] = useState<Record<number, OfferHistoryRecord[]>>({})
  const [showHistoryForOffer, setShowHistoryForOffer] = useState<number | null>(null)

  useEffect(() => {
    fetchOffers()
  }, [propertyId, buyerId])

  // Fetch conditions when an offer is expanded
  useEffect(() => {
    if (expandedOfferId && !offerConditions[expandedOfferId]) {
      fetchConditions(expandedOfferId)
    }
  }, [expandedOfferId])

  const fetchOffers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let url = buildApiUrl('/api/offer')
      if (propertyId) {
        url = buildApiUrl(`/api/offer/property/${propertyId}`)
      } else if (buyerId) {
        url = buildApiUrl(`/api/offer/buyer/${buyerId}`)
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }

      const data = await response.json()
      // Sort by created_at descending (newest first)
      const sortedOffers = Array.isArray(data)
        ? data.sort((a: Offer, b: Offer) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        : []
      setOffers(sortedOffers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers')
    } finally {
      setIsLoading(false)
    }
  }

  const updateOfferStatus = async (offerId: number, newStatus: OfferStatus) => {
    setProcessingOfferId(offerId)

    try {
      const offer = offers.find(o => o.id === offerId)
      if (!offer) return

      const updatedOffer = {
        ...offer,
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      const response = await fetch(buildApiUrl('/api/offer'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOffer)
      })

      if (!response.ok) {
        throw new Error('Failed to update offer')
      }

      // Post history entry for status change
      const actionMessages: Record<string, string> = {
        'accepted': 'Offer has been accepted',
        'rejected': 'Offer has been rejected',
        'countered': 'A counter offer has been made',
        'withdrawn': 'Offer has been withdrawn',
        'expired': 'Offer has expired'
      }

      // Use buyer_id for buyer actions, otherwise use 0 (will be the seller)
      const actorId = newStatus === 'withdrawn' ? offer.buyer_id : (buyerId || 0)

      await postHistoryEntry(
        offerId,
        actorId,
        newStatus,
        offer.offer_amount,
        actionMessages[newStatus] || `Status changed to ${newStatus}`
      )

      // Send push notification to buyer when seller responds (not for buyer's own withdrawal)
      if (mode === 'seller' && newStatus !== 'withdrawn') {
        try {
          const notificationTitles: Record<string, string> = {
            'accepted': 'Offer Accepted!',
            'rejected': 'Offer Rejected',
            'countered': 'Counter Offer Received'
          }
          const notificationBodies: Record<string, string> = {
            'accepted': `Your offer of $${offer.offer_amount.toLocaleString()} has been accepted${property ? ` for ${property.address}` : ''}!`,
            'rejected': `Your offer of $${offer.offer_amount.toLocaleString()} has been rejected${property ? ` for ${property.address}` : ''}.`,
            'countered': `The seller has made a counter offer${property ? ` for ${property.address}` : ''}.`
          }

          await fetch('/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: offer.buyer_id,
              payload: {
                title: notificationTitles[newStatus] || 'Offer Update',
                body: notificationBodies[newStatus] || `Your offer status has been updated to ${newStatus}`,
                url: '/buyer/offers',
                propertyId: offer.property_id
              }
            })
          })
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError)
          // Don't fail the status update if push fails
        }
      }

      // Refresh offers
      await fetchOffers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update offer')
    } finally {
      setProcessingOfferId(null)
    }
  }

  const fetchConditions = async (offerId: number) => {
    try {
      const response = await fetch(buildApiUrl(`/api/offercondition/${offerId}`))
      if (response.ok) {
        const data = await response.json()
        setOfferConditions(prev => ({
          ...prev,
          [offerId]: Array.isArray(data) ? data : []
        }))
      }
    } catch (err) {
      console.error('Failed to fetch conditions:', err)
    }
  }

  const toggleConditionSatisfied = async (condition: OfferConditionRecord, offer: Offer) => {
    setProcessingConditionId(condition.id)
    try {
      const updatedCondition = {
        ...condition,
        is_satisfied: !condition.is_satisfied,
        satisfied_at: !condition.is_satisfied ? new Date().toISOString() : null
      }

      const response = await fetch(buildApiUrl('/api/offercondition'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCondition)
      })

      if (!response.ok) {
        throw new Error('Failed to update condition')
      }

      // Post history entry for condition satisfaction
      if (!condition.is_satisfied) {
        await postHistoryEntry(
          condition.offer_id,
          buyerId || 0,
          'condition_satisfied',
          offer.offer_amount,
          `${getConditionTypeLabel(condition.condition_type)} condition has been satisfied`
        )
      }

      // Refresh conditions for this offer
      await fetchConditions(condition.offer_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update condition')
    } finally {
      setProcessingConditionId(null)
    }
  }

  const getConditionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'finance': 'Finance Approval',
      'building_pest': 'Building & Pest',
      'sale_of_property': 'Sale of Property',
      'valuation': 'Valuation',
      'solicitor_review': 'Solicitor Review',
      'other': 'Other'
    }
    return labels[type] || type
  }

  const fetchHistory = async (offerId: number) => {
    try {
      const response = await fetch(buildApiUrl(`/api/offerhistory/${offerId}`))
      if (response.ok) {
        const data = await response.json()
        setOfferHistory(prev => ({
          ...prev,
          [offerId]: Array.isArray(data) ? data.sort((a: OfferHistoryRecord, b: OfferHistoryRecord) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ) : []
        }))
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  const postHistoryEntry = async (
    offerId: number,
    actorId: number,
    action: string,
    offerAmount: number,
    message: string
  ) => {
    const historyEntry: CreateOfferHistoryRequest = {
      offer_id: offerId,
      actor_id: actorId,
      action: action,
      offer_amount: offerAmount,
      message: message
    }

    await fetch(buildApiUrl('/api/offerhistory'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyEntry)
    })
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'created': 'Offer Created',
      'accepted': 'Offer Accepted',
      'rejected': 'Offer Rejected',
      'countered': 'Counter Offer Made',
      'withdrawn': 'Offer Withdrawn',
      'expired': 'Offer Expired',
      'condition_satisfied': 'Condition Satisfied'
    }
    return labels[action] || action
  }

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      'created': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'countered': 'bg-purple-100 text-purple-800',
      'withdrawn': 'bg-gray-100 text-gray-800',
      'expired': 'bg-gray-100 text-gray-600',
      'condition_satisfied': 'bg-green-100 text-green-700'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: OfferStatus) => {
    const styles: Record<OfferStatus, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: <Clock className="w-3.5 h-3.5" />
      },
      accepted: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-3.5 h-3.5" />
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="w-3.5 h-3.5" />
      },
      countered: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <RefreshCw className="w-3.5 h-3.5" />
      },
      withdrawn: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <XCircle className="w-3.5 h-3.5" />
      },
      expired: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        icon: <Clock className="w-3.5 h-3.5" />
      }
    }

    const style = styles[status] || styles.pending

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const parseConditions = (conditionsJson: string | null): OfferConditions | null => {
    if (!conditionsJson) return null
    try {
      return JSON.parse(conditionsJson)
    } catch {
      return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#FF6600] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchOffers}
          className="ml-auto text-red-600 hover:text-red-800 underline text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Offers Yet</h3>
        <p className="text-gray-500">
          {mode === 'seller'
            ? 'No offers have been received for this property.'
            : 'You haven\'t made any offers yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {mode === 'seller' ? 'Offers Received' : 'Your Offers'} ({offers.length})
        </h3>
        <button
          onClick={fetchOffers}
          className="text-sm text-[#FF6600] hover:text-[#FF5500] flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Offers List */}
      <div className="space-y-3">
        {offers.map((offer) => {
          const conditions = parseConditions(offer.conditions_json)
          const isExpand = expandedOfferId === offer.id
          const expired = offer.status === 'pending' && isExpired(offer.expires_at)

          return (
            <div
              key={offer.id}
              className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-md ${
                offer.status === 'pending' && !expired
                  ? 'border-amber-300 bg-amber-50'
                  : offer.status === 'accepted'
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Offer Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedOfferId(isExpand ? null : offer.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${offer.offer_amount.toLocaleString()}
                      </span>
                      {getStatusBadge(expired ? 'expired' : offer.status as OfferStatus)}
                      {offer.parent_offer_id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Counter #{offer.version}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(offer.created_at)}
                      </span>
                      {offer.settlement_days && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {offer.settlement_days} day settlement
                        </span>
                      )}
                      {offer.deposit_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${offer.deposit_amount.toLocaleString()} deposit
                        </span>
                      )}
                    </div>

                    {/* Conditions Preview */}
                    {conditions && Object.keys(conditions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {conditions.finance && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Finance ({conditions.financeDays}d)
                          </span>
                        )}
                        {conditions.buildingPest && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            B&P ({conditions.buildingPestDays}d)
                          </span>
                        )}
                        {conditions.saleOfProperty && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Sale of Property
                          </span>
                        )}
                        {conditions.valuation && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Valuation
                          </span>
                        )}
                        {conditions.solicitorReview && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Solicitor Review
                          </span>
                        )}
                        {conditions.other && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            +Other
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button className="p-1 hover:bg-gray-100 rounded">
                    {isExpand ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpand && (
                <div className="border-t bg-white px-4 py-4 space-y-4">
                  {/* Conditions from API */}
                  {offerConditions[offer.id] && offerConditions[offer.id].length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions</h4>
                      <ul className="space-y-2">
                        {offerConditions[offer.id].map((condition) => (
                          <li
                            key={condition.id}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              condition.is_satisfied
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {condition.is_satisfied ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {getConditionTypeLabel(condition.condition_type)}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({condition.days_to_satisfy} days)
                                </span>
                                {condition.description && condition.condition_type === 'other' && (
                                  <p className="text-xs text-gray-600 mt-0.5">{condition.description}</p>
                                )}
                              </div>
                            </div>
                            {mode === 'seller' && offer.status === 'accepted' && (
                              <button
                                onClick={() => toggleConditionSatisfied(condition, offer)}
                                disabled={processingConditionId === condition.id}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                  condition.is_satisfied
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                } disabled:opacity-50`}
                              >
                                {processingConditionId === condition.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : condition.is_satisfied ? (
                                  'Satisfied'
                                ) : (
                                  'Mark Satisfied'
                                )}
                              </button>
                            )}
                            {mode === 'buyer' && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                condition.is_satisfied
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {condition.is_satisfied ? 'Satisfied' : 'Pending'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fallback: Show conditions from JSON if no API conditions */}
                  {(!offerConditions[offer.id] || offerConditions[offer.id].length === 0) && conditions && Object.keys(conditions).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {conditions.finance && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Subject to finance approval ({conditions.financeDays} days)
                          </li>
                        )}
                        {conditions.buildingPest && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Subject to building & pest inspection ({conditions.buildingPestDays} days)
                          </li>
                        )}
                        {conditions.saleOfProperty && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Subject to sale of buyer&apos;s property ({conditions.saleOfPropertyDays} days)
                          </li>
                        )}
                        {conditions.valuation && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Subject to valuation ({conditions.valuationDays} days)
                          </li>
                        )}
                        {conditions.solicitorReview && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Subject to solicitor review ({conditions.solicitorReviewDays} days)
                          </li>
                        )}
                        {conditions.other && (
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>{conditions.other}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Expiry */}
                  {offer.expires_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className={`w-4 h-4 ${expired ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className={expired ? 'text-red-600' : 'text-gray-600'}>
                        {expired ? 'Expired' : 'Expires'}: {formatDate(offer.expires_at)}
                      </span>
                    </div>
                  )}

                  {/* Version History Link */}
                  {offer.parent_offer_id && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <History className="w-4 h-4" />
                      <span>This is a counter-offer (version {offer.version})</span>
                    </div>
                  )}

                  {/* Offer History Section */}
                  <div className="border-t pt-3">
                    <button
                      onClick={() => {
                        if (showHistoryForOffer === offer.id) {
                          setShowHistoryForOffer(null)
                        } else {
                          setShowHistoryForOffer(offer.id)
                          if (!offerHistory[offer.id]) {
                            fetchHistory(offer.id)
                          }
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <History className="w-4 h-4" />
                      <span>{showHistoryForOffer === offer.id ? 'Hide' : 'View'} Activity History</span>
                      {showHistoryForOffer === offer.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showHistoryForOffer === offer.id && (
                      <div className="mt-3 space-y-2">
                        {!offerHistory[offer.id] ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading history...
                          </div>
                        ) : offerHistory[offer.id].length === 0 ? (
                          <p className="text-sm text-gray-500">No history available</p>
                        ) : (
                          <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />

                            {offerHistory[offer.id].map((historyItem, index) => (
                              <div key={historyItem.id} className="relative pl-6 pb-3">
                                {/* Timeline dot */}
                                <div className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white ${
                                  index === 0 ? 'bg-[#FF6600]' : 'bg-gray-300'
                                }`} />

                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getActionColor(historyItem.action)}`}>
                                      {getActionLabel(historyItem.action)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(historyItem.created_at)}
                                    </span>
                                  </div>
                                  {historyItem.message && (
                                    <p className="text-sm text-gray-700">{historyItem.message}</p>
                                  )}
                                  {historyItem.offer_amount > 0 && (
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                      Amount: ${historyItem.offer_amount.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons (Seller Mode) */}
                  {mode === 'seller' && offer.status === 'pending' && !expired && (
                    <div className="flex gap-3 pt-3 border-t">
                      <button
                        onClick={() => updateOfferStatus(offer.id, 'accepted')}
                        disabled={processingOfferId === offer.id}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingOfferId === offer.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => onCounterOffer?.(offer)}
                        disabled={processingOfferId === offer.id}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Counter
                      </button>
                      <button
                        onClick={() => updateOfferStatus(offer.id, 'rejected')}
                        disabled={processingOfferId === offer.id}
                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingOfferId === offer.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Action Buttons (Buyer Mode) */}
                  {mode === 'buyer' && offer.status === 'pending' && !expired && (
                    <div className="flex gap-3 pt-3 border-t">
                      <button
                        onClick={() => updateOfferStatus(offer.id, 'withdrawn')}
                        disabled={processingOfferId === offer.id}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingOfferId === offer.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Withdraw Offer
                      </button>
                    </div>
                  )}

                  {/* Respond to Counter (Buyer Mode) */}
                  {mode === 'buyer' && offer.status === 'countered' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        The seller has made a counter-offer. View the latest offer to respond.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
