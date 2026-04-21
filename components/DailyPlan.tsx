'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PFAccount } from './JournalApp'

type Props = {
  pfAccounts: PFAccount[]
  activePfId: string
  onPfChange: (id: string) => void
  activeUserId: string
  viewDate: string
}

export default function DailyPlan({ pfAccounts, activePfId, onPfChange, activeUserId, viewDate }: Props) {
  const [open, setOpen] = useState(true)
  const [keyLevels, setKeyLevels] = useState('')
  const [plan, setPlan] = useState('')
  const [maxTrades, setMaxTrades] = useState('')
  const [daySummary, setDaySummary] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!activePfId || !viewDate) return
    fetch(`/api/daily-plan?date=${viewDate}&pf=${activePfId}&user=${activeUserId}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setKeyLevels(data.key_levels || '')
          setPlan(data.plan || '')
          setMaxTrades(data.max_trades ? String(data.max_trades) : '')
          setDaySummary(data.day_summary || '')
        } else {
          setKeyLevels(''); setPlan(''); setMaxTrades(''); setDaySummary('')
        }
      })
  }, [activePfId, activeUserId, viewDate])

  const handleSave = async () => {
    if (!activePfId) return
    await fetch('/api/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: activeUserId ? parseInt(activeUserId) : null,
        date: viewDate,
        pf_account_id: parseInt(activePfId),
        key_levels: keyLevels,
        plan,
        max_trades: maxTrades ? parseInt(maxTrades) : null,
        day_summary: daySummary,
      })
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800/50"
      >
        <span>開盤前計畫 / 收盤總結</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          <div>
            <label className="label">PF 帳戶</label>
            <select value={activePfId} onChange={e => onPfChange(e.target.value)} className="input">
              <option value="">選擇帳戶</option>
              {pfAccounts.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">今日關鍵價位</label>
            <input
              type="text"
              value={keyLevels}
              onChange={e => setKeyLevels(e.target.value)}
              placeholder="例：21500 支撐 / 21650 壓力"
              className="input"
            />
          </div>
          <div>
            <label className="label">今日交易計畫</label>
            <textarea
              value={plan}
              onChange={e => setPlan(e.target.value)}
              placeholder="今天打算怎麼做？"
              rows={2}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">今日最多交易筆數</label>
            <input
              type="number"
              value={maxTrades}
              onChange={e => setMaxTrades(e.target.value)}
              placeholder="例：3"
              className="input"
            />
          </div>
          <div>
            <label className="label">收盤一句話總結</label>
            <textarea
              value={daySummary}
              onChange={e => setDaySummary(e.target.value)}
              placeholder="今天最大的問題 / 收穫是什麼？"
              rows={2}
              className="input resize-none"
            />
          </div>
          <button
            onClick={handleSave}
            className={`w-full py-1.5 rounded text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
          >
            {saved ? '已儲存' : '儲存計畫'}
          </button>
        </div>
      )}
    </div>
  )
}
