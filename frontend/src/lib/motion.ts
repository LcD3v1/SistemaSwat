export const DURATION = {
  fast: 0.15,
  base: 0.2,
  page: 0.22,
} as const

export const EASE_SHARP = [0.4, 0, 0.2, 1] as const

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_SHARP } },
}

export const tacticalReveal = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: { duration: DURATION.page, ease: EASE_SHARP },
}
