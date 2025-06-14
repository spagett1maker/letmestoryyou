import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { pipeline } from '@xenova/transformers'

// Supabase 연결
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ Sentiment classifier 준비 (최초 한 번만 로딩됨)
let classifier: any | null = null
async function getClassifier() {
  if (!classifier) {
    classifier = await pipeline('sentiment-analysis')
  }
  return classifier
}

export async function POST(req: Request) {
  const { question_id, answer_text, encrypted_answer, user_id } = await req.json()

  if (!question_id || !answer_text) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // ✅ 무료 감정 분석 수행
  const sentimentPipeline = await getClassifier()
  const result = await sentimentPipeline(answer_text)

  // result: [{ label: 'POSITIVE', score: 0.98 }]
  const sentiment = result?.[0]?.label?.toLowerCase() || 'neutral'

  // secret_key 생성
  const secret_key = uuidv4()

  // Supabase 저장
  const { error } = await supabase.from('answers').insert([
    {
      question_id,
      answer_text,
      encrypted_answer,
      secret_key,
      sentiment,
      user_id,
    },
  ])

  if (error) {
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }

  return NextResponse.json({ secret_key })
}
