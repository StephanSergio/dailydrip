import { useState, useMemo } from 'react'
import { Loader2, Dumbbell } from 'lucide-react'
import { WEATHER, OCCASIONS, MOODS } from '../lib/options'
import SelectorRow from '../components/SelectorRow'
import OutfitPanel from '../components/OutfitPanel'
import { useWardrobe } from '../context/WardrobeContext'
import { generateOutfits } from '../lib/anthropic'
import { saveOutfitToHistory } from '../lib/wardrobe'

export default function Home() {
  const { items, loading: wardrobeLoading } = useWardrobe()

  const [sportMode, setSportMode] = useState(false)
  const [weather, setWeather] = useState(null)
  const [occasion, setOccasion] = useState(null)
  const [mood, setMood] = useState(null)

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const mode = sportMode ? 'sport' : occasion === 'beach' ? 'beach' : 'lifestyle'

  const ready = sportMode
    ? Boolean(weather && mood)
    : Boolean(weather && occasion && mood)

  const byId = useMemo(() => {
    const map = {}
    for (const it of items) map[it.id] = it
    return map
  }, [items])

  const reset = () => {
    setResult(null)
    setError(null)
  }

  const onToggleSport = () => {
    setSportMode((s) => !s)
    setOccasion(null)
    reset()
  }

  const run = async () => {
    if (!ready || generating) return
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const data = await generateOutfits({
        wardrobe: items,
        mode,
        weather,
        occasion: sportMode ? 'fitness' : occasion,
        mood,
      })
      setResult(data)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Could not build your drip. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  const wearThis = async () => {
    if (!result?.primary || saving) return
    setSaving(true)
    try {
      await saveOutfitToHistory({
        date: new Date().toISOString().slice(0, 10),
        mode: result.mode || mode,
        selected: result.primary,
        occasion: sportMode ? 'fitness' : occasion,
        weather,
        mood,
      })
      setResult(null)
      setError(null)
      setWeather(null)
      setOccasion(null)
      setMood(null)
      setSportMode(false)
    } catch (e) {
      console.error(e)
      setError('Saved outfit failed to record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="mb-4 text-sm font-medium text-[#9ca3af]">DailyDrip</div>

      {/* Sport mode toggle */}
      <button
        type="button"
        onClick={onToggleSport}
        className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          sportMode ? 'border-indigo bg-indigo text-white' : 'border-[#e5e7eb] text-ink'
        }`}
        aria-pressed={sportMode}
      >
        <Dumbbell size={20} strokeWidth={1.5} color={sportMode ? '#ffffff' : '#111111'} />
        Sport mode {sportMode ? 'on' : 'off'}
      </button>

      {/* Step 3: result */}
      {result ? (
        <div className="space-y-6">
          <OutfitPanel header="Today's drip" outfit={result.primary} byId={byId} />

          {result.styleNote && (
            <p className="text-center text-sm italic text-indigo">{result.styleNote}</p>
          )}

          <OutfitPanel header="Backup drip" outfit={result.backup} byId={byId} />

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={run}
              disabled={generating}
              className="w-full rounded-full border border-indigo py-3 text-sm font-medium text-indigo disabled:opacity-40"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={wearThis}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving && <Loader2 size={20} strokeWidth={1.5} className="animate-spin" />}
              Wearing this
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: selectors */}
          <SelectorRow label="Weather" options={WEATHER} value={weather} onChange={setWeather} />
          {!sportMode && (
            <SelectorRow
              label="Occasion"
              options={OCCASIONS}
              value={occasion}
              onChange={(v) => {
                setOccasion(v)
                reset()
              }}
            />
          )}
          <SelectorRow label="Mood" options={MOODS} value={mood} onChange={setMood} spread />

          {error && <p className="text-sm text-red-600">{error}</p>}

          {!wardrobeLoading && items.length === 0 && (
            <p className="text-sm text-[#6b7280]">
              Your wardrobe is empty — add a few items first so DailyDrip has something to style.
            </p>
          )}

          {/* Step 2: loading / CTA */}
          {generating ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#9ca3af]">
              <Loader2 size={20} strokeWidth={1.5} className="animate-spin" />
              Finding your drip...
            </div>
          ) : (
            <button
              type="button"
              onClick={run}
              disabled={!ready || items.length === 0}
              className="w-full rounded-full bg-indigo py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {sportMode ? 'Build my sport drip' : 'Build my drip'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
