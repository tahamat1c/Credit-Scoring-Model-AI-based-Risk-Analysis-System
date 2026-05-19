import { useEffect, useState } from 'react'
import { getBatches, getBatchDetail, getExplanation } from '../api/endpoints'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, Tooltip
} from 'recharts'

interface Batch {
  id: number
  file_name: string
  uploaded_at: string
  total_customers: number
}

interface Customer {
  row: number
  name: string
  age: number
  credit_amount: number
  purpose: string
  risk_level: string
  confidence: number
}

interface Contribution {
  feature: string
  label: string
  importance: number
  impact: string
  message: string
}

interface Explanation {
  name: string
  age: number
  credit_amount: number
  purpose: string
  risk_level: string
  confidence: number
  raw_prediction: string
  summary: string
  risk_factors: Contribution[]
  positive_factors: Contribution[]
  all_contributions: Contribution[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f17]/95 backdrop-blur border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export default function ExplanationPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [error, setError] = useState('')
  

  // Load all batches on mount
  useEffect(() => {
    
    getBatches()
      .then(res => setBatches(res.data))
      .catch(() => setError('Could not load batches.'))
      .finally(() => setLoadingBatches(false))
  }, [])


  useEffect(() => {
    if (explanation) {
      setAnimated(false)
      setTimeout(() => setAnimated(true), 100)
    }
  }, [explanation])

  // Load customers when batch selected
  const handleBatchSelect = async (id: number) => {
    setSelectedBatchId(id)
    setSelectedRow(null)
    setExplanation(null)
    setLoadingCustomers(true)
    try {
      const res = await getBatchDetail(id)
      setCustomers(res.data.customers)
    } catch {
      setError('Could not load customers.')
    } finally {
      setLoadingCustomers(false)
    }
  }

  // Load explanation when customer selected
  const handleCustomerSelect = async (rowIndex: number) => {
    if (!selectedBatchId) return
    setSelectedRow(rowIndex)
    setExplanation(null)
    setLoadingExplanation(true)
    try {
      const res = await getExplanation(selectedBatchId, rowIndex)
      setExplanation(res.data)
    } catch {
      setError('Could not load explanation.')
    } finally {
      setLoadingExplanation(false)
    }
  }

  const getRiskColor = (level: string) => {
    if (level === 'Low Risk')    return 'text-emerald-400'
    if (level === 'Medium Risk') return 'text-amber-400'
    if (level === 'High Risk')   return 'text-red-400'
    return 'text-gray-400'
  }

  const getRiskBorder = (level: string) => {
    if (level === 'Low Risk')    return 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
    if (level === 'Medium Risk') return 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
    if (level === 'High Risk')   return 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
    return 'border-white/10'
  }

  const getRiskGradient = (level: string) => {
    if (level === 'Low Risk')    return 'from-emerald-500/15 to-emerald-500/5'
    if (level === 'Medium Risk') return 'from-amber-500/15 to-amber-500/5'
    if (level === 'High Risk')   return 'from-red-500/15 to-red-500/5'
    return 'from-white/5 to-transparent'
  }

  const getRiskEmoji = (level: string) => {
    if (level === 'Low Risk')    return '🟢'
    if (level === 'Medium Risk') return '🟡'
    if (level === 'High Risk')   return '🔴'
    return '⚪'
  }


  const getRiskGlow = (l: string) => 
  l === 'Low Risk'    ? 'hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] transition-all duration-500' : 
  l === 'Medium Risk' ? 'hover:shadow-[0_0_60px_rgba(245,158,11,0.3)] transition-all duration-500' : 
                        'hover:shadow-[0_0_60px_rgba(239,68,68,0.3)] transition-all duration-500'
  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
          Explainability Center
        </h2>
        <p className="text-gray-400 text-lg">
          Understand why the AI made each credit risk decision
        </p>
      </div>

