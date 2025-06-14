'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    soundOut?: {
      stop: () => void
    }
    hasLoadedSketch?: boolean
  }

  function getAudioContext(): AudioContext
}

export default function EmotionCanvas() {
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing) return resolve()
        const script = document.createElement('script')
        script.src = src
        script.onload = () => resolve()
        script.onerror = reject
        document.body.appendChild(script)
      })

    const loadAll = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js')
        await loadScript('https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/addons/p5.sound.min.js')
        await loadScript('/sketch.js')
        setLoaded(true)
      } catch (e) {
        console.error('Script load error:', e)
      }
    }

    loadAll()

    return () => {
      const canvases = document.querySelectorAll('canvas')
      canvases.forEach(canvas => canvas.remove())

      if (window.soundOut?.stop) window.soundOut.stop()
    }
  }, [])

  const handleTraceClick = () => {
    const canvases = document.querySelectorAll('canvas')
    canvases.forEach(canvas => canvas.remove())

    if (window.soundOut?.stop) window.soundOut.stop()

    router.push('/list')
  }

  const handleStayClick = () => {
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
    } catch (e) {
      console.warn('Audio context resume error', e)
    }
  }

  return (
    <>
      <Head>
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
        `}</style>
      </Head>

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black z-50">
          loading...!
        </div>
      )}

      <div className="absolute bottom-10 w-full text-center text-white text-base font-sans px-5 pointer-events-none text-shadow-sm">
        <p className="leading-relaxed text-white/85">
          이곳은 당신의 감정이 잠시 머물 수 있는 안전한 공간입니다.<br />
          우리는 당신의 이야기를 소유하지 않아요.<br />
          감정이 머물렀다가, 자연스럽게 흘러갈 수 있도록 돕는 자리입니다.<br />
          당신은 감정의 주인이 아니라, 감정을 바라보는 사람입니다.<br /><br />
          지금 이 감정은 당신의 일부일 뿐, 당신 전체가 아닙니다.<br />
          표현한 만큼, 이제 감정을 보내주셔도 됩니다.
        </p>

        <div className="flex justify-center gap-3 mt-5 pointer-events-auto">
          <button
            onClick={handleStayClick}
            id="stayButton"
            className="px-6 py-3 text-white text-base bg-white/10 border border-white/30 rounded-md backdrop-blur transition hover:bg-white/20"
          >
            머물다가기
          </button>
          <button
            onClick={handleTraceClick}
            id="traceButton"
            className="px-6 py-3 text-white text-base bg-white/10 border border-white/30 rounded-md backdrop-blur transition hover:bg-white/20"
          >
            흔적 따라가기
          </button>
        </div>
      </div>
    </>
  )
}
