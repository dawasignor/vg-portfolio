import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ProgressContext, type Progress } from './journeyProgress'

/** Longest step one frame may take; stops a jump after the page has sat idle. */
const MAX_FRAME_SECONDS = 1 / 30

// Turns the page's own scrollbar into journey progress. The page is made
// `pages` screens tall and the canvas stays fixed behind it (see index.css).
// Works with frameloop="demand": a scroll asks for a frame, and frames keep
// coming only until the easing has caught up.
export function JourneyScroll({ pages, damping, children }: { pages: number; damping: number; children: ReactNode }) {
  const progress = useRef<Progress>({ offset: 0, target: 0 })
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const spacer = document.createElement('div')
    spacer.style.height = `${pages * 100}vh`
    document.body.appendChild(spacer)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.current.target = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
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
  }, [pages, invalidate])

  useFrame((_, delta) => {
    const p = progress.current
    const step = Math.min(delta, MAX_FRAME_SECONDS)
    p.offset += (p.target - p.offset) * (1 - Math.exp(-step / damping))
    if (Math.abs(p.target - p.offset) > 1e-5) invalidate()
    else p.offset = p.target
  })

  return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
}
