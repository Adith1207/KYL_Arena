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
 * Creates an administrative server-side Supabase client instance using the service role key.
 * This client bypasses Row Level Security (RLS) policies.
 * Falls back to a Mock Client if environment values are empty or set to placeholders.
 */
export async function createAdminClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isMock = 
    !url || 
    url.includes("placeholder") || 
    !serviceRoleKey || 
    serviceRoleKey.includes("placeholder");

  if (isMock) {
    if (url && !url.includes("placeholder")) {
      console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is a placeholder or not set, but NEXT_PUBLIC_SUPABASE_URL is configured. Bypassing administrative client to Mock Client. Database updates will be mocked!");
    }
    const cookieStore = await cookies();
    return createMockServerClient(cookieStore) as unknown as SupabaseClient;
  }

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op
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
      return new MockQueryBuilder(table, cookieStore) as any;
    }
  };
}

class MockQueryBuilder {
  private table: string;
  private cookieStore: any;
  private isBrowser: boolean;
  private mutationValues: any = null;
  private limitCount: number = -1;

  constructor(table: string, cookieStore?: any) {
    this.table = table;
    this.cookieStore = cookieStore;
    this.isBrowser = typeof window !== "undefined";
  }

  select(columns?: string, options?: any) {
    return this;
  }

  eq(column: string, value: any) {
    return this;
  }

