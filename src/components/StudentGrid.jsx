import StudentCard from "./StudentCard.jsx";

export default function StudentGrid({ students, absentMap, onToggle }) {
  if (students.length === 0) {
    return <div className="panel empty">No students in this division.</div>;
  }
  return (
    <section className="panel student-grid" aria-label="Students">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} isAbsent={Boolean(absentMap[student.id])} onToggle={onToggle} />
      ))}
    </section>
  );
}
