'use client'
import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { Trade, PFAccount } from './JournalApp'

type Props = {
  trades: Trade[]
  pfAccounts: PFAccount[]
  viewMode: 'day' | 'week' | 'month'
  viewDate: string
  selectedPF: string
  onDelete: () => void
}

function calcStats(trades: Trade[]) {
  const total = trades.length
  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl < 0)
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const winRate = total > 0 ? (wins.length / total * 100) : 0
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0
  const brokeCount = trades.filter(t => t.broke_rules).length
  // Max consecutive wins/losses
  let maxWinStreak = 0, maxLossStreak = 0, cur = 0
  for (const t of [...trades].reverse()) {
    if (t.pnl > 0) { cur = cur > 0 ? cur + 1 : 1; maxWinStreak = Math.max(maxWinStreak, cur) }
    else if (t.pnl < 0) { cur = cur < 0 ? cur - 1 : -1; maxLossStreak = Math.max(maxLossStreak, Math.abs(cur)) }
    else cur = 0
  }
  // By session
  const bySession: Record<string, { pnl: number; count: number; wins: number }> = {}
  for (const t of trades) {
    const s = t.session || '未標記'
    if (!bySession[s]) bySession[s] = { pnl: 0, count: 0, wins: 0 }
    bySession[s].pnl += t.pnl || 0
    bySession[s].count++
    if (t.pnl > 0) bySession[s].wins++
  }
  // By setup
  const bySetup: Record<string, { pnl: number; count: number; wins: number }> = {}
  for (const t of trades) {
    const s = t.setup_tag || '未標記'
    if (!bySetup[s]) bySetup[s] = { pnl: 0, count: 0, wins: 0 }
    bySetup[s].pnl += t.pnl || 0
    bySetup[s].count++
    if (t.pnl > 0) bySetup[s].wins++
  }
  return { total, wins: wins.length, losses: losses.length, totalPnl, winRate, avgWin, avgLoss, profitFactor, brokeCount, maxWinStreak, maxLossStreak, bySession, bySetup }
}

function fmt(n: number) {
  const s = Math.abs(n).toFixed(0)
  return (n >= 0 ? '+$' : '-$') + s
}

