import { createClient } from "@supabase/supabase-js"

// Service-role client — server-side only, bypasses RLS.
// Never import this in a "use client" file.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)