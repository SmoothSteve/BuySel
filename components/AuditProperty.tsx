'use client'

import { useState, useEffect } from 'react'
import { X, Activity, User, Globe, Zap, FileText, Calendar, Hash, Loader2 } from 'lucide-react'
import type { ApiAuditLog } from '@/types/audit'
import { buildApiUrl } from '@/lib/config'

interface AuditPropertyProps {
  propertyid: number
  onClose: () => void
}

export default function AuditProperty({ propertyid, onClose }: AuditPropertyProps) {
  const [audits, setAudits] = useState<ApiAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAudits()
  }, [propertyid])

  const fetchAudits = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl('/api/audit'))
      if (response.ok) {
        const data: ApiAuditLog[] = await response.json()
        // Filter by property ID in the page field
        const filtered = data.filter(log =>
          log.page && log.page.includes(`property/${propertyid}`)
        )
        setAudits(filtered)
      } else {
        console.error('Failed to fetch audit logs')
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-red-600 p-2 rounded-lg mr-3">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Property Audit Log</h2>
              <p className="text-sm text-gray-300">Property ID: {propertyid}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-red-600 mr-3" />
              <span className="text-gray-600">Loading audit logs...</span>
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600">There are no audit entries for this property.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on Mobile */}
              <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[21%]">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {audits.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Hash className="h-4 w-4 text-gray-400 mr-2" />
                            {log.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-2">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">{log.username}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            {log.page}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{new Date(log.dte).toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{new Date(log.dte).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe className="h-4 w-4 text-gray-400 mr-2" />
                            {log.ipaddress || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 text-green-500 mr-2" />
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {log.action}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Hidden on Desktop */}
              <div className="lg:hidden space-y-4">
                {audits.map((log) => (
                  <div key={log.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      {/* Header with ID and Timestamp */}
                      <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">ID: {log.id}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(log.dte).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Full Timestamp */}
                      <div className="mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{new Date(log.dte).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.username}</p>
                          </div>
                        </div>
                      </div>

                      {/* IP Address */}
                      <div className="mb-3">
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-xs text-gray-500 mr-2">IP:</span>
                          <span className="text-gray-900">{log.ipaddress || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="mb-3">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-xs text-gray-500 mr-2">Action:</span>
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {log.action}
                          </span>
                        </div>
                      </div>

                      {/* Page */}
                      <div>
                        <div className="flex items-center text-sm">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-xs text-gray-500 mr-2">Page:</span>
                          <span className="text-gray-900 font-medium">{log.page}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
