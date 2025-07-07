"use client"

import { useRouter } from "next/navigation"

export default function BreatheBox() {
  const router = useRouter()
  const handleTraceClick = () => {

    router.push('/list')
  }
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#121212] ">
      <div className="w-full h-full absolute top-0 left-0 bg-black/50 flex flex-col pt-20">
       
        <div className="text-white text-sm text-center w-full leading-6">
          이곳은 당신의 감정이 잠시 머물 수 있는 안전한 공간입니다. <br/>
          우리는 당신의 이야기를 소유하지 않아요. <br/>
          감정이 머물렀다가, 자연스럽게 흘러갈 수 있도록 돕는 자리입니다. <br/>
          당신은 감정의 주인이며, 감정을 바라보는 사람입니다. <br/>
          지금 이 감정은 당신의 일부일 뿐, 당신 전체가 아닙니다. <br/>
          표현한 만큼, 이제 감정을 보내주셔도 됩니다. <br/>
        </div>
      </div>
      <div className="relative flex items-center justify-center w-[200px] h-[200px] border border-white font-['Roboto']">
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
