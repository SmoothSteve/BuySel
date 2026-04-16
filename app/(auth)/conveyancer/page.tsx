'use client'

import { useState } from 'react'
import { FileText, Shield, CheckCircle, ArrowRight, Briefcase, Clock } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ConveyancerHeader from '@/components/ConveyancerHeader'
import Footer from '@/components/Footer'
import { usePageView } from '@/hooks/useAudit'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "How do I get started as a conveyancer on BuySel?",
    answer: "Sign in using your professional email and complete your profile with your licensing details. Once verified, you'll access our dashboard and start receiving document preparation requests from property sellers."
  },
  {
    question: "How much can I earn per contract?",
    answer: "Standard Contract of Sale preparation typically earns $550-$750 per property, depending on complexity. You set your own rates within market guidelines."
  },
  {
    question: "What types of documents will I be preparing?",
    answer: "Primarily Contracts of Sale for residential properties in Queensland. You may also assist with title searches, contract amendments, and settlement documentation."
  },
  {
    question: "How quickly do I need to complete contract preparation?",
    answer: "Standard turnaround is 2-3 business days. Rush orders (24-48 hours) are available at premium rates. You can set your availability and capacity in your dashboard."
  },
  {
    question: "How do I get paid?",
    answer: "Payments are processed securely through the platform. You'll receive payment within 48 hours of contract delivery and client acceptance. All transactions are tracked in your dashboard."
  },
  {
    question: "What verification do I need to provide?",
    answer: "You'll need to provide your current Queensland Law Society practicing certificate, professional indemnity insurance details, and ABN."
  }
]

export default function ConveyancerPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const { user, isAuthenticated } = useAuth()
  usePageView('conveyancer')

  return (
    <div className="min-h-screen bg-white">
      <ConveyancerHeader user={user} isAuthenticated={isAuthenticated} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Professional Conveyancing Network
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join BuySel&apos;s network of licensed conveyancers and access a steady stream
              of property sale contracts across Queensland
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/conveyancer/dashboard" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold bg-[#FF6600] text-white hover:bg-orange-700 rounded-lg transition-colors">
                  Access Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <Link href="/api/auth/signin" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold bg-[#FF6600] text-white hover:bg-orange-700 rounded-lg transition-colors">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
              <a href="#how-it-works" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white hover:bg-white hover:text-gray-900 rounded-lg transition-colors">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Join BuySel?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Work with Queensland&apos;s fastest-growing property platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-[#FF6600]" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Consistent Work</h3>
              <p className="text-gray-600 leading-relaxed">
                Access a growing platform of property sellers requiring professional contract preparation and conveyancing services.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-[#FF6600]" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Flexible Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                Control your workload and availability. Set your own rates and accept jobs that align with your schedule.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#FF6600]" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-900">Secure Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamlined document management, secure payment processing, and comprehensive transaction tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple process to start receiving conveyancing work</p>
          </div>
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-start gap-6">
              <div className="bg-gray-900 text-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-3 text-gray-900">Sign Up & Get Verified</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Create your account and provide your professional credentials for verification.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#FF6600] mr-2 flex-shrink-0 mt-0.5" />
                    <span>Current Queensland Law Society practicing certificate</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#FF6600] mr-2 flex-shrink-0 mt-0.5" />
                    <span>Professional indemnity insurance details</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#FF6600] mr-2 flex-shrink-0 mt-0.5" />
                    <span>ABN and business information</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-500 mt-4">Verification typically takes 1-2 business days</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-start gap-6">
              <div className="bg-gray-900 text-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-3 text-gray-900">Receive Document Requests</h3>
                <p className="text-gray-600 leading-relaxed">
                  When sellers list properties, they need Contracts of Sale prepared. Receive notifications for requests in your service area with all necessary property details and documentation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-start gap-6">
              <div className="bg-gray-900 text-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-3 text-gray-900">Prepare Documents</h3>
                <p className="text-gray-600 leading-relaxed">
                  Complete the contract preparation using your professional expertise. Conduct title searches, draft compliant Contracts of Sale, and upload completed documents to the platform.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-start gap-6">
              <div className="bg-gray-900 text-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-3 text-gray-900">Get Paid Securely</h3>
                <p className="text-gray-600 leading-relaxed">
                  Once the seller accepts the contract, payment is processed automatically. Funds are transferred within 48 hours with full transaction tracking and GST-compliant invoicing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Fees */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fee Structure</h2>
            <p className="text-lg text-gray-600">Competitive rates for professional services</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-[#FF6600]" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-gray-900">Contract Preparation</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Standard Contract of Sale including title search and due diligence
              </p>
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">$550-$750</p>
                <p className="text-sm text-gray-500 mt-1">2-3 business days</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border-2 border-[#FF6600] p-8 relative">
              <div className="absolute top-0 right-0 bg-[#FF6600] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                PREMIUM
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-[#FF6600]" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-gray-900">Rush Service</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Expedited contract preparation for urgent requirements
              </p>
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">$850-$1,100</p>
                <p className="text-sm text-gray-500 mt-1">24-48 hours</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-[#FF6600]" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-gray-900">Settlement Services</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Full conveyancing services through to settlement
              </p>
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">$1,200-$2,000</p>
                <p className="text-sm text-gray-500 mt-1">Plus contract fee</p>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-8 text-sm">
            All fees exclude GST. Set your own rates within market guidelines.
          </p>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Professional Requirements</h2>
            <p className="text-lg text-gray-600">Essential credentials for joining our network</p>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-[#FF6600] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Practicing Certificate</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Valid Queensland Law Society practicing certificate</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-[#FF6600] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Professional Indemnity</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Minimum $2M professional indemnity coverage</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-[#FF6600] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Business Registration</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Valid Australian Business Number for payment processing</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-[#FF6600] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Relevant Experience</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Experience in residential conveyancing and contract preparation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                  <span className="text-gray-400 text-xl flex-shrink-0">
                    {expandedFAQ === index ? '−' : '+'}
                  </span>
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-5 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Start receiving conveyancing work from BuySel&apos;s growing property network
          </p>
          {isAuthenticated ? (
            <Link href="/conveyancer/dashboard" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold bg-[#FF6600] text-white hover:bg-orange-700 rounded-lg transition-colors">
              Access Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link href="/api/auth/signin" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold bg-[#FF6600] text-white hover:bg-orange-700 rounded-lg transition-colors">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
          <p className="mt-8 text-gray-400">
            Questions? Contact us at <a href="mailto:conveyancers@buysel.com.au" className="text-[#FF6600] hover:underline">conveyancers@buysel.com.au</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
