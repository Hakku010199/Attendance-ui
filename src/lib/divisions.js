import { supabase, isSupabaseConfigured } from "./supabase.js";
import { requireCenterId } from "./center.js";
import { divisions as mockDivisions } from "../data/students.js";

const STORAGE_KEY = "attendance-divisions";

function readLocalDivisions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((d) => d && d.id && d.name)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeLocalDivisions(divisions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(divisions));
  } catch {
    // storage unavailable (private mode etc.) - ignore
  }
}

export async function fetchDivisions() {
  // 1. Try Supabase when configured — scoped to the logged-in user's center
  //    (auth -> center_members -> center_id -> WHERE center_id = ...).
  if (isSupabaseConfigured && supabase) {
    try {
      const center_id = await requireCenterId();
      const { data, error } = await supabase
        .from("divisions")
        .select("id, name, status")
        .eq("center_id", center_id)
        .order("name", { ascending: true });
      if (!error && Array.isArray(data)) {
        return { divisions: data, source: "supabase" };
      }
      console.warn("[divisions] Supabase fetch failed, falling back to local:", error?.message);
    } catch (err) {
      // No session / no center yet (login modal open) — return empty so the
      // dashboard behind the gate renders nothing private.
      if (String(err?.message || "").includes("session") || String(err?.message || "").includes("No center")) {
        return { divisions: [], source: "supabase" };
      }
      console.warn("[divisions] Supabase fetch failed, falling back to local:", err?.message);
    }
  }

  // 2. Local fallback (keeps UI usable without DB / table not created yet)
  const local = readLocalDivisions();
  if (local) return { divisions: local, source: "local", error: null };
  return { divisions: mockDivisions, source: "mock" };
}

export async function createDivision(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Division name is required.");

  // 1. Try Supabase insert (persists across refreshes + devices)
  if (isSupabaseConfigured && supabase) {
    const center_id = await requireCenterId();
    const { data, error } = await supabase
      .from("divisions")
      .insert({ name: trimmed, center_id })
      .select("id, name")
      .single();
    if (!error && data) return { division: data, source: "supabase" };
    // Common case: table missing or RLS blocks insert -> surface helpful error
    throw new Error(
      error?.message ??
        "Could not save division to Supabase. Check the `divisions` table and RLS policies."
    );
  }

  // 2. Local fallback
  const current = readLocalDivisions() ?? mockDivisions;
  if (current.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error("That division already exists.");
  }
  const division = {
    id: `division-${Date.now()}`,
    name: trimmed,
  };
  const next = [...current, division].sort((a, b) => a.name.localeCompare(b.name));
  writeLocalDivisions(next);
  return { division, source: "local" };
}


