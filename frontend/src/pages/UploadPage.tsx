import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFile, getTemplateUrl } from '../api/endpoints'

interface Prediction {
  row: number
  name: string
  risk_level: string
  risk_color: string
  confidence: number
  raw_prediction: string
  age: number
  credit_amount: number
  duration: number
  purpose: string
  probabilities: { good: number; bad: number }
}

interface UploadResult {
  success: boolean
  batch_id: number
  file_name: string
  total: number
  summary: {
    low_risk: number
    medium_risk: number
    high_risk: number
  }
  predictions: Prediction[]
}

export default function UploadPage() {
  const navigate = useNavigate()

  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [result, setResult] = useState<UploadResult | null>(() => {
    const saved = localStorage.getItem('lastResult')
    return saved ? JSON.parse(saved) : null
  })

  const handleFile = (f: File) => {
    setFile(f)
    setError('')
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)

    const f = e.dataTransfer.files[0]

    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await uploadFile(file)

      setResult(res.data)

      localStorage.setItem('lastResult', JSON.stringify(res.data))
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Upload failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // const getRiskBadge = (level: string) =>
  //   ({
  //     'Low Risk':
  //       'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',

  //     'Medium Risk':
  //       'bg-amber-500/20 text-amber-400 border border-amber-500/40',

  //     'High Risk':
  //       'bg-red-500/20 text-red-400 border border-red-500/40',
  //   }[level] || 'bg-gray-500/20 text-gray-400')

  // const getRiskEmoji = (level: string) =>
  //   level === 'Low Risk'
  //     ? '🟢'
  //     : level === 'Medium Risk'
  //     ? '🟡'
  //     : level === 'High Risk'
  //     ? '🔴'
  //     : '⚪'

  // const getConfidenceColor = (c: number) =>
  //   c >= 80
  //     ? 'from-emerald-500 to-emerald-400'
  //     : c >= 60
  //     ? 'from-amber-500 to-amber-400'
  //     : 'from-red-500 to-red-400'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
          Credit Risk Analysis
        </h2>

        <p className="text-gray-400 text-base sm:text-lg">
          Upload customer data for instant AI-powered risk predictions
        </p>
      </div>

      {/* Top Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <span className="text-gray-400 text-sm">
          Don't have a file?
        </span>

        <a
          href={getTemplateUrl()}
          className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
          bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          text-gray-300 hover:text-white transition-all duration-200"
        >
          📥 Download Excel Template
        </a>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}

        onDragLeave={() => setDragging(false)}

        onDrop={handleDrop}

        onClick={() =>
          document.getElementById('fileInput')?.click()
        }

        className={`relative rounded-2xl p-8 sm:p-16 text-center cursor-pointer
        transition-all duration-300 mb-6 overflow-hidden

        ${
          dragging
            ? 'border-2 border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
            : 'border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 pointer-events-none" />

        <div
          className={`text-5xl sm:text-6xl mb-5 transition-transform duration-300
          ${dragging ? 'scale-110' : ''}`}
        >
          {dragging ? '📂' : '☁️'}
        </div>

        <p className="text-lg sm:text-xl font-semibold text-white mb-2">
          {dragging
            ? 'Drop your file here'
            : 'Drag & drop your Excel file'}
        </p>

        <p className="text-gray-400 text-sm mb-4">
          or click to browse from your computer
        </p>

        <div
          className="inline-flex flex-wrap justify-center items-center gap-2
          px-4 py-1.5 rounded-full bg-white/5 border border-white/10
          text-gray-400 text-xs"
        >
          📋 Supports .xlsx, .xls, .csv · Max 10MB
        </div>

        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"

          onChange={(e) =>
            e.target.files?.[0] &&
            handleFile(e.target.files[0])
          }
        />
      </div>

      {/* Selected File */}
      {file && (
        <div
          className="flex flex-col sm:flex-row sm:items-center
          justify-between gap-4 px-5 py-4 rounded-xl
          bg-white/5 border border-white/10 mb-6"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-10 h-10 rounded-lg bg-blue-500/20
              border border-blue-500/30 flex items-center
              justify-center text-lg shrink-0"
            >
              📊
            </div>

            <div className="min-w-0">
              <p className="text-white font-medium truncate">
                {file.name}
              </p>

              <p className="text-gray-400 text-xs mt-0.5">
                {(file.size / 1024).toFixed(1)} KB · Ready to upload
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFile(null)
              setResult(null)
            }}

            className="w-full sm:w-auto text-gray-600 hover:text-red-400
            transition text-sm px-3 py-2 rounded-lg hover:bg-red-500/10"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-start sm:items-center gap-3 px-5 py-4 rounded-xl
          bg-red-500/10 border border-red-500/30 text-red-400 mb-6"
        >
          <span className="text-xl shrink-0">⚠️</span>

          <p className="break-words">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}

        className={`w-full py-4 rounded-xl font-semibold text-base sm:text-lg
        transition-all duration-300 mb-10

        ${
          !file || loading
            ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>

            Analyzing Credit Risk...
          </span>
        ) : (
          '🔍 Analyze Credit Risk'
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-8">

          {/* Summary Cards */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-sm mb-3">
                👥 Total Customers
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-white">
                {result.total}
              </p>

              <p className="text-gray-600 text-xs mt-2 truncate">
                {result.file_name}
              </p>
            </div>

            <div
              className="rounded-2xl p-5 bg-emerald-500/10
              border border-emerald-500/20
              shadow-lg shadow-emerald-500/5"
            >
              <p className="text-emerald-400 text-sm mb-3">
                🟢 Low Risk
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-emerald-300">
                {result.summary.low_risk}
              </p>
            </div>

            <div
              className="rounded-2xl p-5 bg-amber-500/10
              border border-amber-500/20
              shadow-lg shadow-amber-500/5"
            >
              <p className="text-amber-400 text-sm mb-3">
                🟡 Medium Risk
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-amber-300">
                {result.summary.medium_risk}
              </p>
            </div>

            <div
              className="rounded-2xl p-5 bg-red-500/10
              border border-red-500/20
              shadow-lg shadow-red-500/5"
            >
              <p className="text-red-400 text-sm mb-3">
                🔴 High Risk
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-red-300">
                {result.summary.high_risk}
              </p>
            </div>
          </div> */}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Total */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]
              transition-all duration-300 hover:scale-[1.02]">

              <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                <span>👥</span> Total Customers
              </p>

              <p className="text-4xl font-bold text-white">
                {result.total}
              </p>

              <p className="text-gray-600 text-xs mt-2 truncate">
                {result.file_name}
              </p>
            </div>

            {/* Low Risk */}
            <div
              className="relative rounded-2xl p-5 overflow-hidden border border-emerald-500/30
              bg-gradient-to-br from-emerald-500/15 to-emerald-500/5
              shadow-[0_0_30px_rgba(16,185,129,0.1)]
              hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]
              transition-all duration-300 hover:scale-[1.02]"
            >

              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl" />

              <p className="text-emerald-400 text-sm mb-3 flex items-center gap-2">
                <span>🟢</span> Low Risk
              </p>

              <p className="text-4xl font-bold text-emerald-300">
                {result.summary.low_risk}
              </p>

              <div className="mt-3 h-1 bg-emerald-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  style={{
                    width: `${(result.summary.low_risk / result.total) * 100}%`,
                  }}
                />
              </div>

              <p className="text-emerald-600 text-xs mt-1.5">
                {result.total > 0
                  ? Math.round(
                      (result.summary.low_risk / result.total) * 100
                    )
                  : 0}
                % of total
              </p>
            </div>

            {/* Medium Risk */}
            <div
              className="relative rounded-2xl p-5 overflow-hidden border border-amber-500/30
              bg-gradient-to-br from-amber-500/15 to-amber-500/5
              shadow-[0_0_30px_rgba(245,158,11,0.1)]
              hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]
              transition-all duration-300 hover:scale-[1.02]"
            >

              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" />

              <p className="text-amber-400 text-sm mb-3 flex items-center gap-2">
                <span>🟡</span> Medium Risk
              </p>

              <p className="text-4xl font-bold text-amber-300">
                {result.summary.medium_risk}
              </p>

              <div className="mt-3 h-1 bg-amber-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  style={{
                    width: `${(result.summary.medium_risk / result.total) * 100}%`,
                  }}
                />
              </div>

              <p className="text-amber-600 text-xs mt-1.5">
                {result.total > 0
                  ? Math.round(
                      (result.summary.medium_risk / result.total) * 100
                    )
                  : 0}
                % of total
              </p>
            </div>

            {/* High Risk */}
            <div
              className="relative rounded-2xl p-5 overflow-hidden border border-red-500/30
              bg-gradient-to-br from-red-500/15 to-red-500/5
              shadow-[0_0_30px_rgba(239,68,68,0.1)]
              hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]
              transition-all duration-300 hover:scale-[1.02]"
            >

              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-red-500/10 blur-2xl" />

              <p className="text-red-400 text-sm mb-3 flex items-center gap-2">
                <span>🔴</span> High Risk
              </p>

              <p className="text-4xl font-bold text-red-300">
                {result.summary.high_risk}
              </p>

              <div className="mt-3 h-1 bg-red-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                  style={{
                    width: `${(result.summary.high_risk / result.total) * 100}%`,
                  }}
                />
              </div>

              <p className="text-red-600 text-xs mt-1.5">
                {result.total > 0
                  ? Math.round(
                      (result.summary.high_risk / result.total) * 100
                    )
                  : 0}
                % of total
              </p>
            </div>

          </div>






          {/* Buttons */}
          <div className="flex flex-col lg:flex-row gap-4">

            <button
              onClick={() =>
                navigate('/dashboard', { state: { result } })
              }

              className="w-full py-4 rounded-xl font-semibold transition-all duration-200
                bg-gradient-to-r from-[#5865F2] to-[#4752C4] 
                hover:from-[#4752C4] hover:to-[#5865F2]
                text-white shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/30
                flex items-center justify-center gap-2"
            >
              📊 View Analytics Dashboard
            </button>

            {/* <a
              href={`http://127.0.0.1:8000/api/batches/${result.batch_id}/download/`}

              className="w-full py-4 rounded-xl font-semibold
              transition-all duration-200
              bg-white/5 hover:bg-white/10
              border border-white/10 hover:border-white/20
              text-gray-300 hover:text-white
              flex items-center justify-center gap-2"
            >
              📥 Download Excel Report
            </a> */}
          </div>
        </div>
      )}
    </div>
  )
}