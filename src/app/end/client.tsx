'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EndClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const secretKey = searchParams.get('key')
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const handleCopy = async () => {
    if (!secretKey) return
    try {
      await navigator.clipboard.writeText(secretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/list')
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center justify-between h-full max-w-md px-6 py-8">
        <div className="flex-1"></div>

        <div className="flex flex-col items-center text-center mb-24">
          <h1 className="text-2xl font-normal text-black mb-3">
            당신의 감정은 잘 흘려보내졌습니다. <br/>
            더 이상 당신의 책임이 아닙니다. <br/>
            놓아주세요. <br/>
            당신은 이미 충분히 말했습니다.
          </h1>
          <p className="text-sm text-gray-500">상태 : 휘발 대기 중</p>
        </div>

        <div className="flex flex-col items-center w-full mt-auto">
          <p className="text-gray-400 mb-2 text-sm">{secretKey}</p>
          <button className="w-full text-black font-semibold bg-white rounded-md p-2" onClick={handleCopy}>
            {copied ? '복사되었음' : '내 답변을 열람할 수 있는 암호키 기억하기'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          {countdown}초 후 답변 열람 페이지로 이동합니다.
        </p>
      </div>
    </div>
  )
}
