"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowser() {
  if (!client) {
    client = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}
