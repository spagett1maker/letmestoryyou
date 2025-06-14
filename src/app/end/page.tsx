'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    soundOut?: {
      stop: () => void
    }
  }
}
declare function getAudioContext(): AudioContext;



export default function EmotionCanvas() {
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadP5 = () =>
      new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js'
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    
    const loadP5Sound = () =>
      new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/addons/p5.sound.min.js'
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })

    const loadSketchOnce = () =>
      new Promise((resolve, reject) => {
        const alreadyLoaded = document.querySelector('script[src="/sketch.js"]')
        if (alreadyLoaded) {
          resolve(true)
          return
        }
    
        const script = document.createElement('script')
        script.src = '/sketch.js'
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })

    const loadAll = async () => {
      try {
        await loadP5()
        await loadP5Sound()
        await loadSketchOnce()
        setLoaded(true)
      } catch (e) {
        console.error('Script load error:', e)
      }
    }

    loadAll()

    // 언마운트 시 정리
    return () => {
      const canvases = document.querySelectorAll('canvas')
      canvases.forEach((canvas) => canvas.remove())

      if (window.soundOut && typeof window.soundOut.stop === 'function') {
        window.soundOut.stop()
      }
    }
  }, [])

  // 버튼 누르면 라우팅 + 사운드 정지 + 캔버스 제거
  const handleTraceClick = () => {
    if (typeof window !== 'undefined') {
      const canvases = document.querySelectorAll('canvas')
      canvases.forEach((canvas) => canvas.remove())

      if (window.soundOut && typeof window.soundOut.stop === 'function') {
        window.soundOut.stop()
      }
    }

    router.push('/list')
  }

    // stayButton 클릭 시 오디오 context resume
  const handleStayClick = () => {
    if (typeof window !== 'undefined') {
      const ctx = getAudioContext(); // ✅ 전역 함수로 호출
      if (ctx?.state === 'suspended') {
        ctx.resume();
      }
    }
  };
    


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
            id="stayButton"
            className="px-6 py-3 text-red-500 text-base bg-white/10 border border-white/30 rounded-md backdrop-blur transition hover:bg-white/20"
            onClick={handleStayClick}
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
