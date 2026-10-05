// Mock data. Shapes match what an API/database would return later:
//   division: { id, name }
//   student:  { id, rollNumber, name, divisionId }
// Replace these exports (or pass real arrays as props to AttendanceDashboard)
// without touching any component.

export const divisions = [
  { id: "division-a", name: "Division A" },
  { id: "division-b", name: "Division B" },
  { id: "division-c", name: "Division C" },
];

const STUDENTS_PER_DIVISION = 50;

export const students = divisions.flatMap((division) =>
  Array.from({ length: STUDENTS_PER_DIVISION }, (_, i) => ({
    id: `${division.id}-student-${i + 1}`,
    rollNumber: i + 1,
    name: `Student ${i + 1}`,
    divisionId: division.id,
  }))
);
