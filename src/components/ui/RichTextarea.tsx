"use client"

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { Bold, Italic, Underline } from 'lucide-react'

type ToolbarFormat = 'bold' | 'italic' | 'underline'

const FORMAT_MARKERS: Record<ToolbarFormat, string> = {
  bold: '**',
  italic: '*',
  underline: '__',
}

const FORMAT_PLACEHOLDERS: Record<ToolbarFormat, string> = {
  bold: 'bold text',
  italic: 'italic text',
  underline: 'underlined text',
}

export type RichTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  value: string
  onValueChange: (value: string) => void
  onChange?: TextareaHTMLAttributes<HTMLTextAreaElement>['onChange']
  toolbarClassName?: string
  textareaClassName?: string
  hideToolbar?: boolean
  toolbarLabel?: string
}

export const RichTextarea = forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  function RichTextarea(
    {
      value,
      onValueChange,
      onChange,
      onKeyDown,
      toolbarClassName,
      textareaClassName,
      hideToolbar = false,
      toolbarLabel,
      className,
      ...rest
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, [])

    const applyFormat = useCallback(
      (format: ToolbarFormat) => {
        const el = innerRef.current
        if (!el) return
        const marker = FORMAT_MARKERS[format]
        const start = el.selectionStart ?? 0
        const end = el.selectionEnd ?? start
        const before = value.slice(0, start)
        const selected = value.slice(start, end)
        const after = value.slice(end)

        // Toggle off when selection itself is wrapped: "**text**"
        if (
          selected.length >= marker.length * 2 &&
          selected.startsWith(marker) &&
          selected.endsWith(marker)
        ) {
          const stripped = selected.slice(marker.length, selected.length - marker.length)
          const next = `${before}${stripped}${after}`
          onValueChange(next)
          requestAnimationFrame(() => {
            el.focus()
            const newStart = before.length
            el.setSelectionRange(newStart, newStart + stripped.length)
          })
          return
        }

        // Toggle off when caret/selection sits between existing markers
        if (selected && before.endsWith(marker) && after.startsWith(marker)) {
          const next =
            `${before.slice(0, before.length - marker.length)}` +
            selected +
            after.slice(marker.length)
          onValueChange(next)
          requestAnimationFrame(() => {
            el.focus()
            const newStart = before.length - marker.length
            el.setSelectionRange(newStart, newStart + selected.length)
          })
          return
        }

        const placeholder = selected || FORMAT_PLACEHOLDERS[format]
        const next = `${before}${marker}${placeholder}${marker}${after}`
        onValueChange(next)
        requestAnimationFrame(() => {
          el.focus()
          const newStart = before.length + marker.length
          const newEnd = newStart + placeholder.length
          el.setSelectionRange(newStart, newEnd)
        })
      },
      [onValueChange, value],
    )

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (key === 'b') {
        event.preventDefault()
        applyFormat('bold')
      } else if (key === 'i') {
        event.preventDefault()
        applyFormat('italic')
      } else if (key === 'u') {
        event.preventDefault()
        applyFormat('underline')
      }
    }

    const mergedClassName = [className, textareaClassName].filter(Boolean).join(' ').trim()

    return (
      <div className="flex w-full flex-col gap-1">
        {hideToolbar ? null : (
          <div
            className={`flex items-center gap-1 ${toolbarClassName ?? ''}`.trim()}
            role="toolbar"
            aria-label={toolbarLabel ?? 'Text formatting'}
          >
            <ToolbarButton onPress={() => applyFormat('bold')} label="Bold" shortcut="Ctrl+B">
              <Bold className="h-3 w-3" />
            </ToolbarButton>
            <ToolbarButton onPress={() => applyFormat('italic')} label="Italic" shortcut="Ctrl+I">
              <Italic className="h-3 w-3" />
            </ToolbarButton>
            <ToolbarButton
              onPress={() => applyFormat('underline')}
              label="Underline"
              shortcut="Ctrl+U"
            >
              <Underline className="h-3 w-3" />
            </ToolbarButton>
          </div>
        )}
        <textarea
          {...rest}
          ref={innerRef}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value)
            onChange?.(event)
          }}
          onKeyDown={handleKeyDown}
          className={mergedClassName}
        />
      </div>
    )
  },
)

type ToolbarButtonProps = {
  children: React.ReactNode
  onPress: () => void
  label: string
  shortcut: string
}

function ToolbarButton({ children, onPress, label, shortcut }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={`${label} (${shortcut})`}
      aria-label={`${label} (${shortcut})`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border-soft bg-bg-surface text-text-secondary transition-colors hover:border-accent-border hover:text-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
    >
      {children}
    </button>
  )
}
