'use client'

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'

// p5.js 타입 정의
declare global {
  interface Window {
    p5?: any
    soundOut?: {
      stop: () => void
    }
  }
}

export default function EmotionCanvas() {
  const [loaded, setLoaded] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const sketchRef = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadP5 = () =>
      new Promise((resolve, reject) => {
        if (window.p5) {
          resolve(window.p5)
          return
        }
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js'
        script.onload = () => resolve(window.p5)
        script.onerror = reject
        document.head.appendChild(script)
      })
    
    const loadP5Sound = () =>
      new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/addons/p5.sound.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })

    const createSketch = async () => {
      try {
        await loadP5()
        await loadP5Sound()
        
        if (!canvasRef.current) return

        // p5.js 스케치 함수
        const sketch = (p: any) => {
          let sound: any
          let isPlaying = false
          let particles: any[] = []
          let fft: any
          let spectrum: any
          let waveform: any

          p.preload = () => {
            sound = p.loadSound('/sing.mp3')
          }

          p.setup = () => {
            const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
            canvas.parent(canvasRef.current)
            p.angleMode(p.DEGREES)
            
            sound.setVolume(0.6)
            fft = new window.p5.FFT()
            spectrum = fft.analyze()
            
            // 파티클 초기화
            for (let i = 0; i < spectrum.length; i++) {
              particles[i] = {
                x: p.map(i, 0, spectrum.length, 0, p.width / 2 - 20),
                theta: p.random(0, 360)
              }
            }

            // 전역 soundOut 객체 설정
            window.soundOut = {
              stop: () => {
                sound.stop()
                isPlaying = false
              }
            }
          }

          p.draw = () => {
            p.translate(p.width / 2, p.height / 2)
            checkPlay()
            p.background(18, 18, 18, 10)
            soundProcess()
          }

          const soundProcess = () => {
            spectrum = fft.analyze()
            waveform = fft.waveform()
            
            for (let i = 0; i < spectrum.length; i += 10) {
              particles[i].theta = particles[i].theta - spectrum[i] / 50 - waveform[i] * 100
              
              for (let j = 0; j < 10; j++) {
                p.stroke(
                  100 + 105 * p.abs(p.sin(p.frameCount / 20 + particles[i].theta + spectrum[i] / 50)),
                  200 + 65 * p.abs(p.sin(p.frameCount / 20 + particles[i].x + spectrum[i] / 50)),
                  200 + 95 * p.abs(p.sin(p.frameCount / 20 + particles[i].x + spectrum[i] / 50)),
                  255
                )
                
                p.point(
                  p.randomGaussian(0, spectrum[i] / 10) +
                    p.cos(p.frameCount / 10) * particles[i].x * p.sin(particles[i].theta) +
                    particles[i].x * p.cos(particles[i].theta) * p.cos(waveform[i] * 10 + spectrum[i] / 2),
                  p.randomGaussian(0, spectrum[i] / 10) +
                    particles[i].x * p.sin(particles[i].theta)
                )
              }
            }
          }

          const checkPlay = () => {
            if (isPlaying) {
              if (!sound.isPlaying()) {
                sound.play()
              }
            } else {
              sound.pause()
            }
          }

          p.mousePressed = () => {
            // AudioContext 재개 (모바일 대응)
            if (p.getAudioContext().state !== 'running') {
              p.getAudioContext().resume()
            }
            
            isPlaying = !isPlaying
            
            if (isPlaying && !sound.isPlaying()) {
              sound.play()
            } else if (!isPlaying && sound.isPlaying()) {
              sound.pause()
            }
          }

          p.keyPressed = () => {
            sound.stop()
            p.setup()
            p.draw()
          }

          p.windowResized = () => {
            p.resizeCanvas(p.windowWidth, p.windowHeight)
          }
        }

        // p5 인스턴스 생성
        sketchRef.current = new window.p5(sketch)
        setLoaded(true)
        
      } catch (e) {
        console.error('p5.js 로드 에러:', e)
      }
    }

    createSketch()

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (sketchRef.current) {
        sketchRef.current.remove()
      }
      if (window.soundOut && typeof window.soundOut.stop === 'function') {
        window.soundOut.stop()
      }
    }
  }, [])

  // 버튼 핸들러들
  const handleTraceClick = () => {
    if (sketchRef.current) {
      sketchRef.current.remove()
    }
    if (window.soundOut && typeof window.soundOut.stop === 'function') {
      window.soundOut.stop()
    }
    router.push('/list')
  }

  const handleStayClick = () => {
    if (sketchRef.current && sketchRef.current.getAudioContext) {
      const ctx = sketchRef.current.getAudioContext()
      if (ctx?.state === 'suspended') {
        ctx.resume()
      }
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

      {/* p5.js 캔버스가 렌더링될 컨테이너 */}
      <div ref={canvasRef} className="absolute inset-0" />

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
            className="px-6 py-3 text-white text-base bg-white/10 border border-white/30 rounded-md backdrop-blur transition hover:bg-white/20"
            onClick={handleStayClick}
          >
            머물다가기
          </button>
          <button
            onClick={handleTraceClick}
            className="px-6 py-3 text-white text-base bg-white/10 border border-white/30 rounded-md backdrop-blur transition hover:bg-white/20"
          >
            흔적 따라가기
          </button>
        </div>
      </div>
    </>
  )
}