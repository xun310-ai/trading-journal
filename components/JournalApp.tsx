'use client'
import { useState, useEffect, useRef } from 'react'
import TradeForm from './TradeForm'
import Dashboard from './Dashboard'
import DailyPlan from './DailyPlan'
import PinModal from './PinModal'
import { Settings } from 'lucide-react'
import Link from 'next/link'

export type PFAccount = {
  id: number
  name: string
  daily_loss_limit: number
  max_drawdown: number
  account_size: number
}

export type User = {
  id: number
  name: string
  has_pin?: number
}

export type Trade = {
  id: number
  date: string
  time: string
  pf_account_id: number
  pf_name: string
  symbol: string
  direction: string
  entry_price: number
  exit_price: number
  contracts: number
  stop_loss_points: number
  profit_points: number
  pnl: number
  setup_tag: string
  session: string
  entry_reason: string
  exit_reason: string
  mental_state: string
  broke_rules: number
  screenshots: string
  daily_loss_limit: number
  max_drawdown: number
}

function NewUserInline({ onCreated }: { onCreated: (id: number) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    })
    const { id } = await res.json()
    onCreated(id)
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="px-5 py-3 border border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-gray-300 hover:border-gray-500 text-sm transition-colors"
      >+ 我是新使用者</button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="輸入你的名字"
        className="input text-center"
      />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm">取消</button>
        <button onClick={handleCreate} className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">進入</button>
      </div>
    </div>
  )
}

