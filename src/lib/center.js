// Center identity ALWAYS comes from: auth user -> center_members -> centers.
// Same pattern as center-portal, so both apps agree on who owns what.
import { supabase } from "./supabase.js";

export async function getCurrentMembership(userId) {
  let id = userId;
  if (!id) {
    const { data } = await supabase.auth.getUser();
    id = data?.user?.id;
  }
  if (!id) return { membership: null, error: "Your session has expired. Please log in again." };
  const { data, error } = await supabase
    .from("center_members")
    .select("id, user_id, center_id, role, created_at")
    .eq("user_id", id)
    .maybeSingle();
  if (error) return { membership: null, error: "Unable to load your center membership. Please try again." };
  return { membership: data ?? null, error: null };
}

export async function getCurrentCenter(userId) {
  const { membership, error } = await getCurrentMembership(userId);
  if (error) return { center: null, membership: null, error };
  if (!membership) return { center: null, membership: null, error: null };
  const { data, error: cErr } = await supabase
    .from("centers")
    .select("id, name, slug, email, phone, address, status, onboarding_completed")
    .eq("id", membership.center_id)
    .maybeSingle();
  if (cErr) return { center: null, membership, error: "Unable to load your center. Please try again." };
  return { center: data ?? null, membership, error: null };
}

export async function requireCenterId() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("Your session has expired. Please log in again.");
  const { membership, error } = await getCurrentMembership(uid);
  if (error) throw new Error(error);
  if (!membership) {
    throw new Error(
      "No center is linked to this login. Please register your center in the Center Portal first, then sign in here."
    );
  }
  return membership.center_id;
}
