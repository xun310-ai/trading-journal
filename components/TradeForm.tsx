'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { PFAccount } from './JournalApp'

type SymbolSetting = { symbol: string; point_value: number; commission: number }

type Props = {
  pfAccounts: PFAccount[]
  activePfId: string
  onPfChange: (id: string) => void
  activeUserId: string
  viewDate: string
  onTradeAdded: () => void
}

const SYMBOLS = ['NQ', 'MNQ', 'GC', 'MGC']
const SESSIONS = ['倫敦開盤', '紐約開盤', '午後', '盤前', '其他']
const SETUPS = ['開盤突破', '回測支撐/壓力', '趨勢順勢', '逆勢反轉', '缺口填補', '其他']
const MENTAL = ['清醒', '還好', '焦慮', '報復模式']

function nowTime() {
  return new Date().toTimeString().slice(0, 5)
}

export default function TradeForm({ pfAccounts, activePfId, onPfChange, activeUserId, viewDate, onTradeAdded }: Props) {
  const [symbolSettings, setSymbolSettings] = useState<SymbolSetting[]>([])
  const [symbol, setSymbol] = useState('NQ')
  const [direction, setDirection] = useState<'多' | '空'>('多')
  const [time, setTime] = useState(nowTime())
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [contracts, setContracts] = useState('1')
  const [slPoints, setSlPoints] = useState('')
  const [tpPoints, setTpPoints] = useState('')
  const [pnl, setPnl] = useState('')
  const [pnlAuto, setPnlAuto] = useState(false)

  useEffect(() => {
    fetch('/api/symbol-settings').then(r => r.json()).then(setSymbolSettings)
  }, [])

  // 自動計算 P&L
  useEffect(() => {
    if (!entryPrice || !exitPrice) { if (pnlAuto) setPnl(''); return }
    const setting = symbolSettings.find(s => s.symbol === symbol)
    if (!setting) return
    const diff = direction === '多'
      ? parseFloat(exitPrice) - parseFloat(entryPrice)
      : parseFloat(entryPrice) - parseFloat(exitPrice)
    const qty = parseInt(contracts) || 1
    const gross = diff * setting.point_value * qty
    const commission = setting.commission * qty
    const net = gross - commission
    setPnl(net.toFixed(2))
    setPnlAuto(true)
  }, [entryPrice, exitPrice, contracts, symbol, direction, symbolSettings])
  const [setupTag, setSetupTag] = useState('')
  const [session, setSession] = useState('')
  const [entryReason, setEntryReason] = useState('')
  const [exitReason, setExitReason] = useState('')
  const [mental, setMental] = useState('清醒')
  const [brokeRules, setBrokeRules] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const rr = slPoints && tpPoints
    ? (parseFloat(tpPoints) / parseFloat(slPoints)).toFixed(2)
    : null

  const handleFiles = async (files: FileList) => {
    const newPreviews: string[] = []
    const formData = new FormData()
    for (const f of Array.from(files)) {
      newPreviews.push(URL.createObjectURL(f))
      formData.append('files', f)
    }
    setPreviews(p => [...p, ...newPreviews])
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const { paths } = await res.json()
    setUploadedPaths(p => [...p, ...paths])
  }

  const removeImage = (i: number) => {
    setPreviews(p => p.filter((_, idx) => idx !== i))
    setUploadedPaths(p => p.filter((_, idx) => idx !== i))
  }

  const [validationError, setValidationError] = useState('')

  const handleSubmit = async () => {
    if (!activePfId) { setValidationError('請選擇 PF 帳戶'); return }
    if (!entryPrice) { setValidationError('請填寫進場價'); return }
    if (!exitPrice) { setValidationError('請填寫出場價'); return }
    setValidationError('')
    setSubmitting(true)

    await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: activeUserId ? parseInt(activeUserId) : null,
        date: viewDate,
        time,
        pf_account_id: parseInt(activePfId),
        symbol,
        direction,
        entry_price: parseFloat(entryPrice),
        exit_price: parseFloat(exitPrice),
        contracts: parseInt(contracts) || 1,
        stop_loss_points: slPoints ? parseFloat(slPoints) : null,
        profit_points: tpPoints ? parseFloat(tpPoints) : null,
        pnl: pnl ? parseFloat(pnl) : 0,
        setup_tag: setupTag,
        session,
        entry_reason: entryReason,
        exit_reason: exitReason,
        mental_state: mental,
        broke_rules: brokeRules,
        screenshots: uploadedPaths,
      })
    })

    // Reset form
    setEntryPrice(''); setExitPrice(''); setContracts('1')
    setSlPoints(''); setTpPoints(''); setPnl('')
    setSetupTag(''); setSession(''); setEntryReason(''); setExitReason('')
    setMental('清醒'); setBrokeRules(false); setPreviews([]); setUploadedPaths([])
    setTime(nowTime())
    setSubmitting(false)
    onTradeAdded()
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">新增交易</h2>

      <div>
          <label className="label">PF 帳戶</label>
          <select value={activePfId} onChange={e => onPfChange(e.target.value)} className="input">
            <option value="">選擇帳戶</option>
            {pfAccounts.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
          </select>
        </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">商品</label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="input">
            {SYMBOLS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">時間</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" />
        </div>
      </div>

      {/* Direction toggle */}
      <div>
        <label className="label">方向</label>
        <div className="flex rounded overflow-hidden border border-gray-700">
          <button
            onClick={() => setDirection('多')}
            className={`flex-1 py-1.5 text-sm font-bold transition-colors ${direction === '多' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >多 Long</button>
          <button
            onClick={() => setDirection('空')}
            className={`flex-1 py-1.5 text-sm font-bold transition-colors ${direction === '空' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >空 Short</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">進場價</label>
          <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="21500" className="input" />
        </div>
        <div>
          <label className="label">出場價</label>
          <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} placeholder="21550" className="input" />
        </div>
        <div>
          <label className="label">口數</label>
          <input type="number" value={contracts} onChange={e => setContracts(e.target.value)} min="1" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">停損點數</label>
          <input type="number" value={slPoints} onChange={e => setSlPoints(e.target.value)} placeholder="10" className="input" />
        </div>
        <div>
          <label className="label">獲利點數</label>
          <input type="number" value={tpPoints} onChange={e => setTpPoints(e.target.value)} placeholder="20" className="input" />
        </div>
        <div>
          <label className="label">盈虧比 R</label>
          <div className={`input flex items-center justify-center font-bold text-sm ${rr ? (parseFloat(rr) >= 1.5 ? 'text-green-400' : parseFloat(rr) >= 1 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-600'}`}>
            {rr ? `1 : ${rr}` : '—'}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="label mb-0">P&L ($)</label>
          {pnlAuto && <span className="text-xs text-gray-500">自動計算（可手動調整）</span>}
        </div>
        <input
          type="number"
          value={pnl}
          onChange={e => { setPnl(e.target.value); setPnlAuto(false) }}
          placeholder="填入進出場價後自動帶入"
          className={`input font-semibold ${pnl && parseFloat(pnl) > 0 ? 'text-green-400' : pnl && parseFloat(pnl) < 0 ? 'text-red-400' : ''}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">策略標籤</label>
          <select value={setupTag} onChange={e => setSetupTag(e.target.value)} className="input">
            <option value="">選擇策略</option>
            {SETUPS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">交易時段</label>
          <select value={session} onChange={e => setSession(e.target.value)} className="input">
            <option value="">選擇時段</option>
            {SESSIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">進場理由</label>
        <textarea
          value={entryReason}
          onChange={e => setEntryReason(e.target.value)}
          placeholder="為什麼在這個點位進場？"
          rows={2}
          className="input resize-none"
        />
      </div>

      <div>
        <label className="label">出場理由</label>
        <textarea
          value={exitReason}
          onChange={e => setExitReason(e.target.value)}
          placeholder="為什麼在這個點位出場？"
          rows={2}
          className="input resize-none"
        />
      </div>

      <div>
        <label className="label">心理狀態</label>
        <div className="flex gap-1.5 flex-wrap">
          {MENTAL.map(m => (
            <button
              key={m}
              onClick={() => setMental(m)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                mental === m
                  ? m === '清醒' ? 'bg-blue-600 border-blue-500 text-white'
                    : m === '還好' ? 'bg-yellow-600 border-yellow-500 text-white'
                    : m === '焦慮' ? 'bg-orange-600 border-orange-500 text-white'
                    : 'bg-red-700 border-red-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >{m}</button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={brokeRules}
          onChange={e => setBrokeRules(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className={`text-sm ${brokeRules ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
          這筆違反了交易計畫
        </span>
      </label>

      {/* Screenshot upload */}
      <div>
        <label className="label">交易截圖</label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-gray-700 rounded-lg p-3 text-center cursor-pointer hover:border-gray-500 transition-colors"
        >
          <Upload size={16} className="mx-auto mb-1 text-gray-500" />
          <p className="text-xs text-gray-500">點擊或拖曳截圖上傳</p>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)} />
        </div>
        {previews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt="" className="w-16 h-16 object-cover rounded border border-gray-700" />
                <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {validationError && (
        <p className="text-red-400 text-xs text-center">{validationError}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
      >
        {submitting ? '儲存中...' : '新增這筆交易'}
      </button>
    </div>
  )
}
