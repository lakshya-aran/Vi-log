import { duration, entryMs, formatTime, groupByDay } from '../format'

export default function EntryList({ entries, onDelete }) {
  return groupByDay(entries).map((day) => (
    <section className="day" key={day.key}>
      <div className="day-head"><h3>{day.label}</h3><span className="total">{duration(day.ms)}</span></div>
      <ul className="entries">
        {day.entries.map((e) => (
          <li key={e.id}>
            <div className="when">
              {formatTime(e.startedAt)} – {formatTime(e.endedAt)}
              <span className="dur">{duration(entryMs(e))}</span>
            </div>
            <div className="what">
              {e.project && <span className="tag">{e.project}</span>}
              <p>{e.notes}</p>
            </div>
            <button className="link danger" onClick={() => confirm('Delete this entry?') && onDelete(e.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  ))
}
