// Wardrobe taxonomy: group -> category -> subcategories[]
// Mirrors the spec exactly. Used to drive the dynamic dropdowns in the
// wardrobe form and the category tabs in the wardrobe manager.

export const GROUPS = {
  Bottoms: {
    pants: ['chino', 'jeans', 'jogger', 'cargo', 'trousers'],
    shorts: ['chino short', 'casual short'],
    swimwear: ['swim short', 'boardshort', 'trunk'],
    sportbottoms: ['compression tight', 'training short', 'jogger'],
  },
  Tops: {
    tshirt: ['crew neck', 'graphic tee', 'longsleeved'],
    tanktop: ['muscle fit', 'ribbed', 'casual'],
    henley: ['short sleeve', 'long sleeve'],
    polo: ['classic polo', 'button-down polo', 'knitted polo'],
    shirt: ['dress shirt', 'overshirt', 'linen shirt', 'camp collar', 'Cuban collar'],
    turtleneck: ['roll neck', 'mock neck', 'slim fit'],
    knitwear: ['knitted vest', 'crewneck knit', 'zip knit'],
    sporttop: ['compression top', 'training shirt', 'tank'],
  },
  Outerwear: {
    sweater: ['hoodie', 'crewneck sweat', 'zip-up'],
    jacket: ['bomber', 'coach jacket', 'blazer', 'puffer', 'denim jacket'],
    coat: ['overcoat', 'trench', 'wool coat', 'leather coat'],
    rainjacket: ['windbreaker', 'shell', 'gore-tex', 'packable'],
  },
  Footwear: {
    sneakers: ['low top', 'high top', 'runner', 'training shoe', 'dress sneaker'],
    dressshoes: ['oxford', 'derby', 'loafer', 'monk strap'],
    boots: ['chelsea boot', 'chukka', 'combat', 'work boot', 'dress boot'],
  },
  Headwear: {
    cap: ['dad cap', 'snapback', 'bucket hat', 'trucker'],
    beanie: ['ribbed beanie', 'slouch beanie', 'pom beanie'],
  },
  Bags: {
    bag: ['tote', 'backpack', 'crossbody', 'weekender', 'messenger'],
  },
  Jewellery: {
    jewellery: ['chain', 'ring', 'bracelet', 'earring', 'pendant'],
  },
  Fragrance: {
    fragrance: ['fresh', 'woody', 'spicy', 'sweet', 'aquatic'],
  },
}

export const GROUP_NAMES = Object.keys(GROUPS)

export const STYLE_TAGS = [
  'casual',
  'smart-casual',
  'sporty',
  'going-out',
  'formal',
  'sport',
  'beach',
]

// Common color palette for the multi-select chips. Lean toward the base
// palette plus the earth tones / clean brights that suit the user.
export const COLORS = [
  { name: 'white', hex: '#ffffff' },
  { name: 'grey', hex: '#9ca3af' },
  { name: 'navy', hex: '#1e293b' },
  { name: 'black', hex: '#111111' },
  { name: 'camel', hex: '#c19a6b' },
  { name: 'rust', hex: '#b7410e' },
  { name: 'olive', hex: '#556b2f' },
  { name: 'forest green', hex: '#228b22' },
  { name: 'burgundy', hex: '#800020' },
  { name: 'cobalt', hex: '#0047ab' },
  { name: 'coral', hex: '#ff7f50' },
  { name: 'brown', hex: '#6b4423' },
  { name: 'beige', hex: '#e8dcc4' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'red', hex: '#ef4444' },
  { name: 'green', hex: '#22c55e' },
]

export const colorHex = (name) => {
  const c = COLORS.find((x) => x.name.toLowerCase() === String(name).toLowerCase())
  return c ? c.hex : '#d1d5db'
}

export const categoriesForGroup = (group) =>
  group && GROUPS[group] ? Object.keys(GROUPS[group]) : []

export const subcategoriesFor = (group, category) =>
  group && category && GROUPS[group] && GROUPS[group][category]
    ? GROUPS[group][category]
    : []

// Map a category back to its group (categories are unique enough across
// groups except "jogger" lives under two — bottoms wins, which is fine for
// display tabs).
export const groupForCategory = (category) => {
  for (const g of GROUP_NAMES) {
    if (GROUPS[g][category]) return g
  }
  return null
}

// Wardrobe manager tabs, in display order. "All" first, then every category.
export const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pants', label: 'Pants' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'swimwear', label: 'Swimwear' },
  { key: 'sportbottoms', label: 'Sport Bottoms' },
  { key: 'tshirt', label: 'T-shirt' },
  { key: 'tanktop', label: 'Tank' },
  { key: 'henley', label: 'Henley' },
  { key: 'polo', label: 'Polo' },
  { key: 'shirt', label: 'Shirt' },
  { key: 'turtleneck', label: 'Turtleneck' },
  { key: 'knitwear', label: 'Knitwear' },
  { key: 'sporttop', label: 'Sport Top' },
  { key: 'sweater', label: 'Sweater' },
  { key: 'jacket', label: 'Jacket' },
  { key: 'coat', label: 'Coat' },
  { key: 'rainjacket', label: 'Rain Jacket' },
  { key: 'sneakers', label: 'Sneakers' },
  { key: 'dressshoes', label: 'Dress Shoes' },
  { key: 'boots', label: 'Boots' },
  { key: 'cap', label: 'Caps' },
  { key: 'beanie', label: 'Beanies' },
  { key: 'bag', label: 'Bags' },
  { key: 'jewellery', label: 'Jewellery' },
  { key: 'fragrance', label: 'Fragrance' },
]
