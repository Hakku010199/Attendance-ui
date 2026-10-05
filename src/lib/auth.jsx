// Supabase Auth is the source of truth — same project as center-portal,
// so a center registered there signs in here with the same email/password.
// Center identity: auth user -> center_members -> centers.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isSupabaseConfigured, supabase } from "./supabase.js";
import { getCurrentCenter } from "./center.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const SUPABASE_NOT_CONFIGURED_MSG =
  "Supabase is not configured. Add VITE_SUPABASE_URL and key to .env and restart.";

const friendlyAuthError = (error, fallback) => {
  const fb = fallback || "Unable to sign in. Please try again.";
  if (!error) return fb;
  const msg = String(error.message || "").toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("fetch failed") || msg.includes("network"))
    return "Cannot reach Supabase. Check your internet connection and try again.";
  if (msg.includes("invalid api key") || msg.includes("api key") || msg.includes("placeholder"))
    return "Supabase credentials are invalid. Check VITE_SUPABASE_URL and key in .env.";
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password"))
    return "Invalid email or password.";
  if (msg.includes("email not confirmed") || msg.includes("not confirmed"))
    return "Email is not verified. Check your inbox for the verification link.";
  if (msg.includes("user already registered") || msg.includes("already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (msg.includes("email rate limit") || msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  const detail = String(error.message || "").trim();
  return detail && import.meta.env.DEV ? `${fb} (${detail})` : fb;
};

export async function loginUser({ email, password }) {
  if (!isSupabaseConfigured) return { error: SUPABASE_NOT_CONFIGURED_MSG };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error) };
    return { data };
  } catch (e) {
    return { error: friendlyAuthError(e) };
  }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) return { error: "Unable to sign out. Please try again." };
  return { data: true };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [center, setCenter] = useState(null);
  const [membership, setMembership] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerError, setCenterError] = useState("");

  const loadCenter = useCallback(async (userId) => {
    if (!userId) {
      setCenter(null);
      setMembership(null);
      return { center: null, membership: null };
    }
    setCenterLoading(true);
    setCenterError("");
    const result = await getCurrentCenter(userId);
    if (result.error) {
      setCenterError(result.error);
      setCenter(null);
      setMembership(null);
    } else {
      setCenter(result.center);
      setMembership(result.membership);
    }
    setCenterLoading(false);
    return result;
  }, []);

  const refreshCenter = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return { center: null, membership: null };
    return loadCenter(uid);
  }, [loadCenter]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!live) return;
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
        if (data?.session?.user) await loadCenter(data.session.user.id);
      } finally {
        if (live) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!live) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (nextSession?.user) await loadCenter(nextSession.user.id);
      }
      if (event === "SIGNED_OUT") {
        setCenter(null);
        setMembership(null);
        setCenterError("");
      }
    });
    return () => {
      live = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadCenter]);

  const signOut = useCallback(async () => {
    const r = await logoutUser();
    setCenter(null);
    setMembership(null);
    setUser(null);
    setSession(null);
    return r;
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      center,
      membership,
      centerId: membership?.center_id ?? center?.id ?? null,
      authLoading,
      centerLoading,
      centerError,
      isAuthenticated: Boolean(user),
      hasCenter: Boolean(membership),
      refreshCenter,
      signOut,
    }),
    [user, session, center, membership, authLoading, centerLoading, centerError, refreshCenter, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
