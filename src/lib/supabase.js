import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !String(supabaseUrl).includes("placeholder") &&
    !String(supabaseKey).includes("placeholder") &&
    !String(supabaseUrl).includes("your-project-ref")
);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY. Check your .env file."
  );
}

// Single shared client (same Supabase project as center-portal, so the
// same email/password works here). Placeholder fallback keeps the app
// from crashing before env is set — auth calls will fail gracefully.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-publishable-key"
);


