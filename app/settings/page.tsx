'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PFAccount, User } from '@/components/JournalApp'
import PinModal from '@/components/PinModal'

type UserWithDraft = User & { newPin?: string }
type SymbolSetting = { symbol: string; point_value: number; commission: number }

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<PFAccount[]>([])
  const [newName, setNewName] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [newDrawdown, setNewDrawdown] = useState('')
  const [newSize, setNewSize] = useState('')
  const [savedId, setSavedId] = useState<number | null>(null)

  const [users, setUsers] = useState<UserWithDraft[]>([])
  const [newUserName, setNewUserName] = useState('')

  const [symbolSettings, setSymbolSettings] = useState<SymbolSetting[]>([])
  const [savedSymbol, setSavedSymbol] = useState<string | null>(null)
  const loadSymbols = () => fetch('/api/symbol-settings').then(r => r.json()).then(setSymbolSettings)

  // PIN 驗證用：pendingAction 是驗證通過後要執行的動作
  const [pinVerifyUser, setPinVerifyUser] = useState<User | null>(null)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const loadUsers = () => fetch('/api/users').then(r => r.json()).then(setUsers)
  const load = () => fetch('/api/pf-accounts').then(r => r.json()).then(setAccounts)
  useEffect(() => { load(); loadUsers(); loadSymbols() }, [])

  // 需要 PIN 驗證時呼叫這個，通過後執行 action
  const withPinGuard = (user: UserWithDraft, action: () => void) => {
    if (user.has_pin) {
      setPinVerifyUser(user)
      setPendingAction(() => action)
    } else {
      action()
    }
  }

  const saveUser = async (u: UserWithDraft) => {
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, name: u.name, pin: u.newPin ?? undefined })
    })
    loadUsers()
  }

  const removePin = async (u: UserWithDraft) => {
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, name: u.name, pin: '' })
    })
    loadUsers()
  }

  const deleteUser = async (id: number) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    loadUsers()
  }

  const addAccount = async () => {
    if (!newName) return
    await fetch('/api/pf-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, daily_loss_limit: parseFloat(newLimit)||0, max_drawdown: parseFloat(newDrawdown)||0, account_size: parseFloat(newSize)||0 })
    })
    setNewName(''); setNewLimit(''); setNewDrawdown(''); setNewSize('')
    load()
  }

  const updateAccount = async (a: PFAccount) => {
    await fetch('/api/pf-accounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a)
    })
    setSavedId(a.id)
    setTimeout(() => setSavedId(null), 1500)
  }

  const deleteAccount = async (id: number) => {
    if (!confirm('確定刪除這個帳戶？')) return
    await fetch(`/api/pf-accounts?id=${id}`, { method: 'DELETE' })
    load()
  }

  const updateField = (id: number, field: keyof PFAccount, value: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: field === 'name' ? value : parseFloat(value)||0 } : a))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">PF 帳戶設定</h1>
      </div>

      {/* Existing accounts */}
      <div className="space-y-3 mb-8">
        {accounts.map(a => (
          <div key={a.id} className="bg-gray-900 rounded-lg p-4 space-y-3">
            <input
              value={a.name}
              onChange={e => updateField(a.id, 'name', e.target.value)}
              className="input text-sm font-semibold w-full"
              placeholder="帳戶名稱"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">每日虧損上限 ($)</label>
                <input type="number" value={a.daily_loss_limit} onChange={e => updateField(a.id, 'daily_loss_limit', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">最大回撤上限 ($)</label>
                <input type="number" value={a.max_drawdown} onChange={e => updateField(a.id, 'max_drawdown', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">帳戶大小 ($)</label>
                <input type="number" value={a.account_size} onChange={e => updateField(a.id, 'account_size', e.target.value)} className="input" />
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => deleteAccount(a.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400">
                <Trash2 size={12} /> 刪除
              </button>
              <button
                onClick={() => updateAccount(a)}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded transition-colors ${savedId === a.id ? 'bg-green-700 text-white' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}
              >
                <Save size={12} /> {savedId === a.id ? '已儲存' : '儲存'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new account */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">新增帳戶</h2>
        <input value={newName} onChange={e => setNewName(e.target.value)} className="input w-full mb-3" placeholder="帳戶名稱（例：Tradeify #2）" />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div><label className="label">每日虧損上限 ($)</label><input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} className="input" placeholder="500" /></div>
          <div><label className="label">最大回撤上限 ($)</label><input type="number" value={newDrawdown} onChange={e => setNewDrawdown(e.target.value)} className="input" placeholder="2000" /></div>
          <div><label className="label">帳戶大小 ($)</label><input type="number" value={newSize} onChange={e => setNewSize(e.target.value)} className="input" placeholder="50000" /></div>
        </div>
        <button onClick={addAccount} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium">
          <Plus size={14} /> 新增帳戶
        </button>
      </div>

      {/* User management */}
      <div className="bg-gray-900 rounded-lg p-4 mt-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-1">使用者管理</h2>
        <p className="text-xs text-gray-500 mb-3">已設定 PIN 的使用者，修改前需要先驗證</p>
        <div className="space-y-3 mb-4">
          {users.map(u => (
            <div key={u.id} className="bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={u.name}
                  onChange={e => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, name: e.target.value } : x))}
                  className="input flex-1"
                  placeholder="使用者名稱"
                />
                {u.has_pin ? <span className="text-xs text-indigo-400">🔒 已設 PIN</span> : null}
                {users.length > 1 && (
                  <button
                    onClick={() => withPinGuard(u, () => deleteUser(u.id))}
                    className="text-red-500 hover:text-red-400"
                  ><Trash2 size={14} /></button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={u.has_pin ? '輸入新 PIN（需先驗證舊的）' : '設定 PIN 碼（數字，選填）'}
                  onChange={e => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, newPin: e.target.value.replace(/\D/g, '') } : x))}
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() => withPinGuard(u, () => saveUser(u))}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs whitespace-nowrap"
                >儲存</button>
              </div>
              {u.has_pin ? (
                <button
                  onClick={() => withPinGuard(u, () => removePin(u))}
                  className="text-xs text-gray-500 hover:text-red-400"
                >移除 PIN 碼</button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newUserName}
            onChange={e => setNewUserName(e.target.value)}
            className="input flex-1"
            placeholder="新使用者名稱（例：小明）"
          />
          <button
            onClick={async () => {
              if (!newUserName) return
              await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newUserName }) })
              setNewUserName('')
              loadUsers()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
          ><Plus size={14} /> 新增</button>
        </div>
      </div>

      {/* Symbol settings */}
      <div className="bg-gray-900 rounded-lg p-4 mt-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-1">商品設定</h2>
        <p className="text-xs text-gray-500 mb-3">每點價值與每口手續費（來回）</p>
        <div className="space-y-2">
          {symbolSettings.map(s => (
            <div key={s.symbol} className="flex items-center gap-2">
              <span className="text-sm text-gray-300 w-12 font-mono">{s.symbol}</span>
              <div className="flex-1">
                <label className="label">每點價值 ($)</label>
                <input
                  type="number"
                  value={s.point_value}
                  onChange={e => setSymbolSettings(prev => prev.map(x => x.symbol === s.symbol ? { ...x, point_value: parseFloat(e.target.value)||0 } : x))}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="label">手續費 / 口 ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={s.commission}
                  onChange={e => setSymbolSettings(prev => prev.map(x => x.symbol === s.symbol ? { ...x, commission: parseFloat(e.target.value)||0 } : x))}
                  className="input"
                />
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/symbol-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
                  setSavedSymbol(s.symbol)
                  setTimeout(() => setSavedSymbol(null), 1500)
                }}
                className={`px-3 py-1.5 rounded text-xs mt-4 whitespace-nowrap ${savedSymbol === s.symbol ? 'bg-green-700 text-white' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}
              >{savedSymbol === s.symbol ? '已儲存' : '儲存'}</button>
            </div>
          ))}
        </div>
      </div>

      {/* PIN verification modal */}
      {pinVerifyUser && pendingAction && (
        <PinModal
          userName={pinVerifyUser.name}
          userId={pinVerifyUser.id}
          onSuccess={() => {
            pendingAction()
            setPinVerifyUser(null)
            setPendingAction(null)
          }}
          onCancel={() => {
            setPinVerifyUser(null)
            setPendingAction(null)
          }}
        />
      )}
    </div>
  )
}
