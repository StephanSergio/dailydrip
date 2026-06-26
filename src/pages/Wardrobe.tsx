import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { TABS, colorHex } from '../lib/categories'
import { useWardrobe } from '../context/WardrobeContext'
import WardrobeForm from '../components/WardrobeForm'
import type { WardrobeItem } from '../types'

export default function Wardrobe() {
  const { items, loading, removeItem } = useWardrobe()
  const [tab, setTab] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WardrobeItem | null>(null)
  const [confirmItem, setConfirmItem] = useState<WardrobeItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((i) => i.category === tab)),
    [items, tab],
  )

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (item: WardrobeItem) => {
    setEditing(item)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!confirmItem) return
    setDeleting(true)
    try {
      await removeItem(confirmItem)
      setConfirmItem(null)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pb-28">
      {/* Sticky category tabs */}
      <div className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
        <div className="snap-row px-4 py-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs ${
                tab === t.key
                  ? 'border-indigo bg-indigo text-white'
                  : 'border-[#e5e7eb] text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-card border border-[#e5e7eb]">
                <div className="skeleton aspect-square w-full" />
                <div className="space-y-2 p-2.5">
                  <div className="skeleton h-2 w-1/3 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#9ca3af]">
            Nothing here yet — tap + to add an item.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-card border border-[#e5e7eb] bg-white"
              >
                {item.photoURL ? (
                  <img
                    src={item.photoURL}
                    alt={item.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-square w-full bg-[#f3f4f6]" />
                )}
                <div className="space-y-1 p-2.5">
                  <div className="text-sm font-medium leading-tight text-ink">{item.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-[#9ca3af]">
                    {item.subcategory}
                  </div>
                  {item.colors?.length > 0 && (
                    <div className="flex items-center gap-1 pt-0.5">
                      {item.colors.map((c) => (
                        <span
                          key={c}
                          title={c}
                          className="h-3 w-3 rounded-full border border-[#e5e7eb]"
                          style={{ backgroundColor: colorHex(c) }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-[#6b7280]"
                      aria-label="Edit"
                    >
                      <Pencil size={20} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmItem(item)}
                      className="text-[#6b7280]"
                      aria-label="Delete"
                    >
                      <Trash2 size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add FAB */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-lg"
        aria-label="Add item"
      >
        <Plus size={20} strokeWidth={1.5} />
      </button>

      {formOpen && <WardrobeForm existing={editing} onClose={() => setFormOpen(false)} />}

      {/* Delete confirm */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => !deleting && setConfirmItem(null)}
        >
          <div
            className="w-full max-w-xs rounded-card bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-ink">
              Delete <span className="font-medium">{confirmItem.name}</span>? This removes the photo
              too.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                disabled={deleting}
                className="flex-1 rounded-full border border-[#e5e7eb] py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
