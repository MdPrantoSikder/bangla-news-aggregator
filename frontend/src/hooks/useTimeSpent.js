import { useState, useEffect } from "react"

const STORAGE_KEY = "banglabrief_time_spent"

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function useTimeSpent() {
  const [seconds, setSeconds] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      return data[getTodayKey()] || 0
    } catch { return 0 }
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1
        try {
          const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
          data[getTodayKey()] = next
          // Keep only last 7 days
          const keys = Object.keys(data).sort()
          if (keys.length > 7) delete data[keys[0]]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch {}
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const format = (s) => {
    if (s < 60) return `${s}s`
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  }

  return format(seconds)
}
