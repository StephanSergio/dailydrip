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

const WARDROBE = 'wardrobe'
const HISTORY = 'outfitHistory'

export async function fetchWardrobe() {
  const snap = await getDocs(collection(db, WARDROBE))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addItem(item) {
  const ref = await addDoc(collection(db, WARDROBE), {
    ...item,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...item }
}

export async function updateItem(id, item) {
  await updateDoc(doc(db, WARDROBE, id), item)
  return { id, ...item }
}

// Deletes the Firestore doc AND the Storage file together.
export async function deleteItem(item) {
  await deletePhoto(item.photoPath)
  await deleteDoc(doc(db, WARDROBE, item.id))
}

export async function saveOutfitToHistory(entry) {
  await addDoc(collection(db, HISTORY), {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

export async function fetchHistory() {
  const q = query(
    collection(db, HISTORY),
    orderBy('createdAt', 'desc'),
    limit(7),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
