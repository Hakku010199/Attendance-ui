export default function AttendanceFilters({
  date, onDateChange, divisions, divisionId, onDivisionChange,
  divisionsLoading, studentCounts = {},
}) {
  return (
    <section className="filters" aria-label="Attendance filters">
      <div className="field field--date">
        <label htmlFor="attendance-date">DATE</label>
        <div className="date-wrap">
          <input id="attendance-date" className="control date-input" type="date" value={date}
            onChange={(e) => onDateChange(e.target.value)} />
          <svg className="date-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
        </div>
      </div>

      <div className="field field--division">
        <label htmlFor="attendance-division">DIVISION</label>
        <select id="attendance-division" className="control select" value={divisionId}
          onChange={(e) => onDivisionChange(e.target.value)}
          disabled={divisionsLoading || divisions.length === 0}>
          {divisionsLoading && <option value="">Loading divisions…</option>}
          {!divisionsLoading && divisions.length === 0 && <option value="">No divisions yet</option>}
          {divisions.map((d) => {
            const count = studentCounts[String(d.id)];
            const label = count === undefined ? d.name : `${d.name} (${count})`;
            return <option key={d.id} value={d.id}>{label}</option>;
          })}
        </select>
      </div>
    </section>
  );
}


