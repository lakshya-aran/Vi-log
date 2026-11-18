import { duration, entryMs, formatTime, groupByDay } from '../format'

export default function EntryList({ entries, onDelete, personName }) {
  return groupByDay(entries).map((day) => (
    <section className="day" key={day.key}>
      <div className="day-head"><h3>{day.label}</h3><span className="total">{duration(day.ms)}</span></div>
      <ul className="entries">
        {day.entries.map((e) => (
          <li key={e.id} className={onDelete ? '' : 'readonly'}>
            <span className="dur">{duration(entryMs(e))}</span>
            <div className="what">
              {personName && <strong className="person">{personName(e.uid)}</strong>}
              <span className="when">{formatTime(e.startedAt)} – {formatTime(e.endedAt)}</span>
              {e.project && <span className="tag">{e.project}</span>}
              {e.notes && <p>{e.notes}</p>}
            </div>
            {onDelete && (
              <button className="link danger" onClick={() => confirm('Delete this entry?') && onDelete(e.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  ))
}