function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export default function JournalApp() {
  const [pfAccounts, setPfAccounts] = useState<PFAccount[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeUserId, setActiveUserId] = useState<string>('')
  const [pinTarget, setPinTarget] = useState<User | null>(null)
  const [selectedPF, setSelectedPF] = useState<string>('all')
  const [activePfId, setActivePfId] = useState<string>('')
  const [viewDate, setViewDate] = useState(todayStr())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [trades, setTrades] = useState<Trade[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch('/api/pf-accounts').then(r => r.json()).then(setPfAccounts)
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])

  useEffect(() => {
    let url = '/api/trades?'
    if (viewMode === 'day') {
      url += `date=${viewDate}`
    } else if (viewMode === 'week') {
      const d = new Date(viewDate)
      const day = d.getDay()
      const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7))
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      url += `from=${mon.toISOString().slice(0,10)}&to=${sun.toISOString().slice(0,10)}`
    } else {
      const d = new Date(viewDate)
      const from = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
      const last = new Date(d.getFullYear(), d.getMonth()+1, 0)
      const to = last.toISOString().slice(0,10)
      url += `from=${from}&to=${to}`
    }
    if (selectedPF !== 'all') url += `&pf=${selectedPF}`
    if (activeUserId) url += `&user=${activeUserId}`
    fetch(url).then(r => r.json()).then(setTrades)
  }, [viewDate, viewMode, selectedPF, activeUserId, refreshKey])

  const onTradeAdded = () => setRefreshKey(k => k + 1)

  // 使用者選擇畫面
  if (!activeUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950">
        <h1 className="text-2xl font-bold text-white mb-2">交易日誌</h1>
        <p className="text-gray-400 text-sm mb-8">請選擇你的使用者</p>
        <div className="flex flex-col gap-3 w-64">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => {
                if (u.has_pin) {
                  setPinTarget(u)
                } else {
                  setActiveUserId(String(u.id))
                }
              }}
              className="flex items-center justify-between px-5 py-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white font-medium transition-colors"
            >
              <span>{u.name}</span>
              {u.has_pin ? <span className="text-xs text-indigo-400">🔒 PIN</span> : <span className="text-xs text-gray-500">無密碼</span>}
            </button>
          ))}

          {/* 新增使用者 */}
          <NewUserInline onCreated={(id) => setActiveUserId(String(id))} />
        </div>

        {pinTarget && (
          <PinModal
            userName={pinTarget.name}
            userId={pinTarget.id}
            onSuccess={() => { setActiveUserId(String(pinTarget!.id)); setPinTarget(null) }}
            onCancel={() => setPinTarget(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">交易日誌</h1>
          {/* User switcher */}
          <div className="flex bg-gray-800 rounded overflow-hidden border border-gray-700">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  if (activeUserId === String(u.id)) return
                  if (u.has_pin) {
                    setPinTarget(u)
                  } else {
                    setActiveUserId(String(u.id))
                  }
                }}
                className={`px-3 py-1 text-sm font-medium transition-colors ${activeUserId === String(u.id) ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >{u.name}{u.has_pin ? ' 🔒' : ''}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* PF filter */}
          <select
            value={selectedPF}
            onChange={e => {
              setSelectedPF(e.target.value)
              if (e.target.value !== 'all') setActivePfId(e.target.value)
            }}
            className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200"
          >
            <option value="all">全部帳戶</option>
            {pfAccounts.map(a => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </select>
          {/* View mode */}
          <div className="flex bg-gray-800 rounded overflow-hidden border border-gray-700">
            {(['day','week','month'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-sm ${viewMode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {m === 'day' ? '日' : m === 'week' ? '週' : '月'}
              </button>
            ))}
          </div>
          {/* Date nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const d = new Date(viewDate)
                if (viewMode === 'day') d.setDate(d.getDate() - 1)
                else if (viewMode === 'week') d.setDate(d.getDate() - 7)
                else d.setMonth(d.getMonth() - 1)
                setViewDate(d.toISOString().slice(0,10))
              }}
              className="px-2 py-1 text-gray-400 hover:text-white bg-gray-800 border border-gray-700 rounded text-sm"
            >{'<'}</button>
            <input
              type="date"
              value={viewDate}
              onChange={e => setViewDate(e.target.value)}
              className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200"
            />
            <button
              onClick={() => {
                const d = new Date(viewDate)
                if (viewMode === 'day') d.setDate(d.getDate() + 1)
                else if (viewMode === 'week') d.setDate(d.getDate() + 7)
                else d.setMonth(d.getMonth() + 1)
                setViewDate(d.toISOString().slice(0,10))
              }}
              className="px-2 py-1 text-gray-400 hover:text-white bg-gray-800 border border-gray-700 rounded text-sm"
            >{'>'}</button>
            <button
              onClick={() => setViewDate(todayStr())}
              className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 bg-gray-800 border border-gray-700 rounded"
            >今日</button>
          </div>
          <Link href="/settings" className="p-1.5 text-gray-400 hover:text-white bg-gray-800 border border-gray-700 rounded">
            <Settings size={16} />
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form + Daily Plan */}
        <div className="w-96 flex-shrink-0 flex flex-col border-r border-gray-800 overflow-y-auto">
          <DailyPlan
            pfAccounts={pfAccounts}
            activePfId={activePfId}
            onPfChange={setActivePfId}
            activeUserId={activeUserId}
            viewDate={viewDate}
          />
          <TradeForm
            pfAccounts={pfAccounts}
            activePfId={activePfId}
            onPfChange={setActivePfId}
            activeUserId={activeUserId}
            viewDate={viewDate}
            onTradeAdded={onTradeAdded}
          />
        </div>

        {/* Right: Dashboard */}
        <div className="flex-1 overflow-y-auto">
          <Dashboard
            trades={trades}
            pfAccounts={pfAccounts}
            viewMode={viewMode}
            viewDate={viewDate}
            selectedPF={selectedPF}
            onDelete={onTradeAdded}
          />
        </div>
      </div>

      {pinTarget && (
        <PinModal
          userName={pinTarget.name}
          userId={pinTarget.id}
          onSuccess={() => { setActiveUserId(String(pinTarget.id)); setPinTarget(null) }}
          onCancel={() => setPinTarget(null)}
        />
      )}
    </div>
  )
}
