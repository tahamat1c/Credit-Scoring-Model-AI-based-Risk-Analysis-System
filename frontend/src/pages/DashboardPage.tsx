import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts'

import { getBatches, getBatchDetail } from '../api/endpoints'


interface Summary {
  low_risk: number
  medium_risk: number
  high_risk: number
}

interface Prediction {
  row: number
  risk_level: string
  confidence: number
  purpose: string
  credit_amount: number
  duration: number
  age: number
}

interface UploadResult {
  total: number
  summary: Summary
  predictions: Prediction[]
}

interface Batch {
  id: number
  file_name: string
  uploaded_at: string
}

const RISK_COLORS = {
  'Low Risk': '#10b981',
  'Medium Risk': '#f59e0b',
  'High Risk': '#ef4444',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f17]/95 backdrop-blur border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f17]/95 backdrop-blur border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-gray-400 text-sm">{payload[0].value} customers</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {


  // const result: UploadResult | null =
  //   location.state?.result ||
  //   (() => {
  //     const saved = localStorage.getItem('lastResult')
  //     return saved ? JSON.parse(saved) : null
  //   })()

  const [result, setResult] = useState<UploadResult | null>(() => {
  const saved = localStorage.getItem('lastResult')
  return saved ? JSON.parse(saved) : null
  })

  const [animated, setAnimated] = useState(false)
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)


  useEffect(() => {
    setTimeout(() => setAnimated(true), 100)
  }, [])

  useEffect(() => {
  getBatches()
    .then(res => {
      setBatches(res.data)

      if (res.data.length > 0) {
        setSelectedBatchId(res.data[0].id)
      }
    })
    .catch(err => console.log(err))
  }, [])

  useEffect(() => {
  if (!selectedBatchId) return

  setLoadingDashboard(true)

  getBatchDetail(selectedBatchId)
    .then(res => {
      const data = res.data

      const transformed = {
        total: data.total_customers,

        summary: data.summary,

        predictions: data.customers.map((c: any) => ({
          row: c.row,
          risk_level: c.risk_level,
          confidence: c.confidence,
          purpose: c.purpose,
          credit_amount: c.credit_amount,
          duration: c.duration,
          age: c.age,
        })),
      }

      setResult(transformed)
    })
    .catch(err => console.log(err))
    .finally(() => setLoadingDashboard(false))
  }, [selectedBatchId])


  const pieData = result
    ? [
        { name: 'Low Risk', value: result.summary.low_risk },
        { name: 'Medium Risk', value: result.summary.medium_risk },
        { name: 'High Risk', value: result.summary.high_risk },
      ].filter((d) => d.value > 0)
    : []

  const purposeMap: Record<string, number> = {}

  result?.predictions.forEach((p) => {
    purposeMap[p.purpose] = (purposeMap[p.purpose] || 0) + 1
  })

  const purposeData = Object.entries(purposeMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const confidenceData = [
    {
      range: '50-60%',
      count:
        result?.predictions.filter(
          (p) => p.confidence >= 50 && p.confidence < 60
        ).length || 0,
    },
    {
      range: '60-70%',
      count:
        result?.predictions.filter(
          (p) => p.confidence >= 60 && p.confidence < 70
        ).length || 0,
    },
    {
      range: '70-80%',
      count:
        result?.predictions.filter(
          (p) => p.confidence >= 70 && p.confidence < 80
        ).length || 0,
    },
    {
      range: '80-90%',
      count:
        result?.predictions.filter(
          (p) => p.confidence >= 80 && p.confidence < 90
        ).length || 0,
    },
    {
      range: '90%+',
      count:
        result?.predictions.filter((p) => p.confidence >= 90).length || 0,
    },
  ]

  const ageData = [
    {
      range: '18-25',
      count:
        result?.predictions.filter((p) => p.age >= 18 && p.age <= 25)
          .length || 0,
    },
    {
      range: '26-35',
      count:
        result?.predictions.filter((p) => p.age >= 26 && p.age <= 35)
          .length || 0,
    },
    {
      range: '36-45',
      count:
        result?.predictions.filter((p) => p.age >= 36 && p.age <= 45)
          .length || 0,
    },
    {
      range: '46-55',
      count:
        result?.predictions.filter((p) => p.age >= 46 && p.age <= 55)
          .length || 0,
    },
    {
      range: '55+',
      count:
        result?.predictions.filter((p) => p.age > 55).length || 0,
    },
  ]

  const avgCredit = result
    ? Math.round(
        result.predictions.reduce((s, p) => s + p.credit_amount, 0) /
          result.total
      )
    : 0

  const avgDuration = result
    ? Math.round(
        result.predictions.reduce((s, p) => s + p.duration, 0) /
          result.total
      )
    : 0

  const avgConf = result
    ? (
        result.predictions.reduce((s, p) => s + p.confidence, 0) /
        result.total
      ).toFixed(1)
    : '0'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r leading-tight pb-1 
          from-white to-gray-400 bg-clip-text text-transparent mb-3">
          Analytics Dashboard
        </h2>

        <p className="text-gray-400 text-base sm:text-lg">
          {result
            ? `Showing insights for ${result.total} customers`
            : 'Upload a file to see analytics here'}
        </p>
      </div>

      {/* Dashboard Selector */}
  <div className="mt-8 mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5
    backdrop-blur-sm flex flex-col lg:flex-row lg:items-center gap-4">

    <div>
      <p className="text-white font-medium">
        Dashboard Report Selector
      </p>

      <p className="text-gray-500 text-sm mt-1">
        Switch between uploaded analytics reports
      </p>
    </div>

    <select
      value={selectedBatchId || ''}
      onChange={(e) => setSelectedBatchId(Number(e.target.value))}
      className="
        lg:ml-auto
        bg-[#0f0f17]
        border border-white/10
        hover:border-white/20
        text-white rounded-xl px-4 py-3
        outline-none
        transition-all duration-200
        w-full lg:w-[340px]
      "
    >

      {batches.map(batch => (
        <option
          key={batch.id}
          value={batch.id}
          className="bg-[#0f0f17] text-white"
        >
          {batch.file_name}
        </option>
      ))}

    </select>
  </div>



      {/* Empty State */}
      {!result && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 sm:p-20 text-center">
          <div className="text-5xl sm:text-6xl mb-4">📊</div>

          <p className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
            No prediction data yet
          </p>

          <p className="text-gray-400 text-sm sm:text-base">
            Go to Upload page, upload a file, then click
            "View Analytics Dashboard"
          </p>
        </div>
      )}

    <div className="relative">

      {loadingDashboard && (
        <div className="absolute inset-0 z-20 rounded-3xl backdrop-blur-[2px]
          bg-black/20 flex items-center justify-center">

          <div className="px-6 py-4 rounded-2xl border border-white/10
            bg-[#0f0f17]/90 backdrop-blur-xl shadow-2xl">

            <div className="flex items-center gap-3">

              <div className="w-5 h-5 border-2 border-blue-500/30
                border-t-blue-400 rounded-full animate-spin" />

              <p className="text-gray-300 font-medium">
                Loading dashboard...
              </p>

            </div>
          </div>
        </div>
      )}
      </div>




      {result && (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">

            {[
              {
                label: 'Avg Credit Amount',
                value: `$${avgCredit.toLocaleString()}`,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#8ec07c] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-2-2.5c0-1.5 3.5-1.5 3.5 0S10 15 10 16.5s3.5 1.5 3.5 0" />
                      </svg>,
                gradient: 'from-emerald-600/20 to-emerald-600/5',
                border: 'border-emerald-500/20',
                bar: 'from-emerald-500 to-emerald-400',
                text: 'text-emerald-300',
                pct: Math.min((avgCredit / 20000) * 100, 100),
              },

              {
                label: 'Avg Loan Duration',
                value: `${avgDuration} months`,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>,
                gradient: 'from-blue-600/20 to-blue-600/5',
                border: 'border-blue-500/20',
                bar: 'from-blue-500 to-blue-400',
                text: 'text-blue-300',
                pct: Math.min((avgDuration / 60) * 100, 100),
              },

              {
                label: 'Avg Confidence',
                value: `${avgConf}%`,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>,
                gradient: 'from-purple-600/20 to-purple-600/5',
                border: 'border-purple-500/20',
                bar: 'from-purple-500 to-purple-400',
                text: 'text-purple-300',
                pct: parseFloat(avgConf),
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`rounded-2xl p-6 bg-gradient-to-br ${stat.gradient}
                border ${stat.border} backdrop-blur-sm transition-all
                duration-500 hover:scale-[1.02]`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{stat.icon}</span>

                  <p className="text-gray-400 text-sm">
                    {stat.label}
                  </p>
                </div>

                <p className={`text-3xl sm:text-4xl font-bold ${stat.text} mb-4 break-words`}>
                  {stat.value}
                </p>

                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.bar}
                    transition-all duration-1000`}
                    style={{
                      width: animated ? `${stat.pct}%` : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Risk Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

            {/* Total */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10
              hover:bg-white/[0.05] backdrop-blur-sm
              transition-all duration-300 hover:scale-[1.02]
              shadow-[0_0_20px_rgba(255,255,255,0.03)]
              hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]">
              <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                <span>👥</span>
                Total Customers
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-white">
                {result.total}
              </p>
            </div>

            {/* Low */}
            <div className="relative rounded-2xl p-5 overflow-hidden border border-emerald-500/30
              bg-gradient-to-br from-emerald-500/15 to-emerald-500/5
              shadow-[0_0_30px_rgba(16,185,129,0.1)]
              hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]
              transition-all duration-300 hover:scale-[1.02]">

              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl" />

              <p className="text-emerald-400 text-sm mb-3 flex items-center gap-2">
                <span>🟢</span>
                Low Risk
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-emerald-300">
                {result.summary.low_risk}
              </p>

              <div className="mt-3 h-1 bg-emerald-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{
                    width: animated
                      ? `${(result.summary.low_risk / result.total) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="relative rounded-2xl p-5 overflow-hidden border border-amber-500/30
              bg-gradient-to-br from-amber-500/15 to-amber-500/5
              shadow-[0_0_30px_rgba(245,158,11,0.1)]
              hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]
              transition-all duration-300 hover:scale-[1.02]">

              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" />

              <p className="text-amber-400 text-sm mb-3 flex items-center gap-2">
                <span>🟡</span>
                Medium Risk
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-amber-300">
                {result.summary.medium_risk}
              </p>

              <div className="mt-3 h-1 bg-amber-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                  style={{
                    width: animated
                      ? `${(result.summary.medium_risk / result.total) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            {/* High */}
            <div className="relative rounded-2xl p-5 overflow-hidden border border-red-500/30
              bg-gradient-to-br from-red-500/15 to-red-500/5
              shadow-[0_0_30px_rgba(239,68,68,0.1)]
              hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]
              transition-all duration-300 hover:scale-[1.02]">

              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-red-500/10 blur-2xl" />

              <p className="text-red-400 text-sm mb-3 flex items-center gap-2">
                <span>🔴</span>
                High Risk
              </p>

              <p className="text-3xl sm:text-4xl font-bold text-red-300">
                {result.summary.high_risk}
              </p>

              <div className="mt-3 h-1 bg-red-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000"
                  style={{
                    width: animated
                      ? `${(result.summary.high_risk / result.total) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

            {/* Pie */}
            <div className="rounded-2xl border bg-white/[0.02] p-6"
              style={{ borderColor:'rgba(139,92,246,0.3)', boxShadow:'0 0 30px rgba(139,92,246,0.08)' }}>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500" />

                <h4 className="text-base font-semibold text-white">
                  Risk Distribution
                </h4>
              </div>

              <div className="h-[220px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            RISK_COLORS[
                              entry.name as keyof typeof RISK_COLORS
                            ]
                          }
                          stroke="transparent"
                        />
                      ))}
                    </Pie>

                    <Tooltip content={<PieTooltip />} />

                    <Legend
                      formatter={(value) => (
                        <span
                          style={{
                            color: '#9ca3af',
                            fontSize: '12px',
                          }}
                        >
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confidence */}
            <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.02] p-4 sm:p-6 relative overflow-hidden">

              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 h-32 
                  bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />


                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />  {/* ← changed color */}
                    <h4 className="text-base font-semibold text-white">
                      Confidence Distribution
                    </h4>
                  </div>
                </div>
              

              {/* <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-purple-500" />

                <h4 className="text-base font-semibold text-white">
                  Confidence Distribution
                </h4>
              </div> */}

              <div className="h-[220px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={confidenceData}>
                    <defs>
                      {/* <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient> */}

                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>

                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />

                    {/* <XAxis
                      dataKey="range"
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />

                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      allowDecimals={false}
                    /> */}


                    <XAxis
                      dataKey="range"
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={{ stroke: '#ffffff10' }}
                      tickLine={false}
                      label={{ value: 'Confidence Score (%)', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
                    />
                    
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Customers', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                      domain={[0, 'auto']}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#confGrad)"
                    /> */}

                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#confGrad)"
                      animationDuration={1200}
                      animationBegin={0}
                      dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                      activeDot={{ fill: '#10b981', stroke: '#064e3b', strokeWidth: 2, r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Purpose */}
            <div className="rounded-2xl border bg-white/[0.02] p-6"
              style={{ borderColor:'rgba(99,102,241,0.3)', boxShadow:'0 0 30px rgba(99,102,241,0.08)' }}>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />

                <h4 className="text-base font-semibold text-white">
                  Loans by Purpose
                </h4>
              </div>

              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purposeData} layout="vertical">

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff08"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      allowDecimals={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      width={70}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                    >
                      {purposeData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={`hsl(${220 + i * 20}, 70%, 60%)`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Age */}
            <div className="rounded-2xl border bg-white/[0.02] p-6"
              style={{ borderColor:'rgba(245,158,11,0.3)', boxShadow:'0 0 30px rgba(245,158,11,0.08)' }}>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />

                <h4 className="text-base font-semibold text-white">
                  Age Distribution
                </h4>
              </div>

              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData}>

                    <defs>
                      <linearGradient id="ageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />

                    <XAxis
                      dataKey="range"
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />

                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      allowDecimals={false}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Bar
                      dataKey="count"
                      fill="url(#ageGrad)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}