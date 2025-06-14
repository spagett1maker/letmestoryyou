"use client"

import { motion } from "framer-motion"
import { Clock, X, AlertCircle } from "lucide-react"

interface Answer {
  id: string
  created_at: string
  answer_text: string
  questions: {
    question_text: string
    question_number: number
  }
}

export default function AnswerPanel({
  answer,
  onClose,
}: {
  answer: Answer
  onClose: () => void
}) {
  const created = new Date(answer.created_at)
  const isOld = (Date.now() - created.getTime()) / (1000 * 60 * 60) > 24

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-80 max-w-full z-50"
      style={{
        top: 80 + Math.random() * 200,
        left: 100 + Math.random() * 300,
      }}
      drag
      dragMomentum={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
        <div className="flex items-center gap-2 text-white text-sm font-mono">
          {`Q${answer.questions?.question_number}`}
          {isOld && (
            <div className="flex items-center gap-1 text-yellow-400 ml-2">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Old</span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 h-full overflow-y-auto text-sm">
        {isOld ? (
          <div className="py-8 bg-yellow-900/20 border border-yellow-600 rounded p-4 max-h-full w-full flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
            <h3 className="text-yellow-400 font-semibold mb-4 text-sm">404 not found</h3>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              감정은 한 번 말해졌고, 전송됨으로써 놓아졌으며, <br />
              24시간이 지나 삭제되었습니다. <br />
              다시 확인되지 않도록, 다시 붙들리지 않도록,<br />
              감정은 흘러갑니다.
            </p>
            <p className="text-gray-400 text-xs">Created: {created.toLocaleDateString()}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="mb-3">
              <h3 className="text-white font-semibold text-sm mb-2">Question:</h3>
              <p className="text-gray-300 bg-gray-700 p-2 rounded">{answer.questions?.question_text}</p>
            </div>

            <div className="mb-2 flex-1">
              <h3 className="text-white font-semibold text-sm mb-2">Answer:</h3>
              <div className="bg-black rounded border border-gray-600 p-3 overflow-y-auto h-24">
                <p className="text-green-400 font-mono">{answer.answer_text}</p>
              </div>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              Created: {created.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
