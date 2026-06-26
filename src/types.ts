import type { Timestamp } from 'firebase/firestore'

export type Mode = 'lifestyle' | 'sport' | 'beach'

export interface WardrobeItem {
  id: string
  name: string
  group: string
  category: string
  subcategory: string
  colors: string[]
  style: string[]
  photoURL: string
  photoPath: string
  createdAt?: Timestamp
}

// A new/edited item without server-managed fields.
export type WardrobeItemInput = Omit<WardrobeItem, 'id' | 'createdAt'>

export type OutfitSlot =
  | 'bottoms'
  | 'top'
  | 'outerwear'
  | 'footwear'
  | 'headwear'
  | 'bag'
  | 'jewellery'
  | 'fragrance'

export interface Outfit {
  bottoms: string | null
  top: string | null
  outerwear: string | null
  footwear: string | null
  headwear: string | null
  bag: string | null
  jewellery: string | null
  fragrance: string | null
  explanation: string
}

export interface OutfitResult {
  mode: Mode
  primary: Outfit
  backup: Outfit
  styleNote: string
}

export interface HistoryEntry {
  id: string
  date?: string
  mode: Mode
  selected: Outfit
  occasion?: string
  weather?: string
  mood?: string
  createdAt?: Timestamp
}
