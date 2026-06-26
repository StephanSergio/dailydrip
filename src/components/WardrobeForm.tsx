import { useState, useMemo, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { X, Upload, Link2, Loader2 } from 'lucide-react'
import {
  GROUP_NAMES,
  categoriesForGroup,
  subcategoriesFor,
  COLORS,
  STYLE_TAGS,
  groupForCategory,
  colorHex,
} from '../lib/categories'
import { uploadPhoto, importImageFromUrl, validateImage } from '../lib/image'
import { useWardrobe } from '../context/WardrobeContext'
import type { WardrobeItem } from '../types'

interface WardrobeFormProps {
  existing?: WardrobeItem | null
  onClose: () => void
}

interface FormState {
  name: string
  group: string
  category: string
  subcategory: string
  colors: string[]
  style: string[]
}

type PhotoMode = 'upload' | 'url'

const blank: FormState = {
  name: '',
  group: '',
  category: '',
  subcategory: '',
  colors: [],
  style: [],
}

export default function WardrobeForm({ existing, onClose }: WardrobeFormProps) {
  const { addItem, updateItem } = useWardrobe()
  const isEdit = Boolean(existing)

  const [form, setForm] = useState<FormState>(() => {
    if (!existing) return blank
    return {
      name: existing.name || '',
      group: existing.group || groupForCategory(existing.category) || '',
      category: existing.category || '',
      subcategory: existing.subcategory || '',
      colors: existing.colors || [],
      style: existing.style || [],
    }
  })

  // Photo can come from a file upload or a pasted web URL.
  const [photoMode, setPhotoMode] = useState<PhotoMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [urlBroken, setUrlBroken] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => categoriesForGroup(form.group), [form.group])
  const subcategories = useMemo(
    () => subcategoriesFor(form.group, form.category),
    [form.group, form.category],
  )

  // What to show in the preview box, by mode.
  const preview =
    photoMode === 'url' ? url.trim() || existing?.photoURL || null : filePreview || existing?.photoURL || null

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const onGroup = (group: string) => set({ group, category: '', subcategory: '' })
  const onCategory = (category: string) => set({ category, subcategory: '' })

  const toggle = (key: 'colors' | 'style', value: string) =>
    set({
      [key]: form[key].includes(value)
        ? form[key].filter((v) => v !== value)
        : [...form[key], value],
    })

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const err = validateImage(f)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  // Photo is optional — the stylist only uses item text, so an item can be
  // saved with just a description.
  const canSave =
    Boolean(form.name.trim()) &&
    Boolean(form.group) &&
    Boolean(form.category) &&
    Boolean(form.subcategory)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    try {
      let photo = {
        photoURL: existing?.photoURL || '',
        photoPath: existing?.photoPath || '',
      }
      if (photoMode === 'upload' && file) {
        photo = await withTimeout(
          uploadPhoto(file),
          25000,
          "Photo upload timed out. Is Firebase Storage enabled and are the Storage rules published?",
        )
      } else if (photoMode === 'url' && url.trim()) {
        photo = await importImageFromUrl(url)
      }

      const payload = {
        name: form.name.trim(),
        group: form.group,
        category: form.category,
        subcategory: form.subcategory,
        colors: form.colors,
        style: form.style,
        photoURL: photo.photoURL,
        photoPath: photo.photoPath,
      }

      await withTimeout(
        isEdit && existing ? updateItem(existing.id, payload) : addItem(payload),
        25000,
        "Saving timed out. Is the Firestore database created and are the rules published?",
      )
      onClose()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Could not save item')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
          <h2 className="text-base font-semibold">{isEdit ? 'Edit item' : 'Add item'}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Photo */}
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
              Photo <span className="lowercase text-[#9ca3af]">(optional)</span>
            </div>

            {/* Upload / URL segmented toggle */}
            <div className="mb-3 inline-flex rounded-full border border-[#e5e7eb] p-0.5">
              <SegBtn
                active={photoMode === 'upload'}
                onClick={() => {
                  setPhotoMode('upload')
                  setError(null)
                }}
              >
                <Upload size={20} strokeWidth={1.5} />
                Upload
              </SegBtn>
              <SegBtn
                active={photoMode === 'url'}
                onClick={() => {
                  setPhotoMode('url')
                  setError(null)
                }}
              >
                <Link2 size={20} strokeWidth={1.5} />
                Image URL
              </SegBtn>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-20 w-20 flex-none overflow-hidden rounded-card border border-[#e5e7eb] bg-[#f3f4f6]">
                {preview && !urlBroken && (
                  <img
                    src={preview}
                    alt="preview"
                    className="h-full w-full object-cover"
                    onError={() => photoMode === 'url' && setUrlBroken(true)}
                  />
                )}
              </div>

              {photoMode === 'upload' ? (
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo px-4 py-2 text-sm text-indigo">
                    <Upload size={20} strokeWidth={1.5} />
                    {filePreview ? 'Replace' : 'Choose photo'}
                  </span>
                  <input type="file" accept="image/*" onChange={onFile} className="hidden" />
                </label>
              ) : (
                <div className="flex-1">
                  <input
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setUrlBroken(false)
                    }}
                    placeholder="https://…/image.jpg"
                    className="w-full rounded-card border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-indigo"
                  />
                  <p className="mt-1 text-[11px] text-[#9ca3af]">
                    Paste a direct link to an image (e.g. from a product page).
                  </p>
                  {urlBroken && (
                    <p className="mt-1 text-[11px] text-red-600">
                      That image didn't load — check the link.
                    </p>
                  )}
                </div>
              )}
            </div>

            {isEdit && (
              <p className="mt-2 text-[11px] text-[#9ca3af]">
                Leave the photo untouched to keep the current one.
              </p>
            )}
          </div>

          {/* Name */}
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Camel overshirt"
              className="w-full rounded-card border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-indigo"
            />
          </Field>

          {/* Group */}
          <Field label="Group">
            <Select value={form.group} onChange={(e) => onGroup(e.target.value)}>
              <option value="">Select group</option>
              {GROUP_NAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>

          {/* Category */}
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => onCategory(e.target.value)}
              disabled={!form.group}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          {/* Subcategory */}
          <Field label="Subcategory">
            <Select
              value={form.subcategory}
              onChange={(e) => set({ subcategory: e.target.value })}
              disabled={!form.category}
            >
              <option value="">Select subcategory</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          {/* Colors */}
          <Field label="Colors">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const selected = form.colors.includes(c.name)
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggle('colors', c.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                      selected ? 'border-indigo bg-indigo text-white' : 'border-[#e5e7eb] text-ink'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-[#e5e7eb]"
                      style={{ backgroundColor: colorHex(c.name) }}
                    />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Style tags */}
          <Field label="Style tags">
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map((tag) => {
                const selected = form.style.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle('style', tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      selected ? 'border-indigo bg-indigo text-white' : 'border-[#e5e7eb] text-ink'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div className="border-t border-[#e5e7eb] p-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSave || saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving && <Loader2 size={20} strokeWidth={1.5} className="animate-spin" />}
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add to wardrobe'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Reject if a promise doesn't settle in time, so a save can't hang forever.
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-indigo text-white' : 'text-[#6b7280]'
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
        {label}
      </div>
      {children}
    </div>
  )
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-card border border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-indigo disabled:opacity-50"
    >
      {children}
    </select>
  )
}
