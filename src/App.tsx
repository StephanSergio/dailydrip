import { Routes, Route } from 'react-router-dom'
import { WardrobeProvider } from './context/WardrobeContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Wardrobe from './pages/Wardrobe'
import History from './pages/History'

export default function App() {
  return (
    <WardrobeProvider>
      <div className="min-h-dvh bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/history" element={<History />} />
        </Routes>
        <BottomNav />
      </div>
    </WardrobeProvider>
  )
}
