import { NavLink } from 'react-router-dom'
import { House, Shirt, Clock } from 'lucide-react'

const items = [
  { to: '/', Icon: House, label: 'Today', end: true },
  { to: '/wardrobe', Icon: Shirt, label: 'Wardrobe' },
  { to: '/history', Icon: Clock, label: 'History' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[#e5e7eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                isActive ? 'text-indigo' : 'text-[#9ca3af]'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
