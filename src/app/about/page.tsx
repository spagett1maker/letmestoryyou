"use client"

import { useRouter } from "next/navigation"

export default function About() {
  const router = useRouter()
  return (
    <div className="flex flex-col min-h-screen bg-white px-6 py-8">
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-8 text-center">
          잠깐 당신의 이야기를 빌려주세요.
        </h1>
        
        <div className="space-y-4 text-base">
          <p className="text-red-500 text-center">
            이 작업은 당신의 이야기를 &apos;빌린다&apos;고 말하지만, 사실 아무것도 소유하지 않습니다. 
            감정이 잠시 머물고, 흘러갈 수 있는 자리를 만듭니다.
          </p>
          
         
        </div>
      </div>
      
      <div className="mt-auto">
        <button 
          className="w-full bg-black text-white rounded-full py-4"
          onClick={() => router.push('/')}
        >
          질문하기
        </button>


      </div>
    </div>
  )
}
