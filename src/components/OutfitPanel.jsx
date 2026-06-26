import ItemCard from './ItemCard'

const SLOTS = [
  'bottoms',
  'top',
  'outerwear',
  'footwear',
  'headwear',
  'bag',
  'jewellery',
  'fragrance',
]

// outfit: { bottoms, top, ..., explanation } where each slot is a documentId
// or null. byId: Map/object of id -> wardrobe item.
export default function OutfitPanel({ header, outfit, byId }) {
  if (!outfit) return null

  const cards = SLOTS.map((slot) => outfit[slot])
    .filter((id) => id)
    .map((id) => byId[id])
    .filter(Boolean)

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
