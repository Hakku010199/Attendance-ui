# School Attendance Dashboard (UI only)

    npm install
    npm run dev

Frontend only: no backend, no database. Mock data lives in `src/data/students.js`.
To use real data later, pass `divisions` and `students` props to `AttendanceDashboard`
(shapes: division `{ id, name }`, student `{ id, rollNumber, name, divisionId }`).
