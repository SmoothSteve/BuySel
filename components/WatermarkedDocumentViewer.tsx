'use client'

import React, { useState } from 'react'
import { X, Download, Shield, AlertTriangle, Eye, Lock } from 'lucide-react'
import { getPhotoUrl } from '@/lib/r2-config'

interface WatermarkedDocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  documentTitle: string
  propertyAddress: string
  // User role determines if they can see original
  canViewOriginal: boolean
  // Optional: user info for watermark
  viewerEmail?: string
}

export default function WatermarkedDocumentViewer({
  isOpen,
  onClose,
  documentUrl,
  documentTitle,
  propertyAddress,
  canViewOriginal,
  viewerEmail
}: WatermarkedDocumentViewerProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  if (!isOpen) return null

  const fullUrl = getPhotoUrl(documentUrl)
  const watermarkText = `PREVIEW ONLY - ${propertyAddress} - ${new Date().toLocaleDateString()}`
  const viewerWatermark = viewerEmail ? ` - Viewed by: ${viewerEmail}` : ''

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">{documentTitle}</h3>
            {!canViewOriginal && (
              <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                <Eye className="w-3 h-3" />
                Preview Only
              </span>
            )}
            {canViewOriginal && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                Full Access
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canViewOriginal && (
              <>
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showOriginal
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {showOriginal ? (
                    <>
                      <Shield className="w-4 h-4" />
                      Original
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Watermarked
                    </>
                  )}
                </button>
                <a
                  href={fullUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#FF6600] text-white rounded-lg text-sm hover:bg-[#FF5500] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="bg-gray-200 rounded-full p-2 hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Watermark Notice for Buyers */}
        {!canViewOriginal && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              This is a watermarked preview. Contact the seller or request access to view the full document.
            </p>
          </div>
        )}

        {/* PDF Viewer with Watermark Overlay */}
        <div className="flex-1 overflow-hidden relative">
          <iframe
            src={fullUrl || ''}
            className="w-full h-full"
            title={documentTitle}
          />

          {/* Watermark Overlay - only shown for non-privileged users or when not viewing original */}
          {(!canViewOriginal || !showOriginal) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Diagonal watermark pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="text-gray-400 opacity-20 font-bold text-2xl whitespace-nowrap select-none"
                  style={{
                    transform: 'rotate(-35deg)',
                    width: '200%',
                    textAlign: 'center',
                    lineHeight: '120px',
                  }}
                >
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i}>
                      BUYSEL PREVIEW - NOT FOR DISTRIBUTION - {watermarkText}{viewerWatermark}
                    </div>
                  ))}
                </div>
              </div>

              {/* Corner watermark badges */}
              <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-sm">Preview Document</p>
                    <p className="text-xs text-gray-500">{propertyAddress}</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="w-5 h-5 text-[#FF6600]" />
                  <div>
                    <p className="font-semibold text-sm">BuySel Verified</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {canViewOriginal
              ? 'You have full access to this document as a verified party.'
              : 'This document is protected. Request access from the seller to view the original.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
