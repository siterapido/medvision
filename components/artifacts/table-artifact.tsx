'use client'

import { cn } from '@/lib/utils'
import { Table as TableIcon, Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { TableArtifact as TableArtifactType } from './types'

interface TableArtifactProps {
  artifact: TableArtifactType
  className?: string
}

export function TableArtifact({ artifact, className }: TableArtifactProps) {
  const [copied, setCopied] = useState(false)

  const copyAsCSV = () => {
    const csv = [
      artifact.headers.join(','),
      ...artifact.rows.map((row) => row.join(',')),
    ].join('\n')
    navigator.clipboard.writeText(csv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCSV = () => {
    const csv = [
      artifact.headers.join(','),
      ...artifact.rows.map((row) => row.join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title || 'tabela'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <TableIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {artifact.title || 'Tabela'}
          </span>
          <span className="text-xs text-muted-foreground">
            {artifact.rows.length} linhas
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyAsCSV}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            title="Copiar CSV"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={downloadCSV}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            title="Baixar CSV"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {artifact.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {artifact.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b border-border last:border-b-0',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-foreground whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
