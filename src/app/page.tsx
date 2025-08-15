
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function StarfieldPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const warpRef = useRef<HTMLAnchorElement>(null)
  const requestRef = useRef<number>(0)
  const animateRef = useRef<boolean>(true)
  const starsRef = useRef<{ x: number; y: number; z: number; o: string }[]>([])
  const warpMode = useRef<number>(0)

  const numStars = 1900
  const focalLength = typeof window !== 'undefined' ? window.innerWidth * 2 : 2000

  const initializeStars = (canvas: HTMLCanvasElement) => {
    const stars = []
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * canvas.width,
        o: '0.' + Math.floor(Math.random() * 99 + 1),
      })
    }
    starsRef.current = stars
  }

  const drawStars = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const stars = starsRef.current
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initializeStars(canvas)
    }

    if (warpMode.current === 0) {
      ctx.fillStyle = 'rgba(0,10,20,1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    for (let i = 0; i < numStars; i++) {
      const star = stars[i]
      //star.z--
      star.z -= 4
      if (star.z <= 0) {
        star.z = canvas.width
      }

      const pixelX = (star.x - centerX) * (focalLength / star.z) + centerX
      const pixelY = (star.y - centerY) * (focalLength / star.z) + centerY
      const pixelRadius = 0.3 * (focalLength / star.z)

      ctx.beginPath()
      ctx.arc(pixelX, pixelY, pixelRadius, 0, Math.PI * 2, false)
      ctx.fillStyle = `rgba(209,255,255,${star.o})`
      ctx.fill()
      // ctx.fillStyle = `rgba(209,255,255,${radius})`
      // ctx.fillRect(pixelX, pixelY, pixelRadius, pixelRadius)
      // ctx.fillStyle = `rgba(209,255,255,${star.o})`
    }
  }

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    drawStars(canvas, ctx)

    if (animateRef.current) {
      requestRef.current = requestAnimationFrame(animate)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initializeStars(canvas)
    animate()

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  const handleWarpClick = () => {
    warpMode.current = warpMode.current === 1 ? 0 : 1
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      animate()
    }
    
    // 2초 후에 /question으로 라우팅
    setTimeout(() => {
      router.push('/question')
    }, 2900)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cover bg-center" style={{
      backgroundImage: "url('https://i.imgur.com/r838U7u.jpg')",
      imageRendering: 'pixelated'    }}>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      <img
        src="/bonusfin.gif"
        alt="bonuscat"
        className="absolute z-10 pointer-events-none w-[18%] sm:w-[6.8%]"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <a
        ref={warpRef}
        onClick={handleWarpClick}
        className="absolute z-20 bottom-30 left-1/2 -translate-x-1/2 border-2 px-4 py-2 text-center font-bold text-[1.2em] text-cyan-100 hover:shadow-lg hover:text-white hover:shadow-blue-300 transition-all bg-black/80"
        style={{ width: '11em' }}
      >
        외부 비활성화 하기
      </a>
    </div>
  )
}
