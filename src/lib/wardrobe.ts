import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { deletePhoto } from './image'
import type { WardrobeItem, WardrobeItemInput, HistoryEntry, Outfit, Mode } from '../types'

const WARDROBE = 'wardrobe'
const HISTORY = 'outfitHistory'

export async function fetchWardrobe(): Promise<WardrobeItem[]> {
  const snap = await getDocs(collection(db, WARDROBE))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WardrobeItem, 'id'>) }))
}

export async function addItem(item: WardrobeItemInput): Promise<WardrobeItem> {
  const ref = await addDoc(collection(db, WARDROBE), {
    ...item,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...item }
}

export async function updateItem(
  id: string,
  item: WardrobeItemInput,
): Promise<WardrobeItem> {
  await updateDoc(doc(db, WARDROBE, id), { ...item })
  return { id, ...item }
}

// Deletes the Firestore doc AND the Storage file together.
export async function deleteItem(item: WardrobeItem): Promise<void> {
  await deletePhoto(item.photoPath)
  await deleteDoc(doc(db, WARDROBE, item.id))
}

export interface OutfitHistoryInput {
  date: string
  mode: Mode
  selected: Outfit
  occasion?: string
  weather?: string
  mood?: string
}

export async function saveOutfitToHistory(entry: OutfitHistoryInput): Promise<void> {
  await addDoc(collection(db, HISTORY), {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const q = query(collection(db, HISTORY), orderBy('createdAt', 'desc'), limit(7))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryEntry, 'id'>) }))
}
