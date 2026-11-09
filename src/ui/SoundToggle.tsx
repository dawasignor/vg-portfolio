import { useEffect, useRef, useState } from 'react'
import type { StopNode } from '../engine/journey'
import { useStopState } from '../engine/stopStore'
import { useLandingFade } from './landing'

const VOLUME = 0.6
const FADE_MS = 800

// Ambient sound (design doc §12 Q7): each stop names a file under public/audio/,
// and it loops from that stop until the next one. Off until the reader turns it
// on (browsers block sound that starts by itself anyway). A missing file just
// means silence, so the slots can be filled in one recording at a time.
export function SoundToggle({ nodes }: { nodes: ReadonlyArray<StopNode> }) {
  const { region } = useStopState()
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)

  const src = nodes.find((n) => n.id === region)?.sound
  const landed = useLandingFade() >= 1

  useEffect(() => {
    if (!on || !src) return
    const next = new Audio(`${import.meta.env.BASE_URL}${src}`)
    next.loop = true
    next.volume = 0
    next.play().catch(() => {}) // missing file or blocked: stay silent
    const previous = audio.current
    audio.current = next

    // Crossfade: the new loop rises while the old one falls away.
    const started = performance.now()
    const timer = window.setInterval(() => {
      const k = Math.min((performance.now() - started) / FADE_MS, 1)
      next.volume = VOLUME * k
      if (previous) previous.volume = VOLUME * (1 - k)
      if (k === 1) {
        window.clearInterval(timer)
        previous?.pause()
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [on, src])

  useEffect(() => {
    if (!on) {
      audio.current?.pause()
      audio.current = null
    }
  }, [on])

  if (!landed) return null
  return (
    <button type="button" className="sound-toggle" onClick={() => setOn((v) => !v)} aria-pressed={on}>
      {on ? '♪ Sound on' : '♪ Sound off'}
    </button>
  )
}
