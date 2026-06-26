import type { SelectorOption } from '../lib/options'

interface SelectorRowProps {
  label: string
  options: SelectorOption[]
  value: string | null
  onChange: (key: string) => void
  spread?: boolean
}

// A horizontal snap-scroll row of icon+label selector pills. When `spread` is
// set the options fill the full width instead of scrolling (used for moods).
export default function SelectorRow({
  label,
  options,
  value,
  onChange,
  spread = false,
}: SelectorRowProps) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
        {label}
      </div>
      <div className={spread ? 'flex gap-2' : 'snap-row'}>
        {options.map(({ key, label: optLabel, Icon }) => {
          const selected = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-card border px-3 py-2 text-xs transition-colors ${
                spread ? 'flex-1' : ''
              } ${
                selected
                  ? 'border-indigo bg-indigo text-white'
                  : 'border-[#e5e7eb] bg-white text-ink'
              }`}
              aria-pressed={selected}
            >
              <Icon size={20} strokeWidth={1.5} color={selected ? '#ffffff' : '#111111'} />
              <span className="whitespace-nowrap">{optLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
