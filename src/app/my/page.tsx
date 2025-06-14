'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Answer {
  answer_text: string
  created_at: string
  questions: { question_text: string; question_number: number }
}

function ensureUserId(): string {
  let userId = localStorage.getItem('bonus_user_id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('bonus_user_id', userId)
  }
  return userId
}

export default function MyAnswersPage() {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = ensureUserId()
    fetch(`/api/my?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const now = new Date()
        const validAnswers = (data.answers || []).filter((a: Answer) => {
          const created = new Date(a.created_at)
          const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
          return hoursDiff < 24
        })
        setAnswers(validAnswers)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-center mt-10">불러오는 중...</p>

  return (
    <div className="flex flex-col h-screen">
      {/* Scrollable answer list */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
        {answers.length === 0 ? (
          <p className="text-center text-gray-500">아직 저장된 답변이 없습니다.</p>
        ) : (
          answers.map((a, idx) => (
            <div key={idx} className="mb-6 border-b border-gray-200 pb-6">
              <p className="text-base font-semibold mb-2">
                {a.questions?.question_number}. {a.questions?.question_text}
              </p>
              <p className="text-base text-gray-700">{a.answer_text}</p>
            </div>
          ))
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <Link
          href="/"
          className="block w-full text-center bg-black text-white font-semibold rounded-full py-3"
        >
          새로운 질문 하러가기
        </Link>
      </div>
    </div>
  )
}
