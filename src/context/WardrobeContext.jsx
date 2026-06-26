import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  fetchWardrobe,
  addItem as addItemDb,
  updateItem as updateItemDb,
  deleteItem as deleteItemDb,
} from '../lib/wardrobe'

const WardrobeContext = createContext(null)

export function WardrobeProvider({ children }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWardrobe()
      setItems(data)
      setLoaded(true)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Could not load wardrobe')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load once on mount, then serve from state (cached).
  useEffect(() => {
    load()
  }, [load])

  const addItem = useCallback(async (item) => {
    const saved = await addItemDb(item)
    setItems((prev) => [...prev, saved])
    return saved
  }, [])

  const updateItem = useCallback(async (id, item) => {
    const saved = await updateItemDb(id, item)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...saved } : i)))
    return saved
  }, [])

  const removeItem = useCallback(async (item) => {
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

export function useWardrobe() {
  const ctx = useContext(WardrobeContext)
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider')
  return ctx
}
