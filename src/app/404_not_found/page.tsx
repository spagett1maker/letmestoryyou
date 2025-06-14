"use client"

import { useState , useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Question {
  id: string,
  question_number: number,
  question_text: string
}

interface Dot {
  x: number
  y: number
  size: number
  opacity: number
  dx: number
  dy: number
}

import seedrandom from 'seedrandom'

function generateRandomMap(seed: string): { [key: string]: string } {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  const specials = ['♠', '♣', '♦', '★', '☆', '☯', '☢', '@', '#', '%', '&', '*']

  const rng = seedrandom(seed)
  const shuffled = base
    .split('')
    .sort(() => rng() - 0.5)

  const map: { [key: string]: string } = {}
  for (let i = 0; i < base.length; i++) {
    const original = base[i]
    const sub = shuffled[i]
    map[original] = rng() < 0.4
      ? specials[Math.floor(rng() * specials.length)] + sub
      : sub
  }
  return map
}

function encryptAnswerFancy(answer: string): string {
  const base64 = btoa(unescape(encodeURIComponent(answer)))
  const seed = answer // or you could use userId + answer, etc.
  const map = generateRandomMap(seed)
  return base64
    .split('')
    .map((ch) => map[ch] || ch)
    .join('')
}

export default function Home() {
  const router = useRouter()
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [user_id, setUserId] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<boolean>(false)
  const dotsRef = useRef<Dot[]>([]) 

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    let animationFrameId: number
    
  
    const createDots = (width: number, height: number) => {
      const dots: Dot[] = []
      const centerX = width / 2
      const centerY = height / 2
      const numDots = 9000
  
      for (let i = 0; i < numDots; i++) {
        const angle = Math.random() * 2 * Math.PI
        const radius = 200 * Math.sqrt(Math.random())
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
  
        dots.push({
          x,
          y,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.5,
          dx: (Math.random() - 0.5) * 0.5,
          dy: (Math.random() - 0.5) * 0.5
        })
      }
  
      return dots
    }
  
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      dotsRef.current = createDots(canvas.width, canvas.height) // 💡 리사이즈할 때 새로 만듦
    }
  
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const dot of dotsRef.current) {
        dot.x += dot.dx
        dot.y += dot.dy
  
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`
        ctx.fill()
      }
  
      animationFrameId = requestAnimationFrame(draw)
    }
  
    draw()
  
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])
  

  const handleDotClick = () => {
    setSelected(true)
  }

  useEffect(() => {
    let userId = localStorage.getItem('bonus_user_id')
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem('bonus_user_id', userId)
      console.log('✅ user_id 생성됨:', userId)
    } else {
      console.log('🔁 기존 user_id 사용:', userId)
    }
    setUserId(userId)
  }, [])

  useEffect(() => {
    fetch('/api/question')
      .then(res => res.json())
      .then(data => setQuestion(data.question))
  }, [])

  const handleSubmit = async () => {
    if (!question || !answer.trim()) return
    setLoading(true)

    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: question.id,
        answer_text: answer,
        encrypted_answer: encryptAnswerFancy(answer),
        user_id: user_id
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      router.push(`/end?key=${user_id}`)
    } else {
      alert('답변 저장 실패: ' + data.error)
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-10">
      <div className="absolute top-0 left-0 w-full h-screen object-cover z-0">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-10 bg-black" onClick={() => handleDotClick()} />
      </div>    
      {selected && 
        <div className="w-full max-w-md z-20">
          <h1 className="mb-12 text-4xl font-normal leading-tight text-white rounded-lg p-4 bg-black/80">
            {question?.question_number}. {question?.question_text}
          </h1>

          <div className="mb-6">
            <textarea
              className="text-white w-full p-4 bg-black/80 border-none shadow-lg placeholder:text-white rounded-lg resize-none h-36 focus:outline-none"
              placeholder={
                '잠깐 당신의 이야기를 빌려주세요.\n지금 떠오르는 것이 감정인지 잘 모르겠다면, \n괜찮습니다. 그냥 지금 떠오른 생각을 적어주세요.'
              }
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>

          <button className="w-full py-3 mb-12 text-white bg-black rounded-full" onClick={handleSubmit} disabled={loading}>
            {loading ? '전송중...' : '전송'}
          </button>

          <div className="flex justify-center">
            <Link href="/about" className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3L19 12L5 21V3Z" fill="black" />
              </svg>
            </Link>
          </div>
        </div>
      }
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
        <p className="text-white text-lg font-light tracking-wide">마음이 닿는 점을 눌러주세요.</p>
      </div>
    </div>
  )
}
