// Student service — reads from Supabase `public.students`, always scoped to
// the logged-in user's center (auth -> center_members -> center_id).
// Table shape: id, student_id, name, roll_number, division_id, center_id,
// status, created_at, updated_at. UI object maps snake_case -> camelCase.
import { supabase, isSupabaseConfigured } from "./supabase.js";
import { requireCenterId } from "./center.js";

const SELECT_COLUMNS = "id, student_id, name, roll_number, division_id, center_id, status";

export function mapStudentRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    rollNumber: row.roll_number,
    name: row.name,
    divisionId: row.division_id,
    status: row.status,
  };
}

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and key in .env and restart the dev server."
    );
  }
  return supabase;
}

// All active students of one division, ordered by roll number — but ONLY
// rows belonging to the caller's center, and only when the division itself
// belongs to that center (prevents cross-center id guessing).
// One grid button is rendered per returned row.
export async function fetchStudentsByDivision(divisionId) {
  if (!divisionId) return [];
  const client = ensureSupabase();
  const center_id = await requireCenterId();

  // Verify the division belongs to this center first.
  const { data: div, error: divErr } = await client
    .from("divisions")
    .select("id")
    .eq("id", divisionId)
    .eq("center_id", center_id)
    .maybeSingle();
  if (divErr) throw new Error(divErr.message || "Could not load students from Supabase.");
  if (!div) return [];

  const { data, error } = await client
    .from("students")
    .select(SELECT_COLUMNS)
    .eq("division_id", divisionId)
    .eq("center_id", center_id)
    .order("roll_number", { ascending: true });
  if (error) throw new Error(error.message || "Could not load students from Supabase.");
  return (data ?? []).map(mapStudentRow);
}

// { [divisionId]: studentCount } for every division OF THIS CENTER — used to
// render "Division A (50)" labels in the dropdown without fetching rosters.
export async function fetchDivisionStudentCounts() {
  const client = ensureSupabase();
  const center_id = await requireCenterId();
  const { data, error } = await client
    .from("students")
    .select("division_id")
    .eq("center_id", center_id);
  if (error) throw new Error(error.message || "Could not load student counts from Supabase.");
  const counts = {};
  for (const row of data ?? []) {
    const key = String(row.division_id);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

