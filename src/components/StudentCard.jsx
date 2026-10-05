export default function StudentCard({ student, isAbsent = false, onToggle }) {
  // Initial state: present (green). Only red when explicitly marked absent.
  const status = isAbsent ? "absent" : "present";
  return (
    <button
      type="button"
      className={`student-card student-card--${status}`}
      aria-pressed={isAbsent}
      aria-label={`${student.name}, roll number ${student.rollNumber}, ${status}`}
      onClick={() => onToggle(student.id)}
    >
      <span className="student-roll">{student.rollNumber}</span>
      <span className="student-name">{student.name}</span>
    </button>
  );
}
