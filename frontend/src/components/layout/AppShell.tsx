import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '@/components/ui/ToastNotification'
import ScanlineOverlay from '@/components/ui/ScanlineOverlay'
import HudFrame from '@/components/ui/HudFrame'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { tacticalReveal } from '@/lib/motion'

export default function AppShell() {
  const location = useLocation()
  const token = useAuthStore(s => s.token)

  useEffect(() => {
    if (!token) return
    const id = setInterval(() => { api.get('/auth/me').catch(() => {}) }, 10_000)
    return () => clearInterval(id)
  }, [token])

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="tactical-backdrop" />
      <ScanlineOverlay />
      <HudFrame />
      <div className="relative z-10 flex flex-1 min-w-0 overflow-hidden">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={tacticalReveal.initial}
              animate={tacticalReveal.animate}
              exit={tacticalReveal.exit}
              transition={tacticalReveal.transition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          </main>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
