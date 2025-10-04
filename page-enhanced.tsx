'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Users, Award, Activity, BarChart3, Loader2, Target, ArrowUpRight, ArrowDownRight, Minus, Calendar, ChevronRight, Home } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { reportService } from '@/lib/api/services'
import { ComparisonMetric } from '@/lib/api/services/ReportService'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface PerformanceMetrics {
  firstCallResolutionRate: number
  customerSatisfactionScore: number
  averageResolutionTime: number
  totalTickets: number
  resolvedTickets: number
  openTickets: number
  resolutionRate: number
  reportDate: string
  period: string
}

interface AgentPerformance {
  agentId: number
  agentName: string
  agentEmail: string
  resolvedTickets: number
  averageResolutionTime: number
  customerSatisfactionScore: number
  slaCompliancePercentage: number
  totalTickets: number
  openTickets: number
  firstCallResolutionRate: number
  lastActivity: string
  performanceRank: string
  avatar: string
}

interface VolumeAnalysis {
  period: string
  startDate: string
  endDate: string
  totalTickets: number
  createdTickets: number
  resolvedTickets: number
  openTickets: number
  growthRate: number
  trends: Array<{
    date: string
    ticketCount: number
    dayOfWeek: string
    hour: string
  }>
  peakHour: string
  peakDay: string
  averageTicketsPerDay: number
}

interface PeakAnalysis {
  hourlyVolume: Array<{
    hour: number
    label: string
    count: number
    percentage: number
  }>
  dailyVolume: Array<{
    dayOfWeek: number
    dayName: string
    count: number
    percentage: number
  }>
  peakHour: number
  peakHourLabel: string
  peakHourCount: number
  peakDay: string
  peakDayCount: number
  periodStart: string
  periodEnd: string
  totalTickets: number
  avgTicketsPerHour: number
  avgTicketsPerDay: number
}

// Breadcrumb types
interface BreadcrumbItem {
  label: string
  period: string
  startDate: string
  endDate: string
}

