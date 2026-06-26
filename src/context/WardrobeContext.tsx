import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  fetchWardrobe,
  addItem as addItemDb,
  updateItem as updateItemDb,
  deleteItem as deleteItemDb,
} from '../lib/wardrobe'
import type { WardrobeItem, WardrobeItemInput } from '../types'

interface WardrobeContextValue {
  items: WardrobeItem[]
  loading: boolean
  loaded: boolean
  error: string | null
  reload: () => Promise<void>
  addItem: (item: WardrobeItemInput) => Promise<WardrobeItem>
  updateItem: (id: string, item: WardrobeItemInput) => Promise<WardrobeItem>
  removeItem: (item: WardrobeItem) => Promise<void>
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null)

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWardrobe()
      setItems(data)
      setLoaded(true)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Could not load wardrobe')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load once on mount, then serve from state (cached).
  useEffect(() => {
    load()
  }, [load])

  const addItem = useCallback(async (item: WardrobeItemInput) => {
    const saved = await addItemDb(item)
    setItems((prev) => [...prev, saved])
    return saved
  }, [])

  const updateItem = useCallback(async (id: string, item: WardrobeItemInput) => {
    const saved = await updateItemDb(id, item)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...saved } : i)))
    return saved
  }, [])

  const removeItem = useCallback(async (item: WardrobeItem) => {
    await deleteItemDb(item)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }, [])

  return (
    <WardrobeContext.Provider
      value={{ items, loading, loaded, error, reload: load, addItem, updateItem, removeItem }}
    >
      {children}
    </WardrobeContext.Provider>
  )
}

export function useWardrobe(): WardrobeContextValue {
  const ctx = useContext(WardrobeContext)
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider')
  return ctx
}
