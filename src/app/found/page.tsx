'use client'

import Link from "next/link";
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleCheck = () => {
    if (key.trim() === localStorage.getItem('bonus_user_id')) {
      router.push("/my");
    } else {
      setError("암호키가 올바르지 않습니다.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-3">
          <textarea
            className="w-full p-4 bg-gray-100 border-none rounded-lg resize-none h-14 focus:outline-none"
            placeholder="암호키를 입력해주세요."
            value={key}
            onChange={e => { setKey(e.target.value); setError(""); }}
          />
        </div>
        {error && (
          <div className="mb-3 text-red-500 text-sm text-center">{error}</div>
        )}
        <button className="w-full py-3 mb-8 text-white bg-black rounded-full" onClick={handleCheck}>확인</button>
        <Link href="/">
          <p className="text-xs text-gray-500 text-center">
            암호키를 잊으셨나요?
          </p>
        </Link>
      </div>
    </div>
  )
}
