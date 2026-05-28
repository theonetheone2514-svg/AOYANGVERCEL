'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  orderId: string
  storeId: string
  customerId: string
  onClose: () => void
  onDone: () => void
}

export default function RatingModal({ orderId, storeId, customerId, onClose, onDone }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (rating === 0) return
    setSubmitting(true)
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, customer_id: customerId, store_id: storeId, rating, review }),
    })
    setSubmitting(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#3E2723] text-center">⭐ ให้คะแนนร้าน</h3>

        {/* Star rating */}
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hover || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500">
          {rating === 0 ? 'แตะดาวเพื่อให้คะแนน' : `คุณให้ ${rating} จาก 5 ดาว`}
        </p>

        <textarea
          placeholder="เขียนรีวิว (ไม่บังคับ)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E65100] resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
          >
            ไม่เอาดีกว่า
          </button>
          <button
            onClick={submit}
            disabled={rating === 0 || submitting}
            className="flex-1 py-2.5 rounded-lg bg-[#E65100] text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งคะแนน'}
          </button>
        </div>
      </div>
    </div>
  )
}
