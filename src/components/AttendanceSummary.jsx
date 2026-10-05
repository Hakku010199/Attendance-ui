import SummaryCard from "./SummaryCard.jsx";

export default function AttendanceSummary({ total, present, absent }) {
  return (
    <section className="summary" aria-label="Attendance summary" aria-live="polite">
      <SummaryCard label="TOTAL" value={total} />
      <SummaryCard label="PRESENT" value={present} variant="present" />
      <SummaryCard label="ABSENT" value={absent} variant="absent" />
    </section>
  );
}
