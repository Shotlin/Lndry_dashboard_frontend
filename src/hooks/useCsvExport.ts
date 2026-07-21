"use client"

import { useState } from "react"

export function useCsvExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    setIsExporting(true)
    try {
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((val) => {
              const strVal = val === null || val === undefined ? "" : String(val)
              // Escape quotes and wrap in quotes to prevent delimiter breaking
              const cleanVal = strVal.replace(/"/g, '""')
              return `"${cleanVal}"`
            })
            .join(",")
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to export CSV:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportToCsv,
    isExporting,
  }
}
