import { useEffect, useState } from 'react'
import {
  getBatches,
  getBatchDetail,
  getDownloadUrl,
} from '../api/endpoints'

interface Batch {
  id: number
  file_name: string
  uploaded_at: string
  total_customers: number
  low_risk: number
  medium_risk: number
  high_risk: number
  status: string
}

interface Customer {
  row: number
  name: string
  email: string
  contact_number: string
  age: number
  credit_amount: number
  duration: number
  purpose: string
  employment: string
  housing: string
  risk_level: string
  risk_color: string
  confidence: number
  raw_prediction: string
  probabilities: { good: number; bad: number }
}

interface BatchDetail {
  id: number
  file_name: string
  uploaded_at: string
  total_customers: number
  summary: {
    low_risk: number
    medium_risk: number
    high_risk: number
  }
  customers: Customer[]
}

export default function ReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedBatch, setSelectedBatch] =
    useState<BatchDetail | null>(null)

  const [loadingDetail, setLoadingDetail] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    getBatches()
      .then((res) => setBatches(res.data))
      .catch(() =>
        setError('Could not load reports.')
      )
      .finally(() => setLoading(false))
  }, [])

  const handleViewDetail = async (id: number) => {
    if (selectedBatch?.id === id) {
      setSelectedBatch(null)
      return
    }

    setLoadingDetail(true)

    try {
      const res = await getBatchDetail(id)
      setSelectedBatch(res.data)
    } catch {
      setError('Could not load batch details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  const getRiskBadge = (level: string) => {
    const styles: Record<string, string> = {
      'Low Risk':
        'bg-green-900 text-green-300 border border-green-700',

      'Medium Risk':
        'bg-yellow-900 text-yellow-300 border border-yellow-700',

      'High Risk':
        'bg-red-900 text-red-300 border border-red-700',
    }

    return (
      styles[level] ||
      'bg-gray-800 text-gray-300'
    )
  }

  const getRiskEmoji = (level: string) => {
    if (level === 'Low Risk') return '🟢'
    if (level === 'Medium Risk') return '🟡'
    if (level === 'High Risk') return '🔴'
    return '⚪'
  }

  // const getStatusBadge = (status: string) => {
  //   if (status === 'done')
  //     return 'bg-green-900 text-green-300 border border-green-700'

  //   if (status === 'processing')
  //     return 'bg-yellow-900 text-yellow-300 border border-yellow-700'

  //   if (status === 'failed')
  //     return 'bg-red-900 text-red-300 border border-red-700'

  //   return 'bg-gray-800 text-gray-300'
  // }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">

      {/* Header */}
      <h2 className="text-3xl sm:text-4xl font-bold mb-2">
        Reports
      </h2>

      <p className="text-gray-400 mb-8 text-sm sm:text-base">
        All previous file uploads and their prediction results.
      </p>

      {/* Error */}
      {error && (
        <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 break-words">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-gray-400">
          ⏳ Loading reports...
        </div>
      )}

      {/* Empty */}
      {!loading && batches.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 sm:p-16 text-center">

          <p className="text-5xl mb-4">📋</p>

          <p className="text-gray-400 text-lg">
            No reports yet.
          </p>

          <p className="text-gray-600 text-sm mt-2">
            Upload a file on the Upload page to generate your first report.
          </p>
        </div>
      )}

      {/* Batch List */}
      {!loading && batches.length > 0 && (
        <div className="space-y-4">

          {batches
            .filter(batch => !selectedBatch || selectedBatch.id === batch.id)
            .map(batch => (
            <div
              key={batch.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >

              {/* Header Row */}
              <div className="px-4 sm:px-6 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                {/* Left */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">

                  <div className="text-2xl flex-shrink-0">
                    📊
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {batch.file_name}
                    </p>

                    <p className="text-gray-400 text-sm">
                      {batch.uploaded_at}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                {/* <div className="flex flex-wrap items-center gap-2">

                  <span className="text-gray-400 text-sm whitespace-nowrap">
                    {batch.total_customers}  customers
                  </span>

                  <span className="bg-green-900 text-green-300 border border-green-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    🟢 {batch.low_risk}
                  </span>

                  <span className="bg-yellow-900 text-yellow-300 border border-yellow-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    🟡 {batch.medium_risk}
                  </span>

                  <span className="bg-red-900 text-red-300 border border-red-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    🔴 {batch.high_risk}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadge(
                      batch.status
                    )}`}
                  >
                    {batch.status}
                  </span>
                </div> */}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">

                  <button
                    onClick={() =>
                      handleViewDetail(batch.id)
                    }
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    {selectedBatch?.id === batch.id
                      ? '▲ Hide'
                      : '▼ View Details'}
                  </button>

                  <a
                    href={getDownloadUrl(batch.id)}
                    className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition text-center"
                  >
                    📥 Download
                  </a>
                </div>
              </div>

              {/* Detail Section */}
              {selectedBatch?.id === batch.id && (
                <div className="border-t border-gray-800">

                  {loadingDetail ? (
                    <p className="text-center py-8 text-gray-400">
                      ⏳ Loading details...
                    </p>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 p-4 sm:p-6 border-b border-gray-800">

                        {/* Total */}
                        <div className="bg-gray-800 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-xs mb-1">
                            Total
                          </p>

                          <p className="text-2xl font-bold text-white">
                            {selectedBatch.total_customers}
                          </p>
                        </div>

                        {/* Low */}
                        <div className="bg-green-950 border border-green-800 rounded-lg p-4 text-center">
                          <p className="text-green-400 text-xs mb-1">
                            🟢 Low Risk
                          </p>

                          <p className="text-2xl font-bold text-green-300">
                            {selectedBatch.summary.low_risk}
                          </p>
                        </div>

                        {/* Medium */}
                        <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-4 text-center">
                          <p className="text-yellow-400 text-xs mb-1">
                            🟡 Medium Risk
                          </p>

                          <p className="text-2xl font-bold text-yellow-300">
                            {selectedBatch.summary.medium_risk}
                          </p>
                        </div>

                        {/* High */}
                        <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-center">
                          <p className="text-red-400 text-xs mb-1">
                            🔴 High Risk
                          </p>

                          <p className="text-2xl font-bold text-red-300">
                            {selectedBatch.summary.high_risk}
                          </p>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">

                        <table className="w-full min-w-[1400px]">

                          <thead>
                            <tr className="bg-gray-800 text-gray-400 text-sm">

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                #
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Name
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Email
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Contact
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Age
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Credit Amount
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Duration
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Purpose
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Employment
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Housing
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Risk Level
                              </th>

                              <th className="px-4 py-3 text-left whitespace-nowrap">
                                Confidence
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedBatch.customers.map(
                              (c) => (
                                <tr
                                  key={c.row}
                                  className="border-t border-gray-800 hover:bg-gray-800 transition"
                                >

                                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                    {c.row}
                                  </td>

                                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                                    {c.name ||
                                      `Customer ${c.row}`}
                                  </td>

                                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                                    {c.email || '—'}
                                  </td>

                                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                                    {c.contact_number || '—'}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {c.age}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap">
                                    $
                                    {c.credit_amount?.toLocaleString()}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {c.duration} months
                                  </td>

                                  <td className="px-4 py-3 capitalize whitespace-nowrap">
                                    {c.purpose}
                                  </td>

                                  <td className="px-4 py-3">
                                    {c.employment ? `${c.employment} yrs` : '—'}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {c.housing}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap">

                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getRiskBadge(
                                        c.risk_level
                                      )}`}
                                    >
                                      {getRiskEmoji(
                                        c.risk_level
                                      )}{' '}
                                      {c.risk_level}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap">

                                    <div className="flex items-center gap-2">

                                      <div className="w-20 bg-gray-700 rounded-full h-2">

                                        <div
                                          className="h-2 rounded-full bg-blue-500"
                                          style={{
                                            width: `${c.confidence}%`,
                                          }}
                                        />
                                      </div>

                                      <span className="text-sm text-gray-300">
                                        {c.confidence}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}