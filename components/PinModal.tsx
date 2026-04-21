'use client'
import { useState, useEffect, useRef } from 'react'

type Props = {
  userName: string
  userId: number
  onSuccess: () => void
  onCancel: () => void
}

export default function PinModal({ userName, userId, onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    const res = await fetch('/api/users/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, pin })
    })
    const { ok } = await res.json()
    if (ok) {
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className={`bg-gray-900 border border-gray-700 rounded-xl p-6 w-72 text-center ${shake ? 'animate-bounce' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-2xl mb-1">🔒</div>
        <h2 className="text-white font-semibold mb-1">{userName}</h2>
        <p className="text-gray-400 text-sm mb-4">請輸入 PIN 碼</p>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
          onKeyDown={handleKey}
          className={`input text-center text-xl tracking-widest font-bold mb-3 ${error ? 'border-red-500 text-red-400' : ''}`}
          placeholder="••••"
        />
        {error && <p className="text-red-400 text-xs mb-2">PIN 碼錯誤</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm">取消</button>
          <button onClick={handleSubmit} className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">確認</button>
        </div>
      </div>
    </div>
  )
}
