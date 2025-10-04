# Y-Axis Spacing Fix

## The Problem
You're using `animation: { duration: 0 }` but Chart.js still triggers its animation system, causing y-axis recalculation on every render.

## The Solution
Change `animation: { duration: 0 }` to `animation: false`

---

## Find and Replace in Your Code

### Fix #1: volumeChartData

**FIND THIS:**
```typescript
options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  transitions: {
    active: {
      animation: {
        duration: 0
      }
    }
  },
```

**REPLACE WITH:**
```typescript
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
```

### Fix #2: trendsChartData

**FIND THIS:**
```typescript
options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  transitions: {
    active: {
      animation: {
        duration: 0
      }
    }
  },
```

**REPLACE WITH:**
```typescript
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
```

---

## Quick Summary

Change line in `volumeChartData`:
- ❌ `animation: { duration: 0 },`
- ✅ `animation: false,`

Change line in `trendsChartData`:
- ❌ `animation: { duration: 0 },`
- ✅ `animation: false,`

That's it! The y-axis will stop jumping.
