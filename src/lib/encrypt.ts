// encrypt-answers.ts
import { createClient } from '@supabase/supabase-js'
import seedrandom from 'seedrandom'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateRandomMap(seed: string): { [key: string]: string } {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  const specials = ['♠', '♣', '♦', '★', '☆', '☯', '☢', '⚡', '@', '#', '%', '&', '*']
  const rng = seedrandom(seed)
  const shuffled = base.split('').sort(() => rng() - 0.5)
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
  const map = generateRandomMap(answer)
  return base64.split('').map(ch => map[ch] || ch).join('')
}

async function run() {
  const { data: rows, error } = await supabase
    .from('answers')
    .select('id, answer_text')
    .is('encrypted_answer', null)

  if (error) {
    console.error('❌ Fetch 실패:', error.message)
    return
  }

  for (const row of rows) {
    const encrypted = encryptAnswerFancy(row.answer_text)
    const { error: updateError } = await supabase
      .from('answers')
      .update({ encrypted_answer: encrypted })
      .eq('id', row.id)

    if (updateError) {
      console.error(`❌ 업데이트 실패 (id=${row.id}): ${updateError.message}`)
    } else {
      console.log(`✅ 업데이트 완료: id=${row.id}`)
    }
  }

  console.log(`🎉 총 ${rows.length}개의 answer가 암호화되었습니다.`)
}

run()
