'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import './main_bg.css'

export default function MainBg() {
  const router = useRouter()

  useEffect(() => {
    const target = document.querySelector('.ellipse svg')
    if (!target) return

    const pathId = `path-${Math.floor(Math.random() * 900000 + 100000)}`
    const textProperties = {
      fontSize: /iPhone/.test(navigator.userAgent) ? '20px' : '18px',
      letterSpacing: '-0.3px',
    }

    const svgPath = target.querySelector('path')
    if (svgPath) {
      svgPath.setAttribute('fill', 'none')
      svgPath.setAttribute('id', pathId)
      svgPath.setAttribute('stroke', 'none')
    }

    target.insertAdjacentHTML(
      'beforeend',
      `
      <text className="cursor-none">
        <textPath href='#${pathId}' startOffset="0%">
          이 공간은 당신의 감정을 잠시 머물게하고, 흘려보내는 연습을 돕습니다. <tspan font-style="italic">Let Me Story You</tspan>
        </textPath>
        <textPath href='#${pathId}' startOffset="0%">
          이 공간은 당신의 감정을 잠시 머물게하고, 흘려보내는 연습을 돕습니다. <tspan font-style="italic">Let Me Story You</tspan>
        </textPath>
      </text>
    `
    )

    const paths = target.querySelectorAll('textPath')
    gsap.set(paths, textProperties)

    const props = { duration: 21, ease: 'none', repeat: -1 }

    gsap.fromTo(
      paths[0],
      { attr: { startOffset: '0%' } },
      { attr: { startOffset: '100%' }, ...props }
    )
    gsap.fromTo(
      paths[1],
      { attr: { startOffset: '-100%' } },
      { attr: { startOffset: '0%' }, ...props }
    )
  }, [])

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      router.push('/question') // 이동하고 싶은 페이지 경로로 수정하세요
    }
  }

  return (
    <div className="bg-[#121212] text-white m-0 z-0 absolute top-0 left-0 w-full h-screen object-cover flex flex-col items-center justify-center">
      <div className="ellipse">
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M375 200C375 245 285 290 200 290C115 290 25 245 25 200C25 155 115 110 200 110C285 110 375 155 375 200Z" />
        </svg>
        <div className="center-text">
          <p>잠깐,<br />당신의 이야기를 빌려주세요</p>
        </div>
      </div>

      <div className="toggle">
        <input
          className="toggle-input"
          id="emotion-toggle"
          type="checkbox"
          onChange={handleToggle}
        />
        <label htmlFor="emotion-toggle" className="toggle-switch">
          <span className="knob"></span>
        </label>
        <div className="toggle-label">외부 비활성화 하기</div>
      </div>
    </div>
  )
}
