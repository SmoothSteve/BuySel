'use client'

import { useState } from 'react'
import { FileText, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ConveyancerHeader from '@/components/ConveyancerHeader'
import Footer from '@/components/Footer'
import { usePageView } from '@/hooks/useAudit'

interface JobRequest {
  id: string
  propertyAddress: string
  requestDate: string
  deadline: string
  fee: number
  status: 'pending' | 'accepted' | 'in_progress' | 'completed'
  priority: 'standard' | 'rush'
}

const mockJobRequests: JobRequest[] = [
  {
    id: 'JOB-001',
    propertyAddress: '123 George Street, Brisbane QLD 4000',
    requestDate: '2025-11-10',
    deadline: '2025-11-14',
    fee: 650,
    status: 'pending',
    priority: 'standard'
  },
  {
    id: 'JOB-002',
    propertyAddress: '45 Ann Street, Fortitude Valley QLD 4006',
    requestDate: '2025-11-09',
    deadline: '2025-11-11',
    fee: 950,
    status: 'pending',
    priority: 'rush'
  },
  {
    id: 'JOB-003',
    propertyAddress: '78 Main Road, Wellington Point QLD 4160',
    requestDate: '2025-11-08',
    deadline: '2025-11-13',
    fee: 700,
    status: 'in_progress',
    priority: 'standard'
  }
]

const statsData = [
  {
    title: 'Total Earnings (This Month)',
    value: '$8,450',
    change: '+12.5%',
    icon: DollarSign,
    color: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    title: 'Active Jobs',
    value: '5',
    change: '+2 this week',
    icon: FileText,
    color: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    title: 'Completed Jobs',
    value: '23',
    change: '+3 this week',
    icon: CheckCircle,
    color: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    title: 'Average Turnaround',
    value: '2.3 days',
    change: 'On target',
    icon: Clock,
    color: 'bg-orange-100',
    iconColor: 'text-orange-600'
  }
]

export default function ConveyancerDashboard() {
  const { user, isAuthenticated } = useAuth()
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active'>('pending')
  usePageView('conveyancer-dashboard')

  const handleAcceptJob = (jobId: string) => {
    console.log('Accepting job:', jobId)
    // TODO: Implement job acceptance logic
  }

  const handleDeclineJob = (jobId: string) => {
    console.log('Declining job:', jobId)
    // TODO: Implement job decline logic
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConveyancerHeader user={user} isAuthenticated={isAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Professional'}
          </h1>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your conveyancing work today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                {stat.change.startsWith('+') ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : null}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/conveyancer/jobs"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#FF6600]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View All Jobs</h3>
                <p className="text-sm text-gray-600">Manage your workload</p>
              </div>
            </div>
          </Link>

          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Set Availability</h3>
                <p className="text-sm text-gray-600">Update your schedule</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Support</h3>
                <p className="text-sm text-gray-600">Get help or contact us</p>
              </div>
            </div>
          </button>
        </div>

        {/* Job Requests Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Job Requests</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTab('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedTab === 'pending'
                      ? 'bg-[#FF6600] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSelectedTab('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedTab === 'active'
                      ? 'bg-[#FF6600] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Active
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {mockJobRequests
              .filter((job) =>
                selectedTab === 'pending' ? job.status === 'pending' : job.status === 'in_progress'
              )
              .map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{job.propertyAddress}</h3>
                        {job.priority === 'rush' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            <AlertCircle className="h-3 w-3" />
                            RUSH
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Requested: {new Date(job.requestDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          ${job.fee}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAcceptJob(job.id)}
                            className="px-4 py-2 bg-[#FF6600] text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                          >
                            Accept Job
                          </button>
                          <button
                            onClick={() => handleDeclineJob(job.id)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/conveyancer/jobs/${job.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {mockJobRequests.filter((job) =>
              selectedTab === 'pending' ? job.status === 'pending' : job.status === 'in_progress'
            ).length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No {selectedTab} jobs</p>
                <p className="text-sm">Check back later for new opportunities</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <p className="text-gray-900 font-medium">Contract completed for 15 Creek Road, Capalaba</p>
                <p className="text-sm text-gray-600">2 hours ago • $700 earned</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <p className="text-gray-900 font-medium">New job request received</p>
                <p className="text-sm text-gray-600">5 hours ago • 45 Ann Street, Fortitude Valley</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
              <div>
                <p className="text-gray-900 font-medium">Payment processed</p>
                <p className="text-sm text-gray-600">Yesterday • $1,450 deposited to your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
