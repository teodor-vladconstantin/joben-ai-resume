"use client"

import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
  label,
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
  const t = useTranslations('Builder.monthYearField')
  const resolvedLabel = label ?? t('periodLabel')

  return (
    <div className="border border-(--border) bg-(--surface) px-3 py-2.5">
      <p className="font-mono text-(length:--text-label) text-(--muted)">{resolvedLabel}</p>
      <div className="mt-2 flex items-center gap-1 flex-wrap">
        <div className="relative">
          <select
            value={startMonth ?? ''}
            onChange={(e) => onStartMonthChange(e.target.value ? Number(e.target.value) : undefined)}
            className="appearance-none rounded-sm border border-(--border) bg-(--surface) pl-2 pr-6 py-1.5 text-xs text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
          >
            <option value="">{t('monthPlaceholder')}</option>
            {monthLabels.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-(--muted)" />
        </div>

        <input
          type="number"
          value={startYear ?? ''}
          onChange={(e) => onStartYearChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-[68px] rounded-sm border border-(--border) bg-(--surface) px-2 py-1.5 text-xs text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
          placeholder={t('yearPlaceholder')}
          min={1950}
          max={2099}
        />

        <span className="text-(--muted) text-xs">–</span>

        {isCurrent ? (
          <span className="text-xs font-medium text-(--foreground)">{t('present')}</span>
        ) : (
          <>
            <div className="relative">
              <select
                value={endMonth ?? ''}
                onChange={(e) => onEndMonthChange(e.target.value ? Number(e.target.value) : undefined)}
                className="appearance-none rounded-sm border border-(--border) bg-(--surface) pl-2 pr-6 py-1.5 text-xs text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
              >
                <option value="">{t('monthPlaceholder')}</option>
                {monthLabels.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-(--muted)" />
            </div>

            <input
              type="number"
              value={endYear ?? ''}
              onChange={(e) => onEndYearChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-[68px] rounded-sm border border-(--border) bg-(--surface) px-2 py-1.5 text-xs text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
              placeholder={t('yearPlaceholder')}
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
            className="accent-(--accent) w-3 h-3"
          />
          <span className="text-xs text-(--muted)">{t('present')}</span>
        </label>
      </div>
    </div>
  )
}
