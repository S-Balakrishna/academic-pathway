import { createClient } from "@supabase/supabase-js";

// Create a single Supabase client for the app using our env vars.
// The publishable key is safe in the browser because Row Level Security
// policies (configured in Supabase) control what it's actually allowed to do.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);