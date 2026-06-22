import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind classes conditionally and merges conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number to INR currency representation.
 */
export function formatCurrency(amount) {
  const number = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(number)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(number)
}

/**
 * Formats a date string (YYYY-MM-DD) into a clean, human-readable format.
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  // Format as "Jun 24, 2026"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC' // Keep date aligned with the database input
  })
}

/**
 * Generates and downloads a CSV file from a list of expense objects.
 */
export function exportToCSV(expenses, filename = 'expenses_export.csv') {
  if (!expenses || expenses.length === 0) return
  
  const headers = ['Date', 'Description', 'Category', 'Amount (₹)']
  const rows = expenses.map(exp => [
    exp.date,
    `"${exp.description.replace(/"/g, '""')}"`,
    exp.category,
    exp.amount
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Checks if a JWT token is expired by parsing its base64 payload.
 */
export function isTokenExpired(token) {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const decoded = JSON.parse(jsonPayload)
    if (!decoded.exp) return false // Token does not have exp claim, assume not expired
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp < now
  } catch (err) {
    return true // Treat decoding failures as expired
  }
}

/**
 * Shared category configuration.
 */
export const CATEGORIES = [
  { name: 'Food', color: 'bg-[#FFF0F7] text-[#FF5FA2] border-[#FF5FA2]/20' },
  { name: 'Transport', color: 'bg-[#F5F0FF] text-[#A855F7] border-[#A855F7]/20' },
  { name: 'Utilities', color: 'bg-emerald-50 text-emerald-600 border-emerald-250/20' },
  { name: 'Entertainment', color: 'bg-[#FFF9F2] text-[#FFB86B] border-[#FFB86B]/20' },
  { name: 'Other', color: 'bg-slate-50 text-slate-500 border-slate-200' }
]

