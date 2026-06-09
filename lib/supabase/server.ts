import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase client instance.
 * Reads Next.js request cookies and falls back to a Mock Client if environment values are empty.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isMock = 
    !url || 
    url.includes("placeholder") || 
    !anonKey || 
    anonKey.includes("placeholder");

  if (isMock) {
    return createMockServerClient(cookieStore) as unknown as SupabaseClient;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Allowed to fail if called from Server Components during static rendering or layout runs
        }
      },
    },
  }) as unknown as SupabaseClient;
}

/**
 * Generates a mock server client matching the Supabase JS server client structure.
 */
function createMockServerClient(cookieStore: any) {
  return {
    auth: {
      async getSession() {
        const mockAuthCookie = cookieStore.get("kyl-mock-auth");
        if (!mockAuthCookie || mockAuthCookie.value !== "true") {
          return { data: { session: null }, error: null };
        }
        
        const providerCookie = cookieStore.get("kyl-mock-provider");
        const provider = providerCookie?.value || "google";

        const user = {
          id: "mock-uuid-12345678",
          email: provider === "strava" ? "athlete@strava.com" : "athlete@gmail.com",
          user_metadata: {
            full_name: provider === "strava" ? "Adith Strava" : "Adith Google",
            avatar_url: provider === "strava" 
              ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
              : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
            provider: provider,
          },
          app_metadata: {
            provider: provider,
          }
        };

        return { data: { session: { user, access_token: "mock-token" } }, error: null };
      },

      async getUser() {
        const mockAuthCookie = cookieStore.get("kyl-mock-auth");
        if (!mockAuthCookie || mockAuthCookie.value !== "true") {
          return { data: { user: null }, error: null };
        }

        const providerCookie = cookieStore.get("kyl-mock-provider");
        const provider = providerCookie?.value || "google";

        const user = {
          id: "mock-uuid-12345678",
          email: provider === "strava" ? "athlete@strava.com" : "athlete@gmail.com",
          user_metadata: {
            full_name: provider === "strava" ? "Adith Strava" : "Adith Google",
            avatar_url: provider === "strava" 
              ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
              : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
            provider: provider,
          },
          app_metadata: {
            provider: provider,
          }
        };

        return { data: { user }, error: null };
      },

      async signOut() {
        return { error: null };
      },

      async exchangeCodeForSession(code: string) {
        return { data: { session: null }, error: null };
      }
    },

    from(table: string) {
      return {
        select(columns?: string) {
          return {
            eq(column: string, value: any) {
              return {
                async single() {
                  const providerCookie = cookieStore.get("kyl-mock-provider");
                  const provider = providerCookie?.value || "google";
                  const isStravaLinked = cookieStore.get("kyl-mock-strava-linked")?.value === "true";
                  const isStrava = provider === "strava" || isStravaLinked;

                  return {
                    data: {
                      id: "mock-uuid-12345678",
                      email: provider === "strava" ? "athlete@strava.com" : "athlete@gmail.com",
                      name: provider === "strava" ? "Adith Strava" : "Adith Google",
                      avatar: provider === "strava" 
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                      auth_provider: provider,
                      strava_connected: isStrava,
                      strava_athlete_id: isStrava ? "strava-athlete-999" : null,
                    },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}
