"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { createClient } from "@supabase/supabase-js"
import { Pause, Play, RotateCcw, Monitor, Smartphone } from "lucide-react"
import AnswerPanel from "@/components/AnswerPanel"

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

export default function CanvasAnswerParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [panels, setPanels] = useState<Answer[]>([])
  const [isAnimating, setIsAnimating] = useState(true)
  const [particleSize, setParticleSize] = useState(1.5)
  const [isMobile, setIsMobile] = useState(false)
  const animationRef = useRef<number | null>(null)

  // 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Supabase에서 답변 불러오기
  useEffect(() => {
    const fetchAnswers = async () => {
      const { data } = await supabase
        .from("answers")
        .select("id, created_at, answer_text, questions(question_text, question_number)")
        .order("created_at", { ascending: false })

      if (!data) return
      const canvas = canvasRef.current
      if (!canvas) return
      const { width, height } = canvas

      const now = new Date()
      
      const realParticles: Particle[] = data.map((a) => {
        const created = new Date(a.created_at)
        const hours = (now.getTime() - created.getTime()) / 1000 / 3600
        const isOld = hours > 24
        const baseSize = isOld ? 3 : 5 + Math.random() * 2
        return {
          id: a.id,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: baseSize * particleSize,
          opacity: isOld ? 0.3 : 0.6 + Math.random() * 0.4,
          answer: a,
          isOld,
        }
      })

      // dummy particles 추가
      const dummyCount = 80
      for (let i = 0; i < dummyCount; i++) {
        realParticles.push({
          id: `dummy-${i}`,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: 2.5 * particleSize,
          opacity: 0.2,
          answer: {
            id: `dummy-${i}`,
            created_at: new Date().toISOString(),
            answer_text: "dummy",
            questions: { question_text: "dummy", question_number: 0 },
          },
          isOld: true,
        })
      }

      setParticles(realParticles)
    }

    fetchAnswers()
  }, [particleSize])

  // 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI)
        ctx.fillStyle = p.isOld ? "#aaa" : "#fff"
        ctx.fill()
      })

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    draw()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [particles, isAnimating])

  // 클릭 시 particle 위치 판별
  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const target = particles.find(
      (p) => (x - p.x) ** 2 + (y - p.y) ** 2 <= p.size ** 2 && !p.id.startsWith("dummy")
    )
    if (target) setPanels((prev) => [...prev, target.answer])
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}
        onClick={handleClick}
        className="absolute top-0 left-0"
      />

      {/* 제어 패널 */}
      <div className="absolute z-50 top-4 left-4 text-white flex flex-col gap-3 bg-gray-800 border border-gray-600 p-4 rounded">
        <div className="flex gap-2 items-center">
          {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span className="text-sm">{isMobile ? "Mobile" : "Desktop"} Mode</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAnimating(!isAnimating)}>
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={() => setPanels([])}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm">
          Size: {particleSize.toFixed(1)}x
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={particleSize}
            onChange={(e) => setParticleSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* 패널 UI */}
      <AnimatePresence>
        {panels.map((answer) => (
          <AnswerPanel key={answer.id} answer={answer} onClose={() =>
            setPanels((prev) => prev.filter((a) => a.id !== answer.id))
          } />
        ))}
      </AnimatePresence>
    </div>
  )
}
