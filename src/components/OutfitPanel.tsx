import ItemCard from './ItemCard'
import type { Outfit, OutfitSlot, WardrobeItem } from '../types'

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

interface OutfitPanelProps {
  header: string
  outfit: Outfit | null | undefined
  byId: Record<string, WardrobeItem>
}

// outfit: { bottoms, top, ..., explanation } where each slot is a documentId
// or null. byId: object of id -> wardrobe item.
export default function OutfitPanel({ header, outfit, byId }: OutfitPanelProps) {
  if (!outfit) return null

  const cards = SLOTS.map((slot) => outfit[slot])
    .filter((id): id is string => Boolean(id))
    .map((id) => byId[id])
    .filter((it): it is WardrobeItem => Boolean(it))

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-ink">{header}</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      {outfit.explanation && (
        <p className="mt-3 text-sm italic leading-relaxed text-[#6b7280]">
          {outfit.explanation}
        </p>
      )}
    </section>
  )
}
