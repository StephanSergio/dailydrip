// Selector options for the home screen, each with a Lucide icon component.
import {
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  Flame,
  Wind,
  Dumbbell,
  Briefcase,
  Wine,
  Coffee,
  Plane,
  Music2,
  Heart,
  Utensils,
  Waves,
  Layers,
  Mountain,
  Sparkles,
  Leaf,
  Zap,
  Minus,
  Moon,
} from 'lucide-react'

export const WEATHER = [
  { key: 'sunny', label: 'Sunny', Icon: Sun },
  { key: 'cloudy', label: 'Cloudy', Icon: Cloud },
  { key: 'rainy', label: 'Rainy', Icon: CloudRain },
  { key: 'cold', label: 'Cold', Icon: Thermometer },
  { key: 'hot', label: 'Hot', Icon: Flame },
  { key: 'windy', label: 'Windy', Icon: Wind },
]

export const OCCASIONS = [
  { key: 'fitness', label: 'Fitness', Icon: Dumbbell },
  { key: 'work', label: 'Work', Icon: Briefcase },
  { key: 'going-out', label: 'Going out', Icon: Wine },
  { key: 'lounge', label: 'Lounge', Icon: Coffee },
  { key: 'travel', label: 'Travel', Icon: Plane },
  { key: 'salsa-dancing', label: 'Salsa', Icon: Music2 },
  { key: 'date-night', label: 'Date night', Icon: Heart },
  { key: 'brunch', label: 'Brunch', Icon: Utensils },
  { key: 'beach', label: 'Beach', Icon: Waves },
  { key: 'smart-casual', label: 'Smart casual', Icon: Layers },
  { key: 'hiking', label: 'Hiking', Icon: Mountain },
  { key: 'party', label: 'Party', Icon: Sparkles },
]

export const MOODS = [
  { key: 'fresh-clean', label: 'Fresh', Icon: Leaf },
  { key: 'bold-loud', label: 'Bold', Icon: Zap },
  { key: 'low-key', label: 'Low-key', Icon: Minus },
  { key: 'cozy', label: 'Cozy', Icon: Moon },
]

// Style context per occasion — fed to Claude alongside the selections.
export const OCCASION_STYLE = {
  fitness: 'sporty, performance, breathable',
  work: 'smart, polished, professional',
  'going-out': 'stylish, night-ready, bold',
  lounge: 'relaxed, comfortable, effortless',
  travel: 'versatile, layered, practical',
  'salsa-dancing': 'elegant, moveable, vibrant',
  'date-night': 'refined, intentional, attractive',
  brunch: 'smart-casual, relaxed chic',
  beach: 'light, casual, airy',
  'smart-casual': 'elevated everyday, neat',
  hiking: 'durable, layered, functional',
  party: 'loud, fun, statement',
}
