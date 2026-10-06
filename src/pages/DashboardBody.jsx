import { useEffect, useState } from "react";
import AttendanceHeader from "../components/AttendanceHeader.jsx";
import AttendanceFilters from "../components/AttendanceFilters.jsx";
import AttendanceSummary from "../components/AttendanceSummary.jsx";
import StudentGrid from "../components/StudentGrid.jsx";
import { fetchDivisions } from "../lib/divisions.js";
import { fetchStudentsByDivision, fetchDivisionStudentCounts } from "../lib/students.js";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { useAuth } from "../lib/auth.jsx";

const ABS_BASE = "attendance-absences";
const NO_ABS = {};
function readStored(k) {
  try {
    const r = localStorage.getItem(k);
    if (!r) return {};
    const p = JSON.parse(r);
    return p && typeof p === "object" ? p : {};
  } catch { return {}; }
}
const todayISO = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function DashboardBody({ centerId }) {
  const { center, user, signOut } = useAuth();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [divError, setDivError] = useState("");
  const [date, setDate] = useState(todayISO);
  const [divisionId, setDivisionId] = useState("");
  const [roster, setRoster] = useState([]);
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState("");
  const [counts, setCounts] = useState({});
  const absKey = `${ABS_BASE}:${centerId ?? "local"}`;
  const [absences, setAbsences] = useState(() => readStored(absKey));
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const centerName = center?.name ?? "";

  // Reload stored absences when the center changes (e.g. after login)
  useEffect(() => { setAbsences(readStored(absKey)); }, [absKey]);

  // Persist absences to localStorage on every change — survives page refresh
  useEffect(() => {
    try { localStorage.setItem(absKey, JSON.stringify(absences)); } catch { /* noop */ }
  }, [absences, absKey]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true); setDivError("");
      try {
        const r = await fetchDivisions();
        if (dead) return;
        setDivisions(r.divisions);
        setDivisionId((p) => {
          if (p && r.divisions.some((d) => String(d.id) === String(p))) return p;
          return r.divisions[0]?.id ?? "";
        });
      } catch (e) { if (!dead) setDivError(e?.message ?? "Err"); }
      finally { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, [centerId]);

  const key = `${date}|${divisionId}`;
  const absentMap = absences[key] ?? NO_ABS;

  useEffect(() => {
    if (!divisionId) { setRoster([]); setSError(""); return; }
    let dead = false;
    (async () => {
      setSLoading(true); setSError("");
      try {
        const rows = await fetchStudentsByDivision(divisionId);
        if (!dead) setRoster(rows);
      } catch (e) {
        if (!dead) { setRoster([]); setSError(e?.message ?? "Err"); }
      } finally { if (!dead) setSLoading(false); }
    })();
    return () => { dead = true; };
  }, [divisionId, centerId]);

  useEffect(() => {
    if (!isSupabaseConfigured || divisions.length === 0) return;
    let dead = false;
    (async () => {
      try {
        const c = await fetchDivisionStudentCounts();
        if (!dead) setCounts(c);
      } catch { /* noop */ }
    })();
    return () => { dead = true; };
  }, [divisions, centerId]);

  const total = roster.length;
  const absent = roster.filter((s) => absentMap[s.id]).length;
  const present = total - absent;

  // Toggle a single student absent ↔ present
  const toggle = (id) => {
    setAbsences((prev) => {
      const n = { ...(prev[key] ?? {}) };
      if (n[id]) delete n[id]; else n[id] = true;
      return { ...prev, [key]: n };
    });
    setSubmitMsg("");
  };

  // Mark every student present (clears the absent map for this key)
  const markAllPresent = () => {
    setAbsences((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    setSubmitMsg("");
  };

  // Mark every student absent
  const markAllAbsent = () => {
    if (roster.length === 0) return;
    const allAbsent = {};
    roster.forEach((s) => { allAbsent[s.id] = true; });
    setAbsences((prev) => ({ ...prev, [key]: allAbsent }));
    setSubmitMsg("");
  };

  // Submit: send current attendance to the backend only on explicit click
  const submitAttendance = async () => {
    if (!isSupabaseConfigured) {
      setSubmitMsg("Supabase is not configured.");
      return;
    }
    if (roster.length === 0) {
      setSubmitMsg("No students to submit.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const { supabase } = await import("../lib/supabase.js");
      const records = roster.map((s) => ({
        student_id: s.id,
        division_id: divisionId,
        date: date,
        status: absentMap[s.id] ? "absent" : "present",
      }));
      const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "student_id,date" });
      if (error) throw new Error(error.message);
      setSubmitMsg(
        `✓ Attendance submitted for ${records.length} student${records.length !== 1 ? "s" : ""}.`
      );
    } catch (e) {
      setSubmitMsg(`Error: ${e?.message ?? "Submission failed."}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="attendance-page">
      <AttendanceHeader centerName={centerName} userEmail={user?.email} onSignOut={signOut} />
      <main className="container">
        <AttendanceFilters
          date={date} onDateChange={setDate}
          divisions={divisions} divisionId={divisionId} onDivisionChange={setDivisionId}
          divisionsLoading={loading} studentCounts={counts}
        />
        {divError && <p className="notice notice--error">{divError}</p>}
        {!loading && divisions.length === 0 && (
          <p className="notice">
            No divisions for <b>{centerName || "center"}</b> yet. Add them in Center Portal.
          </p>
        )}
        <AttendanceSummary total={total} present={present} absent={absent} />
        {sError && <p className="notice notice--error">{sError}</p>}
        {sLoading ? (
          <div className="panel empty">Loading students…</div>
        ) : (
          <>
            <StudentGrid students={roster} absentMap={absentMap} onToggle={toggle} />
            {roster.length > 0 && (
              <div className="attendance-action-bar">
                <button
                  type="button"
                  className="action-btn action-btn--present"
                  onClick={markAllPresent}
                  disabled={submitting}
                >
                  All Present
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--submit"
                  onClick={submitAttendance}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--absent"
                  onClick={markAllAbsent}
                  disabled={submitting}
                >
                  All Absent
                </button>
              </div>
            )}
            {submitMsg && (
              <p className={`notice${submitMsg.startsWith("✓") ? " notice--success" : " notice--error"}`}>
                {submitMsg}
              </p>
            )}
            {(() => {
              const absentees = roster.filter((s) => absentMap[s.id]);
              if (absentees.length === 0) return null;
              return (
                <div className="absentees-panel panel">
                  <p className="absentees-heading">
                    Absent <span className="absentees-count">{absentees.length}</span>
                  </p>
                  <ol className="absentees-list">
                    {absentees.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="absentees-item"
                          onClick={() => toggle(s.id)}
                          title="Click to mark present"
                        >
                          <span className="absentees-roll">{s.rollNumber}</span>
                          <span className="absentees-name">{s.name}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
