'use client'

import { useEffect, useRef } from 'react'

export default function EmotionCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js'
    script.async = true

    const soundScript = document.createElement('script')
    soundScript.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/addons/p5.sound.min.js'
    soundScript.async = true

    const sketchScript = document.createElement('script')
    sketchScript.src = '/sketch.js'
    sketchScript.async = true

    document.body.appendChild(script)
    document.body.appendChild(soundScript)
    document.body.appendChild(sketchScript)

    return () => {
      document.body.removeChild(script)
      document.body.removeChild(soundScript)
      document.body.removeChild(sketchScript)
    }
  }, [])

  return <div ref={canvasRef} />
}