      {/* Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 p-6">

        {/* Batch Selector */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500" />
            <h3 className="text-base font-semibold text-white">Step 1 — Select Upload Batch</h3>
          </div>
          {loadingBatches ? (
            <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ) : batches.length === 0 ? (
            <p className="text-gray-400 text-sm">No batches found. Upload a file first.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {batches.map(batch => (
                <button
                  key={batch.id}
                  onClick={() => handleBatchSelect(batch.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200
                    ${selectedBatchId === batch.id
                      ? 'border-blue-500/50 bg-blue-500/10 text-white'
                      : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                >
                  <p className="font-medium truncate">{batch.file_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {batch.uploaded_at} · {batch.total_customers} customers
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Selector */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
            <h3 className="text-base font-semibold text-white">Step 2 — Select Customer</h3>
          </div>
          {!selectedBatchId ? (
            <p className="text-gray-400 text-sm">Select a batch first</p>
          ) : loadingCustomers ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <p className="text-gray-400 text-sm">No customers found in this batch.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {customers.map(c => (
                <button
                  key={c.row}
                  onClick={() => handleCustomerSelect(c.row - 1)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200
                    ${selectedRow === c.row - 1
                      ? 'border-purple-500/50 bg-purple-500/10 text-white'
                      : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.name || `Customer ${c.row}`}</p>
                    <span className={`text-xs font-semibold ${getRiskColor(c.risk_level)}`}>
                      {getRiskEmoji(c.risk_level)} {c.risk_level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Age {c.age} · ${c.credit_amount?.toLocaleString()} · {c.purpose}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading Explanation */}
      {loadingExplanation && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center">
          <svg className="animate-spin h-10 w-10 text-blue-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-gray-400">Generating AI explanation...</p>
        </div>
      )}

      {/* No Selection State */}
      {!explanation && !loadingExplanation && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-20 text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src="src/assets/logo.svg" className = "w-24 h-24" alt="" />
          </div>
          <p className="text-xl font-semibold text-gray-300 mb-2">No customer selected</p>
          <p className="text-gray-400">Select a batch and customer above to see detailed explanation</p>
        </div>
      )}

      {/* Explanation Content */}
      {explanation && !loadingExplanation && (
        <div className="space-y-6">

          {/* Customer Header Card */}
          <div className={`relative rounded-2xl p-6 border bg-gradient-to-br ${getRiskGradient(explanation.risk_level)} ${getRiskBorder(explanation.risk_level)} ${getRiskGlow(explanation.risk_level)} overflow-hidden`}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 blur-3xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Customer Analysis</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {explanation.name || 'Customer'}
                </h3>
                <p className="text-gray-400">
                  Age {explanation.age} · ${explanation.credit_amount?.toLocaleString()} loan · {explanation.purpose}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getRiskColor(explanation.risk_level)}`}>
                  {getRiskEmoji(explanation.risk_level)} {explanation.risk_level}
                </p>
                <p className="text-gray-400 mt-1">{explanation.confidence}% confidence</p>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Model Confidence</span>
                <span>{explanation.confidence}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    explanation.risk_level === 'Low Risk'    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                    explanation.risk_level === 'Medium Risk' ? 'bg-gradient-to-r from-amber-500 to-amber-400'   :
                                                               'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: animated ? `${explanation.confidence}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-purple-500" />
              <h4 className="text-base font-semibold text-white">Summary</h4>
            </div>
            <p className="text-gray-300 leading-relaxed">{explanation.summary}</p>
          </div>

          {/* Risk + Positive Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Risk Factors */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-red-400 to-red-600" />
                <h4 className="text-base font-semibold text-white">⚠️ Risk Factors</h4>
              </div>
              {explanation.risk_factors.length === 0 ? (
                <p className="text-gray-400 text-sm">No significant risk factors found.</p>
              ) : (
                <div className="space-y-3">
                  {explanation.risk_factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20
                            hover:bg-red-500/15 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/20
                            transition-all duration-200">
                      <span className="text-red-400 text-lg mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{f.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{f.message}</p>
                        <div className="mt-2 h-1 bg-red-900/50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000"
                            style={{ width: animated ? `${Math.min(f.importance * 5, 100)}%` : '0%' }} />
                        </div>
                        <p className="text-red-700 text-xs mt-1">Impact: {f.importance.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Positive Factors */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                <h4 className="text-base font-semibold text-white">✅ Positive Factors</h4>
              </div>
              {explanation.positive_factors.length === 0 ? (
                <p className="text-gray-400 text-sm">No significant positive factors found.</p>
              ) : (
                <div className="space-y-3">
                  {explanation.positive_factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                          hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/20
                          transition-all duration-200">
                      <span className="text-emerald-400 text-lg mt-0.5">✅</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{f.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{f.message}</p>
                        <div className="mt-2 h-1 bg-emerald-900/50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                            style={{ width: animated ? `${Math.min(f.importance * 5, 100)}%` : '0%' }} />
                        </div>
                        <p className="text-emerald-700 text-xs mt-1">Impact: {f.importance.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Feature Impact Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
              <h4 className="text-base font-semibold text-white">Feature Impact Chart</h4>
              <span className="text-gray-400 text-xs ml-2">Top 10 most influential factors highlighted below</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={explanation.all_contributions.map(c => ({
                  name:   c.label,
                  value:  parseFloat(c.importance.toFixed(2)),
                  impact: c.impact,
                }))}
                layout="vertical"
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" stroke="#4b5563"
                  tick={{ fill: '#ffffff', fontSize: 11 }} width={160} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1000}>
                  {explanation.all_contributions.map((c, i) => (
                    <Cell
                      key={i}
                      fill={c.impact === 'risk' ? '#ef4444' : '#10b981'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-400 text-xs">Risk Factor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-400 text-xs">Positive Factor</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <span>⚠️</span><p>{error}</p>
        </div>
      )}
    </div>
  )
}