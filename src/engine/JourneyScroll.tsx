import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ProgressContext, progressAtScroll, setScrollGeometry, type Progress } from './journeyProgress'

/** Longest step one frame may take; stops a jump after the page has sat idle. */
const MAX_FRAME_SECONDS = 1 / 30

type JourneyScrollProps = {
  /** Screens of scrolling for the travel itself, pauses not included. */
  pages: number
  /** Seconds the camera takes to catch up with the scrollbar. */
  damping: number
  /** Progress values (0–1) where the journey pauses for the reader (design doc §12 Q8). */
  stops?: ReadonlyArray<number>
  /** Scroll length of each pause, in CSS pixels. About one mouse-wheel notch: the scroll
   *  that arrives lands on the stop and holds; the next one moves past. */
  pausePx?: number
  /** Screens of scroll before the journey starts (a landing screen). Progress holds at 0. */
  introScreens?: number
  children: ReactNode
}

// Turns the page's own scrollbar into journey progress. The page is made tall
// enough for the travel plus every pause, and the canvas stays fixed behind it
// (see index.css). Works with frameloop="demand": a scroll asks for a frame, and
// frames keep coming only until the easing has caught up.
export function JourneyScroll({ pages, damping, stops = [], pausePx = 110, introScreens = 0, children }: JourneyScrollProps) {
  const progress = useRef<Progress>({ offset: 0, target: 0 })
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const sorted = [...stops].sort((a, b) => a - b)
    const spacer = document.createElement('div')
    spacer.style.height = `calc(${(pages + introScreens) * 100}vh + ${sorted.length * pausePx}px)`
    document.body.appendChild(spacer)
    const onScroll = () => {
      const intro = introScreens * window.innerHeight
      const max = document.documentElement.scrollHeight - window.innerHeight
      const travelPx = Math.max(max - intro - sorted.length * pausePx, 1)
      setScrollGeometry({ intro, travelPx, stops: sorted, pausePx })
      progress.current.target = progressAtScroll(Math.max(window.scrollY - intro, 0), travelPx, sorted, pausePx)
      invalidate()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      spacer.remove()
    }
  }, [pages, stops, pausePx, introScreens, invalidate])

  useFrame((_, delta) => {
    const p = progress.current
    const step = Math.min(delta, MAX_FRAME_SECONDS)
    p.offset += (p.target - p.offset) * (1 - Math.exp(-step / damping))
    if (Math.abs(p.target - p.offset) > 1e-5) invalidate()
    else p.offset = p.target
  })

  return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
}
