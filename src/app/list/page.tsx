
"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Settings, Play, Pause, RotateCcw, Clock, AlertCircle, Smartphone, Monitor } from "lucide-react"
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

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
  id: number
  x: number
  y: number
  vx: number
  vy: number
  baseSize: number
  currentSize: number
  opacity: number
  answer: Answer
  isOld: boolean
  isDummy?: boolean
}

interface Panel {
  id: number
  x: number
  y: number
  answer: Answer
  isOld: boolean
  isDummy?: boolean
}

interface DummyParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  baseSize: number
  currentSize: number
  opacity: number
  isDummy: true
  isOld: true
}

export default function AnswerParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [panels, setPanels] = useState<Panel[]>([])
  const [isAnimating, setIsAnimating] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [particleSize, setParticleSize] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number>(0)
  const router = useRouter()
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Update particle sizes immediately when particleSize changes
  useEffect(() => {
    setParticles((prev) =>
      prev.map((particle) => ({
        ...particle,
        currentSize: particle.baseSize * particleSize,
      })),
    )
  }, [particleSize])

  const generateDummyParticles = (count: number): DummyParticle[] => {
    const dummies: DummyParticle[] = []
    const baseParticleSize = isMobile ? 3 : 4
    const maxX = dimensions.width - (isMobile ? 20 : 50)
    const maxY = dimensions.height - (isMobile ? 20 : 50)

    for (let i = 0; i < count; i++) {
      const baseSize = baseParticleSize * 0.7 // Same as old particles
      dummies.push({
        id: `dummy-${i}`,
        x: Math.random() * maxX + (isMobile ? 10 : 25),
        y: Math.random() * maxY + (isMobile ? 10 : 25),
        vx: (Math.random() - 0.5) * (isMobile ? 0.5 : 0.8),
        vy: (Math.random() - 0.5) * (isMobile ? 0.5 : 0.8),
        baseSize,
        currentSize: baseSize * particleSize,
        opacity: 0.3, // Same as old particles
        isDummy: true,
        isOld: true,
      })
    }
    return dummies
  }

  // Check if an item is older than a day
  const isOlderThanDay = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return diffInHours > 24
  }

  // Fetch answers from Supabase
  const fetchAnswers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("answers")
        .select("id, answer_text, created_at, questions(question_text, question_number)")
        .order("created_at", { ascending: false })

      if (error) throw error

      const baseParticleSize = isMobile ? 3 : 4
      const maxX = dimensions.width - (isMobile ? 20 : 50)
      const maxY = dimensions.height - (isMobile ? 20 : 50)

      let allParticles: (Particle | DummyParticle)[] = []

      if (data) {
        // Create particles from real answers
        const realParticles: Particle[] = data.map((answer) => {
          const isOld = isOlderThanDay(answer.created_at)
          const baseSize = isOld ? baseParticleSize * 0.7 : Math.random() * baseParticleSize + baseParticleSize

          return {
            id: answer.id,
            x: Math.random() * maxX + (isMobile ? 10 : 25),
            y: Math.random() * maxY + (isMobile ? 10 : 25),
            vx: (Math.random() - 0.5) * (isMobile ? 0.5 : 0.8),
            vy: (Math.random() - 0.5) * (isMobile ? 0.5 : 0.8),
            baseSize,
            currentSize: baseSize * particleSize,
            opacity: isOld ? 0.3 : Math.random() * 0.6 + 0.4,
            answer: answer as unknown as Answer,
            isOld,
            isDummy: false,
          }
        })
        allParticles = [...realParticles]
      }

      // Add dummy particles (15-25 random count)
      const dummyCount = Math.floor(Math.random() * 3000) + 20
      const dummyParticles = generateDummyParticles(dummyCount)
      allParticles = [...allParticles, ...dummyParticles]

      setParticles(allParticles as Particle[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch answers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dimensions.width > 0) {
      fetchAnswers()
    }
  }, [dimensions, isMobile])

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimating) return

    setParticles((prev) =>
      prev.map((particle) => {
        let newX = particle.x + particle.vx
        let newY = particle.y + particle.vy
        const particleRadius = particle.currentSize / 2

        // Bounce off edges
        if (newX <= particleRadius || newX >= dimensions.width - particleRadius) {
          particle.vx *= -1
          newX = Math.max(particleRadius, Math.min(dimensions.width - particleRadius, newX))
        }
        if (newY <= particleRadius || newY >= dimensions.height - particleRadius) {
          particle.vy *= -1
          newY = Math.max(particleRadius, Math.min(dimensions.height - particleRadius, newY))
        }

        return {
          ...particle,
          x: newX,
          y: newY,
        }
      }),
    )

    animationRef.current = requestAnimationFrame(animate)
  }, [isAnimating, dimensions])

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAnimating, animate])

  // Handle particle click/touch
  const handleParticleClick = (particle: Particle, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()

    const panelWidth = isMobile ? Math.min(350, dimensions.width - 20) : 400
    const panelHeight = isMobile ? Math.min(280, dimensions.height - 100) : 300

    const newPanel: Panel = {
      id: Date.now(),
      x: Math.max(10, Math.min(dimensions.width - panelWidth - 10, particle.x - panelWidth / 2)),
      y: Math.max(10, Math.min(dimensions.height - panelHeight - 10, particle.y - panelHeight / 2)),
      answer: particle.answer,
      isOld: particle.isOld,
      isDummy: particle.isDummy,
    }

    setPanels((prev) => [...prev, newPanel])
  }

  // Close panel
  const closePanel = (panelId: number) => {
    setPanels((prev) => prev.filter((panel) => panel.id !== panelId))
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading answers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-lg px-4 text-center">Error: {error}</div>
      </div>
    )
  }

  const panelWidth = isMobile ? Math.min(350, dimensions.width - 20) : 400
  const panelHeight = isMobile ? Math.min(280, dimensions.height - 100) : 300

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      
      {/* Mobile Control Panel */}
      {isMobile ? (
        <div className="absolute top-2 left-2 right-2 z-50 bg-gray-800 rounded-lg border border-gray-600 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-semibold">Mobile View</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs"
              >
                {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setPanels([])}
                className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="mb-2">
            <label className="text-white text-xs mb-1 block">Particle Size: {particleSize.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={particleSize}
              onChange={(e) => setParticleSize(Number.parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="text-xs text-gray-300">
            <span>Answers: {particles.length}</span>
            <span className="mx-2">•</span>
            <span>Recent: {particles.filter((p) => !p.isOld).length}</span>
            <span className="mx-2">•</span>
            <span>Old: {particles.filter((p) => p.isOld).length}</span>
          </div>
        </div>
      ) : (
        /* Desktop Control Panel */
        <>
          <div className="absolute top-4 left-4 z-50 flex gap-2">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded border border-gray-600"
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setPanels([])}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded border border-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={fetchAnswers}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded border border-gray-600"
            >
              Refresh
            </button>
          </div>

          {/* Particle Size Control */}
          <div className="absolute top-4 left-4 mt-16 z-50 bg-gray-800 text-white p-3 rounded border border-gray-600">
            <label className="text-sm mb-2 block">Particle Size: {particleSize.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={particleSize}
              onChange={(e) => setParticleSize(Number.parseFloat(e.target.value))}
              className="w-32"
            />
          </div>

          {/* Instructions */}
          <div className="absolute top-4 right-4 z-50 bg-gray-800 text-white p-3 rounded border border-gray-600 text-sm max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-green-400" />
              <span>Desktop View</span>
            </div>
            <div className="mb-2">Click on particles to view answers</div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
              <span>Bright = Recent</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-2 h-2 bg-white rounded-full opacity-30"></div>
              <span>Dim = Old (1+ day)</span>
            </div>
          </div>

          {/* Stats */}
          <div className="absolute bottom-4 left-4 z-50 bg-gray-800 text-white p-3 rounded border border-gray-600 text-sm">
            <div>Total Answers: {particles.length}</div>
            <div>Recent: {particles.filter((p) => !p.isOld).length}</div>
            <div>Old: {particles.filter((p) => p.isOld).length}</div>
          </div>

          <div onClick={() => {
            setIsAnimating(false) // particle animation 멈춤
            router.push("/404_not_found")
          }} className="cursor-pointer absolute bottom-20 right-4 z-50 bg-gray-800 text-white p-3 rounded border border-gray-600 text-sm">
            <div>나의 답변 보기</div>
          </div>
          <div onClick={() => {
            setIsAnimating(false) // particle animation 멈춤
            router.push("/")
          }} className="cursor-pointer absolute bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded border border-gray-600 text-sm">
            <div>다음 질문</div>
          </div>
        </>
      )}

      {/* Particles */}
      <div className="absolute inset-0" style={{ marginTop: isMobile ? "80px" : "0" }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute cursor-pointer transition-transform ${
              isMobile ? "active:scale-125" : "hover:scale-150"
            } ${particle.isOld ? "hover:opacity-60" : "hover:opacity-100"}`}
            style={{
              left: particle.x - particle.currentSize / 2,
              top: particle.y - particle.currentSize / 2,
              width: particle.currentSize,
              height: particle.currentSize,
            }}
            onClick={(e) => handleParticleClick(particle, e)}
            onTouchEnd={(e) => handleParticleClick(particle, e)}
            title={particle.isOld ? "Old answer (1+ day)" : "Recent answer"}
          >
            <div
              className={`w-full h-full rounded-full ${particle.isOld ? "bg-gray-400" : "bg-white"}`}
              style={{ opacity: particle.opacity }}
            />
          </div>
        ))}
      </div>

      {/* Panels */}
      <AnimatePresence>
        {panels.map((panel) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-2xl"
            style={{
              left: panel.x,
              top: panel.y,
              width: panelWidth,
              height: panelHeight,
            }}
            drag={!isMobile}
            dragMomentum={false}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-mono">
                  {panel.isDummy ?  "N/A" : `Q${panel.answer.questions?.question_number}`}
                </span>
                {panel.isOld && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">Old</span>
                  </div>
                )}
              </div>
              <button onClick={() => closePanel(panel.id)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="p-3 h-full overflow-hidden">
              {panel.isOld ? (
                // Message for old answers
                <div className="bg-yellow-900/20 border border-yellow-600 rounded p-4 h-full flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
                  <h3 className="text-yellow-400 font-semibold mb-2 text-sm">Content Not Visible</h3>
                  <p className="text-gray-300 text-xs mb-2">
                    This answer was created more than a day ago and is no longer visible.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Created: {new Date(panel.answer.created_at).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                // Content for recent answers
                <div className="h-full flex flex-col">
                  <div className="mb-3">
                    <h3 className="text-white font-semibold text-sm mb-2">Question:</h3>
                    <p className={`text-gray-300 bg-gray-700 p-2 rounded ${isMobile ? "text-xs" : "text-sm"}`}>
                      {panel.answer.questions?.question_text || "No question text available"}
                    </p>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-2">Answer:</h3>
                    <div
                      className={`bg-black rounded border border-gray-600 p-3 overflow-y-auto ${isMobile ? "h-20" : "h-32"}`}
                    >
                      <p className={`text-green-400 font-mono ${isMobile ? "text-xs" : "text-sm"}`}>
                        {panel.answer.answer_text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
                    Created: {new Date(panel.answer.created_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-1 mt-3">
                <div className="w-5 h-5 bg-orange-500 rounded border border-gray-500 cursor-pointer hover:bg-orange-400" />
                <div className="w-5 h-5 bg-blue-500 rounded border border-gray-500 cursor-pointer hover:bg-blue-400" />
                <div className="w-5 h-5 bg-gray-600 rounded border border-gray-500 cursor-pointer hover:bg-gray-500" />
                <div className="flex-1" />
                <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Bottom Navigation Buttons */}
    
      
    </div>
  )
}
