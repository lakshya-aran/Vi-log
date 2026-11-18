import { useState } from 'react'
import { duration, formatDay } from '../format'
import { heatmap, level } from '../stats'
import { saveGoals } from '../entries'
import { Icon, btn, field, labelCls } from './ui'

const LEVEL_BG = [
  'bg-surface-container-high',
  'bg-secondary/25',
  'bg-secondary/50',
  'bg-secondary/75',
  'bg-secondary',
]

export function Heatmap({ entries, weeks = 12 }) {
  const cols = heatmap(entries, weeks)
  return (
    <div>
      <div className="flex gap-[3px] sm:gap-1 overflow-x-auto pb-1" role="img" aria-label={`Activity over the last ${weeks} weeks`}>
        <div className="flex flex-col gap-[3px] sm:gap-1 pr-1 text-[9px] text-on-surface-variant justify-between py-0.5">
          <span>Mon</span><span>Thu</span><span>Sun</span>
        </div>
        {cols.map((col, w) => (
          <div key={w} className="flex flex-col gap-[3px] sm:gap-1">
            {col.map((d) => (
              <div key={d.key}
                title={d.future ? '' : `${formatDay(d.date)} · ${d.ms ? duration(d.ms) : 'no time logged'}`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-transform hover:scale-125 ${d.future ? 'opacity-0' : LEVEL_BG[level(d.ms)]}`}
                style={{ animation: 'pop .3s both', animationDelay: `${w * 25}ms` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-on-surface-variant">
        Less {LEVEL_BG.map((c) => <span key={c} className={`w-2.5 h-2.5 rounded-[3px] ${c}`} />)} More
      </div>
    </div>
  )
}

export function GoalEditor({ user, profile, onClose }) {
  const [daily, setDaily] = useState(String(profile.dailyGoalMin / 60))
  const [weekly, setWeekly] = useState(String(profile.weeklyGoalMin / 60))

  async function save(e) {
    e.preventDefault()
    const d = Math.round(Math.max(0, Math.min(24, Number(daily) || 0)) * 60)
    const w = Math.round(Math.max(0, Math.min(168, Number(weekly) || 0)) * 60)
    await saveGoals(user, { dailyGoalMin: d, weeklyGoalMin: w })
    onClose()
  }

  return (
    <form onSubmit={save} className="space-y-3 animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <label><span className={labelCls}>Daily goal (h)</span><input type="number" step="0.5" min="0" max="24" className={field} value={daily} onChange={(e) => setDaily(e.target.value)} /></label>
        <label><span className={labelCls}>Weekly goal (h)</span><input type="number" step="1" min="0" max="168" className={field} value={weekly} onChange={(e) => setWeekly(e.target.value)} /></label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn.soft} onClick={onClose}>Cancel</button>
        <button className={btn.primary}><Icon name="flag" className="text-[18px]" />Save goals</button>
      </div>
    </form>
  )
}