function TradeRow({ trade, onDelete }: { trade: Trade; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const screenshots: string[] = (() => {
    try { return JSON.parse(trade.screenshots || '[]') } catch { return [] }
  })()

  return (
    <div className={`border rounded-lg mb-2 overflow-hidden ${trade.broke_rules ? 'border-red-800/60' : 'border-gray-800'}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-800/50"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trade.direction === '多' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {trade.direction}
        </span>
        <span className="text-xs text-gray-400 font-mono">{trade.symbol}</span>
        <span className="text-xs text-gray-500">{trade.time}</span>
        {trade.pf_name && <span className="text-xs text-gray-600 bg-gray-800 px-1.5 rounded">{trade.pf_name}</span>}
        {trade.setup_tag && <span className="text-xs text-blue-500">{trade.setup_tag}</span>}
        {trade.session && <span className="text-xs text-purple-500">{trade.session}</span>}
        {trade.broke_rules ? <span className="text-xs text-red-500 ml-auto">違規</span> : null}
        <span className={`ml-auto text-sm font-bold ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {fmt(trade.pnl)}
        </span>
        {open ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
      </div>

      {open && (
        <div className="px-3 pb-3 border-t border-gray-800 pt-2 space-y-2">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <div><span className="text-gray-500">進場</span> <span className="text-gray-300 font-mono">{trade.entry_price}</span></div>
            <div><span className="text-gray-500">出場</span> <span className="text-gray-300 font-mono">{trade.exit_price}</span></div>
            <div><span className="text-gray-500">口數</span> <span className="text-gray-300">{trade.contracts}</span></div>
            {trade.stop_loss_points && <div><span className="text-gray-500">停損</span> <span className="text-red-400">{trade.stop_loss_points} pts</span></div>}
            {trade.profit_points && <div><span className="text-gray-500">獲利</span> <span className="text-green-400">{trade.profit_points} pts</span></div>}
            {trade.stop_loss_points && trade.profit_points && (
              <div><span className="text-gray-500">R:R</span> <span className="text-yellow-400">1:{(trade.profit_points / trade.stop_loss_points).toFixed(2)}</span></div>
            )}
          </div>
          {trade.mental_state && (
            <div className="text-xs"><span className="text-gray-500">心理狀態：</span><span className="text-gray-300">{trade.mental_state}</span></div>
          )}
          {trade.entry_reason && (
            <div className="text-xs"><span className="text-gray-500">進場理由：</span><span className="text-gray-300">{trade.entry_reason}</span></div>
          )}
          {trade.exit_reason && (
            <div className="text-xs"><span className="text-gray-500">出場理由：</span><span className="text-gray-300">{trade.exit_reason}</span></div>
          )}
          {screenshots.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {screenshots.map((s, i) => (
                <a key={i} href={s} target="_blank" rel="noreferrer">
                  <img src={s} alt="" className="h-24 rounded border border-gray-700 hover:border-gray-500 object-cover" />
                </a>
              ))}
            </div>
          )}
          <button
            onClick={async (e) => {
              e.stopPropagation()
              if (!confirm('確定刪除這筆交易？')) return
              await fetch(`/api/trades?id=${trade.id}`, { method: 'DELETE' })
              onDelete()
            }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 mt-1"
          >
            <Trash2 size={12} /> 刪除
          </button>
        </div>
      )}
    </div>
  )
}

const MENTAL_COLORS: Record<string, string> = {
  '清醒': 'bg-blue-900/60 text-blue-300 border-blue-700',
  '還好': 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  '焦慮': 'bg-orange-900/60 text-orange-300 border-orange-700',
  '報復模式': 'bg-red-900/60 text-red-300 border-red-700',
}

export default function Dashboard({ trades, pfAccounts, viewMode, viewDate, selectedPF, onDelete }: Props) {
  const [mentalFilter, setMentalFilter] = useState<string | null>(null)
  const filteredTrades = mentalFilter ? trades.filter(t => t.mental_state === mentalFilter) : trades
  const stats = calcStats(filteredTrades)

  // Per-PF daily loss progress (only for day view)
  const mentalStates = [...new Set(trades.map(t => t.mental_state).filter(Boolean))]
  const pfProgress = pfAccounts
    .filter(p => selectedPF === 'all' || String(p.id) === selectedPF)
    .map(p => {
      const pfTrades = trades.filter(t => t.pf_account_id === p.id)
      const dailyPnl = pfTrades.reduce((s, t) => s + (t.pnl || 0), 0)
      const loss = dailyPnl < 0 ? Math.abs(dailyPnl) : 0
      const pct = p.daily_loss_limit > 0 ? Math.min((loss / p.daily_loss_limit) * 100, 100) : 0
      return { ...p, dailyPnl, loss, pct }
    })

  return (
    <div className="p-4 space-y-4">
      {/* PF Loss Limit bars (day view only) */}
      {viewMode === 'day' && pfProgress.map(p => (
        <div key={p.id} className="bg-gray-900 rounded-lg p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-gray-300">{p.name}</span>
            <span className={`font-mono font-bold ${p.dailyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmt(p.dailyPnl)}
              {p.daily_loss_limit > 0 && <span className="text-gray-500 font-normal"> / 上限 ${p.daily_loss_limit}</span>}
            </span>
          </div>
          {p.daily_loss_limit > 0 && (
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${p.pct >= 80 ? 'bg-red-500' : p.pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${p.pct}%` }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Mental state filter */}
      {mentalStates.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {mentalStates.map(m => (
            <button
              key={m}
              onClick={() => setMentalFilter(mentalFilter === m ? null : m)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                mentalFilter === m
                  ? (MENTAL_COLORS[m] ?? 'bg-gray-700 text-white border-gray-600')
                  : 'bg-transparent text-gray-500 border-gray-700 hover:text-gray-300'
              }`}
            >{m} {mentalFilter === m ? '✕' : ''}</button>
          ))}
          {mentalFilter && (
            <span className="text-xs text-gray-500 self-center">篩選中：{filteredTrades.length} 筆</span>
          )}
        </div>
      )}

      {/* Stats grid */}
      {filteredTrades.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '筆數', value: stats.total, color: 'text-white' },
            { label: '勝率', value: `${stats.winRate.toFixed(0)}%`, color: stats.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
            { label: '總 P&L', value: fmt(stats.totalPnl), color: stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: '獲利因子', value: stats.profitFactor === 999 ? '∞' : stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1.5 ? 'text-green-400' : stats.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400' },
            { label: '平均盈', value: `$${stats.avgWin.toFixed(0)}`, color: 'text-green-400' },
            { label: '平均虧', value: `$${stats.avgLoss.toFixed(0)}`, color: 'text-red-400' },
            { label: '連勝', value: stats.maxWinStreak, color: 'text-blue-400' },
            { label: '連敗', value: stats.maxLossStreak, color: 'text-orange-400' },
          ].map(item => (
            <div key={item.label} className="bg-gray-900 rounded-lg p-2.5 text-center">
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session breakdown */}
      {Object.keys(stats.bySession).length > 1 && (
        <div className="bg-gray-900 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">時段分析</h3>
          <div className="space-y-1.5">
            {Object.entries(stats.bySession).map(([s, d]) => (
              <div key={s} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 w-20">{s}</span>
                <span className="text-gray-500">{d.count} 筆 / 勝率 {d.count > 0 ? Math.round(d.wins/d.count*100) : 0}%</span>
                <span className={`font-mono font-bold ${d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(d.pnl)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup breakdown */}
      {Object.keys(stats.bySetup).length > 1 && (
        <div className="bg-gray-900 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">策略分析</h3>
          <div className="space-y-1.5">
            {Object.entries(stats.bySetup).sort((a,b) => b[1].pnl - a[1].pnl).map(([s, d]) => (
              <div key={s} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 w-24">{s}</span>
                <span className="text-gray-500">{d.count} 筆 / 勝率 {d.count > 0 ? Math.round(d.wins/d.count*100) : 0}%</span>
                <span className={`font-mono font-bold ${d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(d.pnl)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violation warning */}
      {stats.brokeCount > 0 && (
        <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-3 text-sm text-red-400">
          本期間有 <strong>{stats.brokeCount}</strong> 筆違反交易計畫
        </div>
      )}

      {/* Trade list */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          交易明細 ({filteredTrades.length})
        </h3>
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            {mentalFilter ? `沒有「${mentalFilter}」狀態的交易` : viewMode === 'day' ? '今日還沒有交易紀錄' : '這段期間沒有交易紀錄'}
          </div>
        ) : (
          filteredTrades.map(t => <TradeRow key={t.id} trade={t} onDelete={onDelete} />)
        )}
      </div>
    </div>
  )
}
