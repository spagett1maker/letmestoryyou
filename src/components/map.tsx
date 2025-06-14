'use client'

import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
  targetX: number
  targetY: number
  radius: number
  speed: number
  vibrationPhase: number
  vibrationSpeed: number
  startColor: [number, number, number] // rgb
  endColor: [number, number, number]
  progress: number
}

const emotionColors: [number, number, number][] = [
  [255, 99, 132],   // 분홍
  [54, 162, 235],   // 파랑
  [255, 206, 86],   // 노랑
  [75, 192, 192],   // 청록
  [153, 102, 255],  // 보라
  [255, 159, 64],   // 주황
  [200, 200, 200],  // 회색
  [0, 0, 0]         // 검정
]

export default function MapBG() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let animationFrameId: number
    let dots: Dot[] = []

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    const resizeCanvas = () => {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    fetch('/dot_coordinates_from_b_image.json')
      .then(res => res.json())
      .then((data: { x: number; y: number }[]) => {
        if (!canvas || !ctx) return

        const scaleX = canvas.width / 400
        const scaleY = canvas.height / 400

        dots = data.map(p => {
          const targetX = p.x * scaleX
          const targetY = p.y * scaleY
          const endColor = emotionColors[Math.floor(Math.random() * emotionColors.length)]
          return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            targetX,
            targetY,
            radius: Math.random() * 1.8 + 0.5,
            speed: Math.random() * 0.005 + 0.001,
            vibrationPhase: Math.random() * Math.PI * 2,
            vibrationSpeed: Math.random() * 0.05 + 0.02,
            startColor: [255, 255, 255],
            endColor,
            progress: 0
          }
        })

        animate()
      })

    const animate = () => {
      if (!canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const dot of dots) {
        const dx = dot.targetX - dot.x
        const dy = dot.targetY - dot.y
        dot.x += dx * dot.speed
        dot.y += dy * dot.speed

        const vibrationAmplitude = 1.5
        dot.vibrationPhase += dot.vibrationSpeed
        const offsetX = Math.cos(dot.vibrationPhase) * vibrationAmplitude
        const offsetY = Math.sin(dot.vibrationPhase) * vibrationAmplitude

        // progress 증가 (최대 1)
        dot.progress = Math.min(dot.progress + 0.001, 1)

        // 색상 보간
        const r = Math.round(dot.startColor[0] + (dot.endColor[0] - dot.startColor[0]) * dot.progress)
        const g = Math.round(dot.startColor[1] + (dot.endColor[1] - dot.startColor[1]) * dot.progress)
        const b = Math.round(dot.startColor[2] + (dot.endColor[2] - dot.startColor[2]) * dot.progress)

        ctx.beginPath()
        ctx.arc(dot.x + offsetX, dot.y + offsetY, dot.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 bg-black"
    />
  )
}
