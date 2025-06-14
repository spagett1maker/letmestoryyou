import EndClient from './client'
import { Suspense } from 'react'

export default function EndPage() {
  return (
    <Suspense fallback={<p className="text-center">로딩 중...</p>}>
      <EndClient />
    </Suspense>
  )
}
