'use client'

import Link from 'next/link'
import { useState } from 'react'
import { X } from 'lucide-react'

interface DialogContent {
  title: string
  description: string
  features: string[]
  cta: string
}

const dialogContent: Record<string, DialogContent> = {
  seller: {
    title: 'List Your Property',
    description: 'Sell your property directly without paying agent commissions. Our platform connects you with verified buyers and provides all the tools you need for a successful sale.',
    features: [
      'No listing fees during early access',
      'Connect with verified buyers',
      'Professional conveyancer network',
      'Secure messaging platform',
      'Complete control over your sale'
    ],
    cta: 'Sign in to start listing your property'
  },
  'seller-howto': {
    title: 'How to Sell on BuySel',
    description: 'Learn the simple 5-step process to list and sell your property on BuySel. From preparing documents to completing the sale, we guide you through every step.',
    features: [
      'Step-by-step listing guide',
      'Document preparation assistance',
      'Verification badge system',
      'Buyer communication tips',
      'Settlement process support'
    ],
    cta: 'Sign in to learn more about selling'
  },
  conveyancer: {
    title: 'Join Our Conveyancer Network',
    description: 'Licensed conveyancers can join our professional network to access a steady stream of contract preparation and conveyancing work across Queensland.',
    features: [
      'Consistent work opportunities',
      'Competitive rates ($550-$750 per contract)',
      'Flexible scheduling',
      'Secure payment processing',
      'Professional platform tools'
    ],
    cta: 'Sign in to join our network'
  },
  'conveyancer-dashboard': {
    title: 'Conveyancer Dashboard',
    description: 'Access your professional dashboard to manage document requests, track payments, and communicate with property sellers.',
    features: [
      'View available jobs',
      'Track work in progress',
      'Manage payments and invoices',
      'Update availability',
      'Access client documents'
    ],
    cta: 'Sign in to access your dashboard'
  },
  'conveyancer-jobs': {
    title: 'Available Conveyancing Jobs',
    description: 'Browse and accept contract preparation requests from property sellers in your service area.',
    features: [
      'View job details and requirements',
      'Filter by location and urgency',
      'Accept jobs that fit your schedule',
      'Track deadlines and deliverables',
      'Communicate with sellers'
    ],
    cta: 'Sign in to view available jobs'
  }
}

export default function Footer() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDialog, setSelectedDialog] = useState<string | null>(null)

  const openDialog = (type: string) => {
    setSelectedDialog(type)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedDialog(null)
  }

  const currentContent = selectedDialog ? dialogContent[selectedDialog] : null

  return (
    <>
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* About Section */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-lg">BuySel</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Queensland&apos;s property platform connecting sellers, buyers, and professional conveyancers.
                Verified property. No commission. Serving North Queensland.
              </p>
            </div>

            {/* For Sellers */}
            <div>
              <h4 className="font-semibold mb-4">For Sellers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => openDialog('seller')}
                    className="hover:text-white transition-colors text-left"
                  >
                    List Property
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openDialog('seller-howto')}
                    className="hover:text-white transition-colors text-left"
                  >
                    How to Sell
                  </button>
                </li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
    
              </ul>
            </div>

            {/* For Buyers */}
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Search Properties</Link></li>
                <li><Link href="/buyer/messages" className="hover:text-white transition-colors">Messages</Link></li>
              </ul>
            </div>

            {/* For Professionals */}
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => openDialog('conveyancer')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Join Network
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openDialog('conveyancer-dashboard')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openDialog('conveyancer-jobs')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Jobs
                  </button>
                </li>
                <li><a href="mailto:conveyancers@buysel.com.au" className="hover:text-white transition-colors">conveyancers@buysel.com.au</a></li>
              </ul>
            </div>

            {/* Support & Contact */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><a href="mailto:support@buysel.com.au" className="hover:text-white transition-colors">support@buysel.com.au</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 BuySel. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Dialog Modal */}
      {dialogOpen && currentContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{currentContent.title}</h2>
                <button
                  onClick={closeDialog}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {currentContent.description}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Features:</h3>
                <ul className="space-y-2">
                  {currentContent.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#FF6600] mr-2">•</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/api/auth/signin"
                  className="flex-1 bg-[#FF6600] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FF5500] transition-colors text-center"
                  onClick={closeDialog}
                >
                  {currentContent.cta}
                </Link>
                <button
                  onClick={closeDialog}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
