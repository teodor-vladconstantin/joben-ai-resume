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
    <div className="rounded-xl border border-[#16DB65]/25 bg-linear-to-br from-[#0A0F0D] via-[#08160f] to-[#05110a] px-3 py-2.5">
      <p className="text-[11px] text-white/45 uppercase tracking-[0.15em]">{label}</p>
      <div className="mt-2 flex items-center gap-1 flex-wrap">
        <div className="relative">
          <select
            value={startMonth ?? ''}
            onChange={(e) => onStartMonthChange(e.target.value ? Number(e.target.value) : undefined)}
            className="appearance-none rounded border border-white/10 bg-[#0A0F0D] pl-2 pr-6 py-1.5 text-xs text-white focus:border-[#16DB65] focus:outline-none [&>option]:bg-[#0A0F0D]"
          >
            <option value="">Month</option>
            {monthLabels.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
        </div>

        <input
          type="number"
          value={startYear ?? ''}
          onChange={(e) => onStartYearChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-[68px] rounded border border-white/10 bg-[#0A0F0D] px-2 py-1.5 text-xs text-white focus:border-[#16DB65] focus:outline-none"
          placeholder="Year"
          min={1950}
          max={2099}
        />

        <span className="text-white/30 text-xs">–</span>

        {isCurrent ? (
          <span className="text-xs font-medium text-[#16DB65]">Present</span>
        ) : (
          <>
            <div className="relative">
              <select
                value={endMonth ?? ''}
                onChange={(e) => onEndMonthChange(e.target.value ? Number(e.target.value) : undefined)}
                className="appearance-none rounded border border-white/10 bg-[#0A0F0D] pl-2 pr-6 py-1.5 text-xs text-white focus:border-[#16DB65] focus:outline-none [&>option]:bg-[#0A0F0D]"
              >
                <option value="">Month</option>
                {monthLabels.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
            </div>

            <input
              type="number"
              value={endYear ?? ''}
              onChange={(e) => onEndYearChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-[68px] rounded border border-white/10 bg-[#0A0F0D] px-2 py-1.5 text-xs text-white focus:border-[#16DB65] focus:outline-none"
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
            className="accent-[#16DB65] w-3 h-3"
          />
          <span className="text-xs text-white/55">Present</span>
        </label>
      </div>
    </div>
  )
}
