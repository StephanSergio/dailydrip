import { colorHex } from '../lib/categories'
import type { WardrobeItem } from '../types'

interface ItemCardProps {
  item: WardrobeItem | null | undefined
  onClick?: () => void
}

// A photo-first wardrobe item card. Used in the wardrobe grid and the outfit
// result panels.
export default function ItemCard({ item, onClick }: ItemCardProps) {
  if (!item) return null
  return (
    <div
      className={`overflow-hidden rounded-card border border-[#e5e7eb] bg-white ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
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
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">
          {item.category}
        </div>
        <div className="text-sm font-medium leading-tight text-ink">{item.name}</div>
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
      </div>
    </div>
  )
}
