import { useState, useMemo, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import {
  GROUP_NAMES,
  categoriesForGroup,
  subcategoriesFor,
  COLORS,
  STYLE_TAGS,
  groupForCategory,
  colorHex,
} from '../lib/categories'
import { uploadPhoto, validateImage } from '../lib/image'
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
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(existing?.photoURL || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => categoriesForGroup(form.group), [form.group])
  const subcategories = useMemo(
    () => subcategoriesFor(form.group, form.category),
    [form.group, form.category],
  )

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
    setPreview(URL.createObjectURL(f))
  }

  const canSave =
    Boolean(form.name.trim()) &&
    Boolean(form.group) &&
    Boolean(form.category) &&
    Boolean(form.subcategory) &&
    (isEdit || Boolean(file))

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
      if (file) {
        photo = await uploadPhoto(file)
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

      if (isEdit && existing) {
        await updateItem(existing.id, payload)
      } else {
        await addItem(payload)
      }
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
          <label className="block">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
              Photo
            </div>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-card border border-[#e5e7eb] bg-[#f3f4f6]">
                {preview && (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                )}
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo px-4 py-2 text-sm text-indigo">
                <Upload size={20} strokeWidth={1.5} />
                {preview ? 'Replace' : 'Upload'}
              </span>
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            </div>
            {isEdit && (
              <p className="mt-1 text-[11px] text-[#9ca3af]">
                Leave empty to keep the current photo.
              </p>
            )}
          </label>

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