export default function PerformanceAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([])
  const [volumeAnalysis, setVolumeAnalysis] = useState<VolumeAnalysis | null>(null)
  const [peakAnalysis, setPeakAnalysis] = useState<PeakAnalysis | null>(null)
  const [comparison, setComparison] = useState<ComparisonMetric[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('resolvedTickets')
  const [volumePeriod, setVolumePeriod] = useState<string>('monthly')
  const [showComparison, setShowComparison] = useState(false)
  const [activeTab, setActiveTab] = useState<'agents' | 'volume' | 'peaks'>('agents')
  const [showTrendsModal, setShowTrendsModal] = useState(false)
  const [trendsEndDate, setTrendsEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [trendsData, setTrendsData] = useState<any>(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [showPeriodSuggestion, setShowPeriodSuggestion] = useState(false)
  const [suggestedPeriod, setSuggestedPeriod] = useState<'weekly' | 'monthly' | null>(null)

  // Breadcrumb state for drill-down navigation
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  // Initialize with current week (Monday to Sunday) for Peak Analysis
  const [peakStartDate, setPeakStartDate] = useState(() => {
    const date = new Date()
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date.setDate(diff))
    return monday.toISOString().split('T')[0]
  })
  const [peakEndDate, setPeakEndDate] = useState(() => {
    const date = new Date()
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? 0 : 7)
    const sunday = new Date(date.setDate(diff))
    return sunday.toISOString().split('T')[0]
  })

  // Initialize with last month to today for Agent Performance and Ticket Volume
  const [agentStartDate, setAgentStartDate] = useState(() => {
    return "2025-08-30"
  })
  const [agentEndDate, setAgentEndDate] = useState(() => {
    return "2025-10-30"
  })

  const [volumeStartDate, setVolumeStartDate] = useState(() => {
    return "2025-08-30"
  })
  const [volumeEndDate, setVolumeEndDate] = useState(() => {
    return "2025-10-30"
  })

  // Helper functions for date calculations
  const getMonthStart = (dateString: string) => {
    const date = new Date(dateString)
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
  }

  const getMonthEnd = (dateString: string) => {
    const date = new Date(dateString)
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
  }

  const getWeekStart = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    const monday = new Date(date.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  const getWeekEnd = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? 0 : 7) // Adjust to Sunday
    const sunday = new Date(date.setDate(diff))
    return sunday.toISOString().split('T')[0]
  }

  const formatDateLabel = (dateString: string, period: string) => {
    const date = new Date(dateString)
    switch (period) {
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'weekly':
        const weekEnd = new Date(date)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      case 'daily':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      default:
        return dateString
    }
  }

  // Handle drill-down on chart bar click
  const handleChartClick = (event: any, elements: any) => {
    if (!volumeAnalysis || elements.length === 0) return
    
    const clickedIndex = elements[0].index
    const clickedData = volumeAnalysis.trends[clickedIndex]
    
    let newStartDate: string
    let newEndDate: string
    let newPeriod: string
    let breadcrumbLabel: string

    if (volumePeriod === 'monthly') {
      // Drill down from monthly to weekly
      newStartDate = getMonthStart(clickedData.date)
      newEndDate = getMonthEnd(clickedData.date)
      newPeriod = 'weekly'
      breadcrumbLabel = formatDateLabel(clickedData.date, 'monthly')
    } else if (volumePeriod === 'weekly') {
      // Drill down from weekly to daily
      newStartDate = getWeekStart(clickedData.date)
      newEndDate = getWeekEnd(clickedData.date)
      newPeriod = 'daily'
      breadcrumbLabel = formatDateLabel(clickedData.date, 'weekly')
    } else {
      // Already at daily level, can't drill down further
      return
    }

    // Add to breadcrumb trail
    setBreadcrumbs([
      ...breadcrumbs,
      {
        label: breadcrumbLabel,
        period: volumePeriod,
        startDate: volumeStartDate,
        endDate: volumeEndDate
      }
    ])

    // Update state to trigger data fetch
    setVolumeStartDate(newStartDate)
    setVolumeEndDate(newEndDate)
    setVolumePeriod(newPeriod)
  }

  // Handle breadcrumb click to navigate back
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Reset to initial view
      setBreadcrumbs([])
      setVolumeStartDate("2025-08-30")
      setVolumeEndDate("2025-10-30")
      setVolumePeriod('monthly')
    } else {
      // Navigate to clicked breadcrumb level
      const targetBreadcrumb = breadcrumbs[index]
      setBreadcrumbs(breadcrumbs.slice(0, index))
      setVolumeStartDate(targetBreadcrumb.startDate)
      setVolumeEndDate(targetBreadcrumb.endDate)
      setVolumePeriod(targetBreadcrumb.period)
    }
  }

  useEffect(() => {
    console.log('useEffect called, loading performance data')
    loadPerformanceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeStartDate, volumeEndDate, volumePeriod]) // Re-fetch when drill-down changes occur

  const handleVolumePeriodChange = (value: string) => {
    // Clear breadcrumbs when manually changing period
    setBreadcrumbs([])
    setVolumePeriod(value)
  }

  const handleAgentFilterChange = (value: string) => {
    setSelectedAgent(value)
  }

  const loadTrendsData = async () => {
    try {
      setLoadingTrends(true)
      setTrendsData(null)

      const response = await fetch(`/api/reports/trends/volume?endDate=${trendsEndDate}T23:59:59.999Z`)
      if (!response.ok) throw new Error('Failed to fetch trends data')

      const data = await response.json()
      setTrendsData(data.data)
    } catch (error) {
      console.error('Error loading trends data:', error)
      setError('Failed to load trends data')
    } finally {
      setLoadingTrends(false)
    }
  }

  // Helper function to generate flexible labels based on period and data
  const generateFlexibleLabels = (trends: any[], period: string) => {
    if (!trends || trends.length === 0) return []

    switch (period) {
      case 'daily':
        return trends.map(trend => {
          const date = new Date(trend.date)
          const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
          return date.toLocaleDateString('en-US', options)
        })

      case 'weekly':
        return trends.map(trend => trend.label)

      case 'monthly':
        return trends.map(trend => trend.label)

      default:
        return trends.map(trend => trend.label || trend.dayOfWeek || 'Unknown')
    }
  }

  const loadPerformanceData = async () => {
    console.log('loadPerformanceData called')
    try {
      setLoading(true)
      setError(null)

      const agentStartDateTime = `${agentStartDate}T00:00:00.000Z`
      const agentEndDateTime = `${agentEndDate}T23:59:59.999Z`
      const volumeStartDateTime = `${volumeStartDate}T00:00:00.000Z`
      const volumeEndDateTime = `${volumeEndDate}T23:59:59.999Z`
      const peakStartDateTime = `${peakStartDate}T00:00:00.000Z`
      const peakEndDateTime = `${peakEndDate}T23:59:59.999Z`

      // Calculate duration for volume trends tab
      const volumeDurationMs = new Date(volumeEndDateTime).getTime() - new Date(volumeStartDateTime).getTime()
      const volumeDurationDays = Math.ceil(volumeDurationMs / (1000 * 60 * 60 * 24))
      const volumeDurationWeeks = Math.ceil(volumeDurationDays / 7)

      // Implement date range safety measures
      console.log('Date range check:', { volumePeriod, volumeDurationDays, volumeDurationWeeks })
      if (volumePeriod === 'daily' && volumeDurationDays > 13) {
        console.log('Date range too long for daily, suggesting weekly')
        setSuggestedPeriod('weekly')
        setShowPeriodSuggestion(true)
        setLoading(false)
        return
      }
      if (volumePeriod === 'weekly' && volumeDurationWeeks > 8) {
        console.log('Date range too long for weekly, suggesting monthly')
        setSuggestedPeriod('monthly')
        setShowPeriodSuggestion(true)
        setLoading(false)
        return
      }
      setShowPeriodSuggestion(false)
      setSuggestedPeriod(null)

      // Load performance metrics
      const metricsResponse = await fetch(
        `/api/reports/performance/metrics?startDate=${agentStartDateTime}&endDate=${agentEndDateTime}&period=monthly`
      )
      console.log('Metrics response status:', metricsResponse.status, metricsResponse.ok)
      if (metricsResponse.ok) {
        const data = await metricsResponse.json()
        console.log('Metrics data received:', data)
        setPerformanceMetrics(data.data)
      } else {
        console.error('Metrics response failed:', await metricsResponse.text())
      }

      // Load agent performance
      const agentsResponse = await fetch(
        `/api/reports/performance/agents?startDate=${agentStartDateTime}&endDate=${agentEndDateTime}`
      )
      console.log('Agents response status:', agentsResponse.status, agentsResponse.ok)
      if (agentsResponse.ok) {
        const data = await agentsResponse.json()
        console.log('Agents data received:', data)
        setAgentPerformance(data.data || [])
      } else {
        console.error('Agents response failed:', await agentsResponse.text())
      }

      // Load volume trends
      const volumeResponse = await fetch(
        `/api/reports/volume/trends?startDate=${volumeStartDateTime}&endDate=${volumeEndDateTime}&period=${volumePeriod}`
      )
      console.log('Volume response status:', volumeResponse.status, volumeResponse.ok)
      if (volumeResponse.ok) {
        const data = await volumeResponse.json()
        console.log('Volume data received:', data)
        setVolumeAnalysis(data.data)
      } else {
        console.error('Volume response failed:', await volumeResponse.text())
      }

      // Load peak analysis
      const peakResponse = await fetch(
        `/api/reports/volume/peak-analysis?startDate=${peakStartDateTime}&endDate=${peakEndDateTime}`
      )
      console.log('Peak response status:', peakResponse.status, peakResponse.ok)
      if (peakResponse.ok) {
        const data = await peakResponse.json()
        console.log('Peak data received:', data)
        setPeakAnalysis(data.data)
      } else {
        console.error('Peak response failed:', await peakResponse.text())
      }

      // Load month-over-month comparison if requested
      if (showComparison) {
        const comparisonData = await reportService.compareMonthOverMonth()
        setComparison(comparisonData)
      }

    } catch (err: any) {
      console.error('Failed to load performance data:', err)
      setError(err.message || 'Failed to load performance analytics')
    } finally {
      setLoading(false)
    }
  }

  const sortedAgents = [...agentPerformance].sort((a, b) => {
    switch (sortBy) {
      case 'resolvedTickets':
        return b.resolvedTickets - a.resolvedTickets
      case 'averageResolutionTime':
        return a.averageResolutionTime - b.averageResolutionTime
      case 'slaCompliance':
        return b.slaCompliancePercentage - a.slaCompliancePercentage
      case 'firstCallResolution':
        return b.firstCallResolutionRate - a.firstCallResolutionRate
      default:
        return 0
    }
  })

  const filteredAgents = selectedAgent === 'ALL' 
    ? sortedAgents 
    : sortedAgents.filter(agent => agent.agentId === parseInt(selectedAgent))

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'UP':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'DOWN':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'UP':
        return 'text-green-600 bg-green-50'
      case 'DOWN':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Memoize chart data to prevent unnecessary re-renders and calculate stable y-axis
  const volumeChartData = useMemo(() => {
    if (!volumeAnalysis) return null
    
    const maxValue = Math.max(...volumeAnalysis.trends.map(t => t.ticketCount))
    const yAxisMax = Math.ceil(maxValue / 10) * 10 + 10
    const stepSize = Math.ceil(yAxisMax / 5)
    
    return {
      data: {
        labels: generateFlexibleLabels(volumeAnalysis.trends, volumePeriod),
        datasets: [
          {
            label: 'Ticket Count',
            data: volumeAnalysis.trends.map(t => t.ticketCount),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(59, 130, 246, 0.8)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        transitions: {
          active: {
            animation: {
              duration: 0
            }
          }
        },
        onClick: handleChartClick,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 8,
            displayColors: false,
            callbacks: { 
              label: (context: any) => `Tickets: ${context.parsed.y}`,
              footer: () => volumePeriod !== 'daily' ? 'Click to drill down' : ''
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false }, 
            border: { display: false }, 
            ticks: { font: { size: 11 }, padding: 8 } 
          },
          y: {
            beginAtZero: true,
            min: 0,
            max: yAxisMax,
            border: { display: false },
            grid: { color: 'rgba(0, 0, 0, 0.1)' },
            ticks: {
              font: { size: 11 },
              padding: 8,
              stepSize: stepSize
            }
          }
        }
      }
    }
  }, [volumeAnalysis, volumePeriod])

  const trendsChartData = useMemo(() => {
    if (!trendsData) return null
    
    const maxValue = Math.max(...trendsData.dataPoints.map((point: any) => point.value))
    const yAxisMax = Math.ceil(maxValue / 10) * 10 + 10
    const stepSize = Math.ceil(yAxisMax / 5)
    
    return {
      data: {
        labels: generateFlexibleLabels(trendsData.dataPoints, trendsData.period),
        datasets: [
          {
            label: 'Ticket Volume',
            data: trendsData.dataPoints.map((point: any) => point.value),
            backgroundColor: trendsData.dataPoints.map((point: any) =>
              point.value > 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(200, 200, 200, 0.3)'
            ),
            borderColor: trendsData.dataPoints.map((point: any) =>
              point.value > 0 ? 'rgb(59, 130, 246)' : 'rgb(200, 200, 200)'
            ),
            borderWidth: 1,
            borderRadius: 4,
            hoverBackgroundColor: trendsData.dataPoints.map((point: any) =>
              point.value > 0 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(200, 200, 200, 0.5)'
            ),
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        transitions: {
          active: {
            animation: {
              duration: 0
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 8,
            displayColors: false,
            callbacks: { label: (context: any) => `Volume: ${context.parsed.y}` }
          }
        },
        scales: {
          x: { 
            grid: { display: false }, 
            border: { display: false }, 
            ticks: { font: { size: 11 }, padding: 8 } 
          },
          y: { 
            beginAtZero: true,
            min: 0,
            max: yAxisMax,
            border: { display: false }, 
            grid: { color: 'rgba(0, 0, 0, 0.1)' }, 
            ticks: { 
              font: { size: 11 }, 
              padding: 8, 
              stepSize: stepSize
            }
          }
        }
      }
    }
  }, [trendsData])

  const hourlyChartData = useMemo(() => {
    if (!peakAnalysis) return null
    return {
      labels: peakAnalysis.hourlyVolume.map(h => h.label),
      datasets: [
        {
          label: 'Ticket Count',
          data: peakAnalysis.hourlyVolume.map(h => h.count),
          backgroundColor: peakAnalysis.hourlyVolume.map(h => 
            h.hour === peakAnalysis.peakHour ? 'rgba(239, 68, 68, 0.6)' : 'rgba(99, 102, 241, 0.5)'
          ),
          borderColor: peakAnalysis.hourlyVolume.map(h => 
            h.hour === peakAnalysis.peakHour ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)'
          ),
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    }
  }, [peakAnalysis])

  const dailyChartData = useMemo(() => {
    if (!peakAnalysis) return null
    return {
      labels: peakAnalysis.dailyVolume.map(d => d.dayName),
      datasets: [
        {
          label: 'Ticket Count',
          data: peakAnalysis.dailyVolume.map(d => d.count),
          backgroundColor: peakAnalysis.dailyVolume.map(d => 
            d.dayName === peakAnalysis.peakDay ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.5)'
          ),
          borderColor: peakAnalysis.dailyVolume.map(d => 
            d.dayName === peakAnalysis.peakDay ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'
          ),
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    }
  }, [peakAnalysis])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Activity className="w-8 h-8 mr-3" />
                Performance Analytics
              </h1>
              <p className="text-blue-100 text-lg">Comprehensive performance metrics and insights</p>
            </div>
            <Button 
              onClick={() => {
                setShowComparison(!showComparison)
                if (!showComparison) loadPerformanceData()
              }}
              className={`${showComparison ? 'bg-white text-blue-600' : 'bg-white/20'} hover:bg-white/30 border-white/30 backdrop-blur-sm`}
            >
              {showComparison ? 'Hide' : 'Compare Periods'}
            </Button>
          </div>
        </div>
      </div>

      {/* Period Comparison Section */}
      {showComparison && comparison.length > 0 && (
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Month-over-Month Comparison</span>
            </CardTitle>
            <CardDescription>Current month vs. previous month performance changes</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {comparison.map((metric, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getDirectionColor(metric.direction)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{metric.metricName}</span>
                    {getDirectionIcon(metric.direction)}
                  </div>
                  <div className="text-2xl font-bold">{metric.currentValue.toFixed(1)}</div>
                  <div className="text-xs mt-1">
                    vs {metric.previousValue.toFixed(1)}
                  </div>
                  <div className={`text-sm font-semibold mt-2 ${
                    metric.direction === 'UP' ? 'text-green-700' : 
                    metric.direction === 'DOWN' ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    {metric.percentageChange > 0 ? '+' : ''}{metric.percentageChange.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview Cards */}
      {performanceMetrics && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <Target className="w-6 h-6" />
                </div>
                <Badge className="bg-green-100 text-green-700">
                  {performanceMetrics.resolutionRate.toFixed(1)}%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">First Call Resolution</p>
                <p className="text-3xl font-bold text-gray-900">{performanceMetrics.firstCallResolutionRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <Award className="w-6 h-6" />
                </div>
                <Badge className="bg-purple-100 text-purple-700">
                  /5.0
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-gray-900">{performanceMetrics.customerSatisfactionScore.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  hours
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Resolution Time</p>
                <p className="text-3xl font-bold text-gray-900">{performanceMetrics.averageResolutionTime.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <Activity className="w-6 h-6" />
                </div>
                <Badge className="bg-orange-100 text-orange-700">
                  Total
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Ticket Volume</p>
                <p className="text-3xl font-bold text-gray-900">{performanceMetrics.totalTickets}</p>
                <p className="text-xs text-gray-500 mt-1">{performanceMetrics.resolvedTickets} resolved | {performanceMetrics.openTickets} open</p>
              </div>
            </CardContent>
          </Card>
      </div>
      )}

      {/* Performance Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'agents' | 'volume' | 'peaks')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="agents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Agent Performance</TabsTrigger>
          <TabsTrigger value="volume" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Ticket Volume</TabsTrigger>
          <TabsTrigger value="peaks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Peak Analysis</TabsTrigger>
        </TabsList>
        
        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
              <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span>Agent Performance Report</span>
              </CardTitle>
                  <CardDescription>Individual agent metrics and performance indicators</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Date Range Picker */}
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={agentStartDate}
                      onChange={(e) => setAgentStartDate(e.target.value)}
                      className="w-[150px]"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="date"
                      value={agentEndDate}
                      onChange={(e) => setAgentEndDate(e.target.value)}
                      className="w-[150px]"
                    />
                    <Button 
                      onClick={loadPerformanceData}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply
                    </Button>
                  </div>
                  <Select value={selectedAgent} onValueChange={handleAgentFilterChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Agents</SelectItem>
                      {agentPerformance.map((agent) => (
                        <SelectItem key={agent.agentId} value={agent.agentId.toString()}>
                          {agent.agentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolvedTickets">Resolved Tickets</SelectItem>
                      <SelectItem value="averageResolutionTime">Resolution Time</SelectItem>
                      <SelectItem value="slaCompliance">SLA Compliance</SelectItem>
                      <SelectItem value="firstCallResolution">First Call Resolution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {filteredAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No agent data available</h3>
                    <p className="text-muted-foreground">Agent performance metrics will appear here once agents start processing tickets.</p>
                  </div>
                ) : (
                  filteredAgents.map((agent, index) => (
                  <div key={index} className="group p-6 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {agent.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{agent.agentName}</h3>
                            <p className="text-sm text-gray-600">{agent.agentEmail}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${agent.performanceRank === 'Top Performer' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {agent.performanceRank}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{agent.resolvedTickets}</div>
                        <div className="text-sm text-green-700">Resolved</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{agent.averageResolutionTime.toFixed(1)}h</div>
                        <div className="text-sm text-blue-700">Avg Time</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">{Math.round(agent.firstCallResolutionRate)}%</div>
                        <div className="text-sm text-purple-700">FCR</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-orange-600">{Math.round(agent.slaCompliancePercentage)}%</div>
                          <div className="text-sm text-orange-700">SLA</div>
                      </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Volume Trends Tab */}
        <TabsContent value="volume" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
              <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Ticket Volume Trends</span>
              </CardTitle>
                  <CardDescription>Daily, weekly, and monthly ticket creation patterns</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Date Range Picker */}
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={volumeStartDate}
                      onChange={(e) => setVolumeStartDate(e.target.value)}
                      className="w-[150px]"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="date"
                      value={volumeEndDate}
                      onChange={(e) => setVolumeEndDate(e.target.value)}
                      className="w-[150px]"
                    />
                    <Button 
                      onClick={loadPerformanceData}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply
                    </Button>
                  </div>
                  <Select value={volumePeriod} onValueChange={handleVolumePeriodChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {volumeAnalysis ? (
              <div className="space-y-6">
                  {/* Breadcrumb Navigation */}
                  {breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <button
                        onClick={() => handleBreadcrumbClick(-1)}
                        className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors text-blue-700 font-medium"
                      >
                        <Home className="w-4 h-4" />
                        <span>Overview</span>
                      </button>
                      {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-blue-400" />
                          <button
                            onClick={() => handleBreadcrumbClick(index)}
                            className="px-3 py-1 rounded-md hover:bg-blue-100 transition-colors text-blue-700 font-medium"
                          >
                            {crumb.label}
                          </button>
                        </div>
                      ))}
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                      <span className="px-3 py-1 bg-blue-200 rounded-md text-blue-900 font-semibold">
                        {volumePeriod.charAt(0).toUpperCase() + volumePeriod.slice(1)} View
                      </span>
                    </div>
                  )}

                  {showPeriodSuggestion && (
                    <Alert className="border-yellow-200 bg-yellow-50 mb-4">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <p className="mb-2">Your selected date range is quite large for {volumePeriod} trends.</p>
                        <p className="mb-3">Would you like to switch to {suggestedPeriod} reports for better readability?</p>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPeriodSuggestion(false)}
                            className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                          >
                            Continue Anyway
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setVolumePeriod(suggestedPeriod!)
                              setShowPeriodSuggestion(false)
                              loadPerformanceData()
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            Switch to {suggestedPeriod}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Volume Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 font-medium">Total Tickets</div>
                      <div className="text-2xl font-bold text-blue-900">{volumeAnalysis.totalTickets}</div>
                        </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700 font-medium">Created</div>
                      <div className="text-2xl font-bold text-green-900">{volumeAnalysis.createdTickets}</div>
                      </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-700 font-medium">Resolved</div>
                      <div className="text-2xl font-bold text-orange-900">{volumeAnalysis.resolvedTickets}</div>
                      </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-700 font-medium">Peak Day</div>
                      <div className="text-2xl font-bold text-purple-900">{volumeAnalysis.peakDay}</div>
                      <div className="text-sm text-purple-600">{volumeAnalysis.peakHour}</div>
                    </div>
                      </div>

                  {/* Volume Chart */}
                  <div className="bg-white rounded-xl border p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Ticket Volume Trends</h3>
                        {volumePeriod !== 'daily' && (
                          <p className="text-sm text-gray-500 mt-1">💡 Click on any bar to drill down</p>
                        )}
                      </div>
                      <Dialog open={showTrendsModal} onOpenChange={setShowTrendsModal}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Trends over 12 month period
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select End Date for 12-Month Trends</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">End Date</label>
                              <Input
                                type="date"
                                value={trendsEndDate}
                                onChange={(e) => setTrendsEndDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                              />
                      </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setShowTrendsModal(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  loadTrendsData()
                                  setShowTrendsModal(false)
                                }}
                                disabled={loadingTrends}
                              >
                                {loadingTrends ? 'Loading...' : 'Load Trends'}
                              </Button>
                      </div>
                    </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* When trendsData is loaded, show 12-month trends and summary */}
                    {trendsChartData && (
                      <>
                        <Bar
                          data={trendsChartData.data}
                          options={trendsChartData.options}
                          height={300}
                        />

                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">12-Month Trends Summary</h4>
                            <Button variant="outline" size="sm" onClick={() => setTrendsData(null)}>Back to Current Period</Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Overall Trend:</span>
                              <div className={`font-medium ${trendsData.trendDirection === 'up' ? 'text-green-600' : trendsData.trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                                {trendsData.overallTrend > 0 ? '+' : ''}{trendsData.overallTrend}%
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Forecast:</span>
                              <div className="font-medium text-blue-600">{trendsData.forecast}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Volume:</span>
                              <div className="font-medium text-purple-600">{trendsData.dataPoints.reduce((sum: number, point: any) => sum + point.value, 0)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Period:</span>
                              <div className="font-medium text-gray-600 capitalize">{trendsData.period}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Default period chart when no trendsData */}
                    {!trendsData && volumeChartData && (
                      <Bar
                        data={volumeChartData.data}
                        options={volumeChartData.options}
                        height={300}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No volume data available</p>
                  </div>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Peak Analysis Tab */}
        <TabsContent value="peaks" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Peak Hours & Days Analysis</span>
              </CardTitle>
              <CardDescription>Identify peak times and optimize resource allocation</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {peakAnalysis ? (
              <div className="space-y-6">
                  {/* Peak Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="text-sm text-red-700 font-medium">Peak Hour</div>
                      <div className="text-2xl font-bold text-red-900">{peakAnalysis.peakHourLabel}</div>
                      <div className="text-sm text-red-600">{peakAnalysis.peakHourCount} tickets</div>
                        </div>
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <div className="text-sm text-orange-700 font-medium">Peak Day</div>
                      <div className="text-2xl font-bold text-orange-900">{peakAnalysis.peakDay}</div>
                      <div className="text-sm text-orange-600">{peakAnalysis.peakDayCount} tickets</div>
                        </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 font-medium">Avg/Hour</div>
                      <div className="text-2xl font-bold text-blue-900">{peakAnalysis.avgTicketsPerHour.toFixed(1)}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700 font-medium">Avg/Day</div>
                      <div className="text-2xl font-bold text-green-900">{peakAnalysis.avgTicketsPerDay.toFixed(1)}</div>
                    </div>
                  </div>

                  {/* Hourly Chart */}
                  {hourlyChartData && (
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Hourly Volume Distribution</h3>
                    <Bar
                      data={hourlyChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 8,
                            displayColors: false,
                            callbacks: {
                              label: (context) => `${context.parsed.y} tickets (${peakAnalysis.hourlyVolume[context.dataIndex].percentage.toFixed(1)}%)`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              display: false
                            },
                            border: {
                              display: false
                            },
                            ticks: {
                              font: {
                                size: 10
                              },
                              padding: 8
                            }
                          },
                          y: {
                            beginAtZero: true,
                            border: {
                              display: false
                            },
                            grid: {
                              color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              font: {
                                size: 11
                              },
                              padding: 8
                            }
                          }
                        }
                      }}
                      height={300}
                    />
              </div>
                  )}

                  {/* Daily Chart */}
                  {dailyChartData && (
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Daily Volume Distribution</h3>
                    <Bar
                      data={dailyChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 8,
                            displayColors: false,
                            callbacks: {
                              label: (context) => `${context.parsed.y} tickets (${peakAnalysis.dailyVolume[context.dataIndex].percentage.toFixed(1)}%)`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              display: false
                            },
                            border: {
                              display: false
                            },
                            ticks: {
                              font: {
                                size: 11
                              },
                              padding: 8
                            }
                          },
                          y: {
                            beginAtZero: true,
                            border: {
                              display: false
                            },
                            grid: {
                              color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              font: {
                                size: 11
                              },
                              padding: 8
                            }
                          }
                        }
                      }}
                      height={300}
                    />
                  </div>
                  )}
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No peak analysis data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
