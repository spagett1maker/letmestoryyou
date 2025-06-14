"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { AnimatePresence, motion } from "framer-motion"
import { X, Clock } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Answer {
  id: string
  created_at: string
  answer_text: string
  questions: {
    question_text: string
    question_number: number
  }
}
interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  answer: Answer
  isOld: boolean
}

export default function CanvasParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const [panels, setPanels] = useState<Answer[]>([])

  const isOld = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60) > 24
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("answers")
        .select("id, created_at, answer_text, questions(question_text, question_number)")
        .order("created_at", { ascending: false })

      if (error || !data) return

      const canvas = canvasRef.current
      if (!canvas) return
      const { width, height } = canvas

      const newParticles = data.map((d) => {
        const old = isOld(d.created_at)
        const size = old ? 3 : 5 + Math.random() * 3
        return {
          id: d.id,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size,
          opacity: old ? 0.3 : 0.7 + Math.random() * 0.3,
          answer: d,
          isOld: old,
        }
      })

      particlesRef.current = newParticles as unknown as Particle[]
    }

    fetchData()
  }, [])

  // 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      particlesRef.current.forEach((p) => {
        // 위치 업데이트
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.isOld ? "#ccc" : "#fff"
        ctx.fill()
      })

      requestAnimationFrame(draw)
    }

    draw()
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clicked = particlesRef.current.find(
      (p) => (x - p.x) ** 2 + (y - p.y) ** 2 < p.size ** 2
    )

    if (clicked) {
      setPanels((prev) => [...prev, clicked.answer])
    }
  }

  const closePanel = (id: string) => {
    setPanels((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}
        onClick={handleClick}
        className="absolute top-0 left-0"
      />

      {/* 패널 */}
      <AnimatePresence>
        {panels.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bg-gray-800 text-white border border-gray-600 rounded-lg p-4 w-80 max-w-full"
            style={{
              top: 100 + Math.random() * 200,
              left: 100 + Math.random() * 300,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1 text-sm font-mono">
                Q{p.questions.question_number}
                <Clock className="w-3 h-3 text-yellow-400" />
              </div>
              <button onClick={() => closePanel(p.id)}>
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="text-sm text-gray-300 mb-2">{p.questions.question_text}</div>
            <div className="bg-black p-2 rounded border border-gray-700 text-green-400 text-sm font-mono">
              {p.answer_text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
