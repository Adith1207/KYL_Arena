import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a client-side Supabase instance.
 * Automatically switches to Mock Mode if public environment variables are set to placeholders.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isMock = 
    !url || 
    url.includes("placeholder") || 
    !anonKey || 
    anonKey.includes("placeholder");

  if (isMock) {
    return createMockBrowserClient() as unknown as SupabaseClient;
  }

  return createBrowserClient(url, anonKey) as unknown as SupabaseClient;
}

/**
 * Generates a mock browser client matching the Supabase JS Auth client structure.
 */
function createMockBrowserClient() {
  return {
    auth: {
      async getSession() {
        if (typeof window === "undefined") {
          return { data: { session: null }, error: null };
        }
        const mockUser = localStorage.getItem("kyl_mock_user");
        if (!mockUser) {
          return { data: { session: null }, error: null };
        }
        const session = {
          user: JSON.parse(mockUser),
          access_token: "mock-session-token-12345",
        };
        return { data: { session }, error: null };
      },

      async getUser() {
        if (typeof window === "undefined") {
          return { data: { user: null }, error: null };
        }
        const mockUser = localStorage.getItem("kyl_mock_user");
        if (!mockUser) {
          return { data: { user: null }, error: null };
        }
        return { data: { user: JSON.parse(mockUser) }, error: null };
      },

      async signInWithOAuth({ provider, options }: { provider: string; options?: { redirectTo?: string } }) {
        if (typeof window === "undefined") {
          return { error: new Error("Window undefined") };
        }
        
        // Define mock credentials based on the provider chosen
        const isStrava = provider === "strava";
        const email = isStrava ? "athlete@strava.com" : "athlete@gmail.com";
        const name = isStrava ? "Adith Strava" : "Adith Google";
        const avatar = isStrava 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80";

        const mockUser = {
          id: "mock-uuid-12345678",
          email: email,
          user_metadata: {
            full_name: name,
            avatar_url: avatar,
            provider: provider,
          },
          app_metadata: {
            provider: provider,
          }
        };
        
        // Persist session details across localStorage & cookies
        localStorage.setItem("kyl_mock_user", JSON.stringify(mockUser));
        document.cookie = `kyl-mock-auth=true; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `kyl-mock-provider=${provider}; path=/; max-age=3600; SameSite=Lax`;
        
        if (isStrava) {
          document.cookie = `kyl-mock-strava-linked=true; path=/; max-age=3600; SameSite=Lax`;
          localStorage.setItem("kyl_mock_strava_linked", "true");
        } else {
          document.cookie = `kyl-mock-strava-linked=false; path=/; max-age=3600; SameSite=Lax`;
          localStorage.removeItem("kyl_mock_strava_linked");
        }
        
        const redirectTo = options?.redirectTo || "/dashboard";
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 800);

        return { data: {}, error: null };
      },

      async signOut() {
        if (typeof window === "undefined") return { error: null };
        
        // Clean session cookies & storage keys
        localStorage.removeItem("kyl_mock_user");
        localStorage.removeItem("kyl_mock_strava_linked");
        
        document.cookie = "kyl-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-provider=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-strava-linked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        
        window.location.href = "/login";
        return { error: null };
      },

      async exchangeCodeForSession(code: string) {
        return { data: { session: null }, error: null };
      }
    },

    // Mock query logic returning profiles from active user memory
    from(table: string) {
      return {
        select(columns?: string) {
          return {
            eq(column: string, value: any) {
              return {
                async single() {
                  if (typeof window === "undefined") {
                    return { data: null, error: new Error("Window undefined") };
                  }
                  const mockUserStr = localStorage.getItem("kyl_mock_user");
                  if (!mockUserStr) {
                    return { data: null, error: new Error("No mock session") };
                  }
                  
                  const user = JSON.parse(mockUserStr);
                  const isStrava = 
                    user.app_metadata.provider === "strava" || 
                    localStorage.getItem("kyl_mock_strava_linked") === "true";

                  return {
                    data: {
                      id: user.id,
                      email: user.email,
                      name: user.user_metadata.full_name,
                      avatar: user.user_metadata.avatar_url,
                      auth_provider: user.app_metadata.provider,
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
