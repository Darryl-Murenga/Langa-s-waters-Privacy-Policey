# Quick Reference - Key Code Snippets

If you prefer to manually integrate the changes instead of replacing the entire file, here are the key code snippets:

## 1. Fix Y-Axis Spacing - Add to Chart Options

### In `volumeChartData` useMemo:
```typescript
options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,  // ADD THIS LINE
  transitions: {     // ADD THIS BLOCK
    active: {
      animation: {
        duration: 0
      }
    }
  },
  // ... rest of your existing options
}
```

### In `trendsChartData` useMemo:
```typescript
options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,  // ADD THIS LINE
  transitions: {     // ADD THIS BLOCK
    active: {
      animation: {
        duration: 0
      }
    }
  },
  // ... rest of your existing options
}
```

---

## 2. Add Breadcrumb State

```typescript
// Add after your other useState declarations
interface BreadcrumbItem {
  label: string
  period: string
  startDate: string
  endDate: string
}

const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
```

---

## 3. Add Helper Functions

```typescript
// Add these functions before your component's useEffect

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
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  return monday.toISOString().split('T')[0]
}

const getWeekEnd = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? 0 : 7)
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
```

---

## 4. Add Drill-Down Click Handler

```typescript
// Add this function before your useEffect

const handleChartClick = (event: any, elements: any) => {
  if (!volumeAnalysis || elements.length === 0) return
  
  const clickedIndex = elements[0].index
  const clickedData = volumeAnalysis.trends[clickedIndex]
  
  let newStartDate: string
  let newEndDate: string
  let newPeriod: string
  let breadcrumbLabel: string

  if (volumePeriod === 'monthly') {
    newStartDate = getMonthStart(clickedData.date)
    newEndDate = getMonthEnd(clickedData.date)
    newPeriod = 'weekly'
    breadcrumbLabel = formatDateLabel(clickedData.date, 'monthly')
  } else if (volumePeriod === 'weekly') {
    newStartDate = getWeekStart(clickedData.date)
    newEndDate = getWeekEnd(clickedData.date)
    newPeriod = 'daily'
    breadcrumbLabel = formatDateLabel(clickedData.date, 'weekly')
  } else {
    return // Already at daily level
  }

  setBreadcrumbs([
    ...breadcrumbs,
    {
      label: breadcrumbLabel,
      period: volumePeriod,
      startDate: volumeStartDate,
      endDate: volumeEndDate
    }
  ])

  setVolumeStartDate(newStartDate)
  setVolumeEndDate(newEndDate)
  setVolumePeriod(newPeriod)
}
```

---

## 5. Add Breadcrumb Navigation Handler

```typescript
// Add this function before your useEffect

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
```

---

## 6. Update useEffect Dependencies

```typescript
// MODIFY your existing useEffect
useEffect(() => {
  console.log('useEffect called, loading performance data')
  loadPerformanceData()
}, [volumeStartDate, volumeEndDate, volumePeriod]) // ADD THESE DEPENDENCIES
```

---

## 7. Update handleVolumePeriodChange

```typescript
// MODIFY your existing function
const handleVolumePeriodChange = (value: string) => {
  setBreadcrumbs([]) // ADD THIS LINE to clear breadcrumbs
  setVolumePeriod(value)
}
```

---

## 8. Add onClick to Chart Options

### In `volumeChartData` useMemo:
```typescript
options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  transitions: { active: { animation: { duration: 0 } } },
  onClick: handleChartClick, // ADD THIS LINE
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 8,
      displayColors: false,
      callbacks: { 
        label: (context: any) => `Tickets: ${context.parsed.y}`,
        footer: () => volumePeriod !== 'daily' ? 'Click to drill down' : '' // ADD THIS LINE
      }
    }
  },
  // ... rest of options
}
```

---

## 9. Add Breadcrumb UI Component

Add this INSIDE the Volume Trends tab, right after the CardContent opening tag and before the existing content:

```typescript
{/* Add this at the start of TabsContent for "volume" */}
{volumeAnalysis && (
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
    
    {/* Your existing volume content goes here */}
  </div>
)}
```

---

## 10. Add Icons to Imports

```typescript
// ADD Home and ChevronRight to your lucide-react imports
import { 
  TrendingUp, TrendingDown, AlertTriangle, Clock, Users, Award, 
  Activity, BarChart3, Loader2, Target, ArrowUpRight, ArrowDownRight, 
  Minus, Calendar, ChevronRight, Home // ADD THESE TWO
} from 'lucide-react'
```

---

## 11. Update Chart Hint Text

Find where you render the chart title and add the hint:

```typescript
<div className="flex justify-between items-center mb-4">
  <div>
    <h3 className="font-semibold text-gray-900">Ticket Volume Trends</h3>
    {volumePeriod !== 'daily' && ( // ADD THIS BLOCK
      <p className="text-sm text-gray-500 mt-1">💡 Click on any bar to drill down</p>
    )}
  </div>
  {/* ... rest of your header content */}
</div>
```

---

## ✅ Checklist

After applying all changes, verify:

- [ ] Added `animation: false` to both chart configs
- [ ] Added `transitions` block to both chart configs
- [ ] Added breadcrumb state
- [ ] Added all helper functions
- [ ] Added `handleChartClick` function
- [ ] Added `handleBreadcrumbClick` function
- [ ] Updated `useEffect` dependencies
- [ ] Updated `handleVolumePeriodChange`
- [ ] Added `onClick` to chart options
- [ ] Added breadcrumb UI component
- [ ] Added `Home` and `ChevronRight` to imports
- [ ] Added drill-down hint text

---

## 🧪 Quick Test

1. Click on a monthly bar → Should show weekly view
2. Click on a weekly bar → Should show daily view
3. Click breadcrumb → Should navigate back
4. Chart should not have jumping y-axis anymore

**If everything works, you're done! 🎉**