  order(column: string, options?: any) {
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  upsert(values: any, options?: any) {
    this.mutationValues = values;
    if (this.table === "strava_connections") {
      this.setCookieOrLocalStorage("kyl-mock-strava-linked", "true");
    } else if (this.table === "activities") {
      this.setCookieOrLocalStorage("kyl-mock-activities-synced", "true");
      this.setCookieOrLocalStorage("kyl-mock-last-synced-at", new Date().toISOString());
    }
    return this;
  }

  update(values: any) {
    this.mutationValues = values;
    if (values.strava_connected === true) {
      this.setCookieOrLocalStorage("kyl-mock-strava-linked", "true");
    } else if (values.strava_connected === false) {
      this.setCookieOrLocalStorage("kyl-mock-strava-linked", "false");
      this.setCookieOrLocalStorage("kyl-mock-activities-synced", "false");
      this.setCookieOrLocalStorage("kyl-mock-last-synced-at", "");
    }
    
    if (values.last_synced_at) {
      this.setCookieOrLocalStorage("kyl-mock-last-synced-at", values.last_synced_at);
    }
    return this;
  }

  delete() {
    this.mutationValues = { deleted: true };
    if (this.table === "strava_connections") {
      this.setCookieOrLocalStorage("kyl-mock-strava-linked", "false");
      this.setCookieOrLocalStorage("kyl-mock-activities-synced", "false");
      this.setCookieOrLocalStorage("kyl-mock-last-synced-at", "");
    }
    return this;
  }

  async single() {
    const res = await this.execute();
    return {
      data: Array.isArray(res.data) ? res.data[0] || null : res.data,
      error: res.error,
      count: res.count
    };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private setCookieOrLocalStorage(name: string, value: string) {
    if (this.isBrowser) {
      localStorage.setItem(name.replace(/-/g, "_"), value);
      document.cookie = `${name}=${value}; path=/; max-age=3600; SameSite=Lax`;
    } else if (this.cookieStore) {
      try {
        this.cookieStore.set(name, value, { path: "/" });
      } catch (e) {
        // Safe catch
      }
    }
  }

  private getCookieOrLocalStorage(name: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(name.replace(/-/g, "_"));
    } else if (this.cookieStore) {
      return this.cookieStore.get(name)?.value || null;
    }
    return null;
  }

  private async execute() {
    if (this.mutationValues !== null) {
      return { data: null, error: null, count: null };
    }

    let provider = "google";
    let isStravaLinked = false;
    let lastSyncedAt = null;

    if (this.isBrowser) {
      const mockUser = localStorage.getItem("kyl_mock_user");
      if (mockUser) {
        provider = JSON.parse(mockUser).app_metadata.provider;
      }
      isStravaLinked = localStorage.getItem("kyl_mock_strava_linked") === "true";
      lastSyncedAt = localStorage.getItem("kyl_mock_last_synced_at");
    } else if (this.cookieStore) {
      provider = this.cookieStore.get("kyl-mock-provider")?.value || "google";
      isStravaLinked = this.cookieStore.get("kyl-mock-strava-linked")?.value === "true";
      lastSyncedAt = this.cookieStore.get("kyl-mock-last-synced-at")?.value || null;
    }

    const isStrava = provider === "strava" || isStravaLinked;

    if (this.table === "profiles") {
      return {
        data: {
          id: "mock-uuid-12345678",
          email: isStrava ? "athlete@strava.com" : "athlete@gmail.com",
          name: isStrava ? "Adith Strava" : "Adith Google",
          avatar: isStrava 
            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
            : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
          auth_provider: provider,
          strava_connected: isStrava,
          strava_athlete_id: isStrava ? "strava-athlete-999" : null,
          last_synced_at: lastSyncedAt || null,
        },
        error: null,
        count: null
      };
    }

    if (this.table === "strava_connections") {
      if (isStrava) {
        return {
          data: {
            athlete_name: "Adith Strava",
            athlete_username: "adith_strava",
            athlete_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
            access_token: "mock_access_token_12345",
            refresh_token: "mock_refresh_token_12345",
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            strava_athlete_id: "strava-athlete-999",
          },
          error: null,
          count: null
        };
      }
      return { data: null, error: new Error("No connection"), count: null };
    }

    if (this.table === "activities") {
      if (!isStrava) {
        return { data: [], error: null, count: 0 };
      }
      const hasSynced = this.getCookieOrLocalStorage("kyl-mock-activities-synced") === "true";
      if (hasSynced) {
        const mockActs = generateMockQueryActivities();
        const sliced = this.limitCount > 0 ? mockActs.slice(0, this.limitCount) : mockActs;
        return {
          data: sliced,
          error: null,
          count: 30
        };
      } else {
        return { data: [], error: null, count: 0 };
      }
    }

    return { data: null, error: null, count: null };
  }
}

function generateMockQueryActivities(): any[] {
  const activities = [];
  const sportTypes = ["Ride", "Run", "Walk"];
  const names = {
    "Ride": ["Morning Ride 🚴", "Weekend Century 🚴‍♂️", "Sunset Cruise 🌅", "Interval Training 🔥", "Commute to Office 💼"],
    "Run": ["Evening Jog 🏃", "Interval Session ⚡", "Long Run 🌳", "Recovery Run 🍃", "Morning Miles 🌅"],
    "Walk": ["Lunch Walk 🚶", "Evening Stroll 🌇", "Dog Walk 🐾", "Park Wander 🌲", "Morning Coffee Walk ☕"]
  };

  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const sportType = sportTypes[i % sportTypes.length];
    const sportNames = names[sportType as keyof typeof names];
    const name = sportNames[i % sportNames.length];

    let distance = 0;
    let movingTime = 0;
    let elevationGain = 0;

    if (sportType === "Ride") {
      distance = Math.round((20 + (i * 2.5)) * 1000);
      movingTime = Math.round((distance / 25) * 3.6);
      elevationGain = Math.round(150 + (i * 35));
    } else if (sportType === "Run") {
      distance = Math.round((5 + (i * 0.5)) * 1000);
      movingTime = Math.round((distance / 10) * 3.6);
      elevationGain = Math.round(20 + (i * 5));
    } else {
      distance = Math.round((2 + (i * 0.2)) * 1000);
      movingTime = Math.round((distance / 5) * 3.6);
      elevationGain = Math.round(5 + i);
    }

    const startDate = new Date(now.getTime() - (i * 1.5 * 24 * 60 * 60 * 1000));

    activities.push({
      name,
      distance,
      moving_time: movingTime,
      elapsed_time: movingTime + 120,
      sport_type: sportType,
      start_date: startDate.toISOString(),
      start_date_local: startDate.toISOString(),
      average_speed: Number((distance / movingTime).toFixed(2)),
      total_elevation_gain: elevationGain,
    });
  }

  return activities;
}
