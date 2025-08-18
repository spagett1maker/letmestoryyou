import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 연결
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // answers 테이블에서 모든 감정 데이터 가져오기 (sentiment 컬럼)
    const { data, error } = await supabase
      .from('answers')
      .select('sentiment')
      .not('sentiment', 'is', null)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch emotions' }, { status: 500 })
    }

    // 감정별 카운트 계산
    const emotionCounts: { [key: string]: number } = {}
    data?.forEach(item => {
      if (item.sentiment) {
        const emotion = item.sentiment.toString().trim()
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
      }
    })

    console.log('Retrieved emotions:', emotionCounts)
    return NextResponse.json({ emotions: emotionCounts })
  } catch (error) {
    console.error('Error fetching emotions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}