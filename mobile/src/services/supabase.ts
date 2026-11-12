import { createClient } from "@supabase/supabase-js";

// WeGrow Supabase Cloud Project Configuration
export const SUPABASE_URL = "https://gnysuxuizoehzyvttctu.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueXN1eHVpem9laHp5dnR0Y3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzOTcwMjYsImV4cCI6MjEwOTk3MzAyNn0.mYUQ043hvYPPWfaywnihhp0FwmHFt3uDOGYikXsx1tM";

export const isSupabaseReady = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY
  );
};

export const supabaseMobile = isSupabaseReady()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    })
  : null;
