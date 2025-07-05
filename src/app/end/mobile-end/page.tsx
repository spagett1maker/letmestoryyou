"use client"

import { useRouter } from "next/navigation"

export default function BreatheBox() {
  const router = useRouter()
  const handleTraceClick = () => {

    router.push('/list')
  }
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#121212] font-['Roboto']">
      <div className="relative flex items-center justify-center w-[200px] h-[200px] border border-white">
        <div
          className="absolute w-[10px] h-[10px] rounded-full bg-teal-500/ bg-[#A9EFFF] shadow-[0_0_10px_10px_teal] top-[-5px] left-[-5px] breathe-dot"
        ></div>
        <div className="flex items-center justify-center text-white text-[1.5em] bg-teal-400 bg-[#A9EFFF]/ expand-box overflow-hidden">
          <span className="absolute words1">Breathe In</span>
          <span className="absolute words2">Hold</span>
          <span className="absolute words3">Breath Out</span>
          <span className="absolute words4">Hold</span>
        </div>
      </div>

      <button
        onClick={handleTraceClick}
        className="px-6 py-3 text-white text-sm sm:text-base bg-white/10 border border-white/30 rounded-md backdrop-blur transition hover:bg-white/20 fixed bottom-10 left-1/2 -translate-x-1/2"
      >
        흔적 따라가기
      </button>
    </div>
  )
}
