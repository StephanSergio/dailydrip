import { useEffect, useState } from 'react'
import { fetchHistory } from '../lib/wardrobe'
import { useWardrobe } from '../context/WardrobeContext'
import type { HistoryEntry, Outfit, OutfitSlot, WardrobeItem } from '../types'

const SLOTS: OutfitSlot[] = [
  'bottoms',
  'top',
  'outerwear',
  'footwear',
  'headwear',
  'bag',
  'jewellery',
  'fragrance',
]

const modeLabel: Record<string, string> = {
  lifestyle: 'Lifestyle',
  sport: 'Sport',
  beach: 'Beach',
}

export default function History() {
  const { items } = useWardrobe()
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
      .then(setEntries)
      .catch((e) => {
        console.error(e)
        setError('Could not load history.')
      })
  }, [])

  const byId: Record<string, WardrobeItem> = {}
  for (const it of items) byId[it.id] = it

  const fmtDate = (entry: HistoryEntry) => {
    if (entry.date) return entry.date
    const ts = entry.createdAt?.toDate?.()
    return ts ? ts.toISOString().slice(0, 10) : ''
  }

  const photosFor = (selected: Outfit | undefined) =>
    SLOTS.map((s) => selected?.[s])
      .filter((id): id is string => Boolean(id))
      .map((id) => byId[id])
      .filter((it): it is WardrobeItem => Boolean(it?.photoURL))

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <h1 className="mb-4 text-base font-semibold">History</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {entries === null ? (
        <p className="text-sm text-[#9ca3af]">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#9ca3af]">No drips yet — build your first</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const photos = photosFor(entry.selected)
            return (
              <div key={entry.id} className="rounded-card border border-[#e5e7eb] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{fmtDate(entry)}</span>
                  <span className="rounded-full bg-indigo px-2.5 py-0.5 text-[11px] font-medium text-white">
                    {modeLabel[entry.mode] || entry.mode}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {entry.occasion && (
                    <span className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-[11px] text-[#6b7280]">
                      {entry.occasion}
                    </span>
                  )}
                  {entry.mood && (
                    <span className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-[11px] text-[#6b7280]">
                      {entry.mood}
                    </span>
                  )}
                  {entry.weather && (
                    <span className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-[11px] text-[#6b7280]">
                      {entry.weather}
                    </span>
                  )}
                </div>
                {photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((it) => (
                      <img
                        key={it.id}
                        src={it.photoURL}
                        alt={it.name}
                        className="h-16 w-16 flex-none rounded-lg border border-[#e5e7eb] object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
