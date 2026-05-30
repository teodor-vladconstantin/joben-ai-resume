"use client"

import { ChevronDown } from 'lucide-react'

type MonthYearRangeFieldProps = {
  label?: string
  monthLabels: string[]
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  onStartMonthChange: (value: number | undefined) => void
  onStartYearChange: (value: number | undefined) => void
  onEndMonthChange: (value: number | undefined) => void
  onEndYearChange: (value: number | undefined) => void
  onIsCurrentChange: (value: boolean) => void
}

export function MonthYearRangeField({
  label = 'Period',
  monthLabels,
  startMonth,
  startYear,
  endMonth,
  endYear,
  isCurrent = false,
  onStartMonthChange,
  onStartYearChange,
  onEndMonthChange,
  onEndYearChange,
  onIsCurrentChange,
}: MonthYearRangeFieldProps) {
  return (
    <div className="rounded-lg border border-border-soft bg-bg-surface px-3 py-2">
      <p className="text-[11px] text-text-muted uppercase tracking-[0.15em]">{label}</p>
      <div className="mt-2 flex items-center gap-1 flex-wrap">
        <div className="relative">
          <select
            value={startMonth ?? ''}
            onChange={(e) => onStartMonthChange(e.target.value ? Number(e.target.value) : undefined)}
            className="appearance-none rounded-md border border-border-soft bg-bg-surface pl-2 pr-6 py-1 text-small text-text-primary focus:outline-none focus:border-border-strong transition-colors [&>option]:bg-bg-surface"
          >
            <option value="">Month</option>
            {monthLabels.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>

        <input
          type="number"
          value={startYear ?? ''}
          onChange={(e) => onStartYearChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-[68px] rounded-md border border-border-soft bg-bg-subtle px-2 py-1 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors"
          placeholder="Year"
          min={1950}
          max={2099}
        />

        <span className="text-text-muted text-xs">–</span>

        {isCurrent ? (
          <span className="text-xs font-medium text-accent">Present</span>
        ) : (
          <>
            <div className="relative">
              <select
                value={endMonth ?? ''}
                onChange={(e) => onEndMonthChange(e.target.value ? Number(e.target.value) : undefined)}
                className="appearance-none rounded-md border border-border-soft bg-bg-surface pl-2 pr-6 py-1 text-small text-text-primary focus:outline-none focus:border-border-strong transition-colors [&>option]:bg-bg-surface"
              >
                <option value="">Month</option>
                {monthLabels.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>

            <input
              type="number"
              value={endYear ?? ''}
              onChange={(e) => onEndYearChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-[68px] rounded-md border border-border-soft bg-bg-subtle px-2 py-1 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors"
              placeholder="Year"
              min={1950}
              max={2099}
            />
          </>
        )}

        <label className="flex items-center gap-1 ml-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => onIsCurrentChange(e.target.checked)}
            className="accent-accent w-3 h-3"
          />
          <span className="text-xs text-text-muted">Present</span>
        </label>
      </div>
    </div>
  )
}
