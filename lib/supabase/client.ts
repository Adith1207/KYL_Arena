/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
    process.env.NODE_ENV !== "production" && (
      !url || 
      url.includes("placeholder") || 
      !anonKey || 
      anonKey.includes("placeholder")
    );

  if (isMock) {
    return createMockBrowserClient() as unknown as SupabaseClient;
  }

  return createBrowserClient(url!, anonKey!) as unknown as SupabaseClient;
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
        let id = "mock-uuid-12345678";
        let email = isStrava ? "athlete@strava.com" : "athlete@gmail.com";
        let name = isStrava ? "Adith Strava" : "Adith Google";
        let avatar = isStrava 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80";

        if (!isStrava) {
          const chooseUserA = window.confirm(
            "Google Account Chooser (Mock Mode)\n\n" +
            "Click [OK] to sign in as User A (Adith Google - athlete@gmail.com)\n" +
            "Click [Cancel] to sign in as User B (User B - athleteB@gmail.com)"
          );
          if (!chooseUserA) {
            id = "mock-uuid-user-b-2222";
            email = "athleteB@gmail.com";
            name = "User B";
            avatar = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80";
          } else {
            id = "mock-uuid-user-a-1111";
            email = "athlete@gmail.com";
            name = "Adith Google";
            avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80";
          }
        }

        const mockUser = {
          id: id,
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
        const remember = typeof window !== "undefined" && localStorage.getItem("kyl_remember_device") === "true";
        const maxAgeStr = remember ? `; max-age=${30 * 24 * 3600}` : "";

        localStorage.setItem("kyl_mock_user", JSON.stringify(mockUser));
        document.cookie = `kyl-mock-auth=true; path=/${maxAgeStr}; SameSite=Lax`;
        document.cookie = `kyl-mock-provider=${provider}; path=/${maxAgeStr}; SameSite=Lax`;
        document.cookie = `kyl-mock-user-id=${mockUser.id}; path=/${maxAgeStr}; SameSite=Lax`;
        document.cookie = `kyl-mock-user-email=${mockUser.email}; path=/${maxAgeStr}; SameSite=Lax`;
        document.cookie = `kyl-mock-user-name=${encodeURIComponent(mockUser.user_metadata.full_name)}; path=/${maxAgeStr}; SameSite=Lax`;
        document.cookie = `kyl-mock-user-avatar=${encodeURIComponent(mockUser.user_metadata.avatar_url)}; path=/${maxAgeStr}; SameSite=Lax`;
        
        if (isStrava) {
          document.cookie = `kyl-mock-strava-linked=true; path=/${maxAgeStr}; SameSite=Lax`;
          localStorage.setItem("kyl_mock_strava_linked", "true");
        } else {
          document.cookie = `kyl-mock-strava-linked=false; path=/${maxAgeStr}; SameSite=Lax`;
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
        localStorage.removeItem("kyl_remember_device");
        
        document.cookie = "kyl-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-provider=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-strava-linked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-user-email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-user-name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-mock-user-avatar=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "kyl-remember-device=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        
        window.location.href = "/";
        return { error: null };
      },

      async exchangeCodeForSession(code: string) {
        return { data: { session: null }, error: null };
      }
    },

    from(table: string) {
      return new MockQueryBuilder(table) as any;
    },

    rpc: async (fnName: string, args: any) => {
      if (fnName === "get_analytics_report_data") {
        return {
          data: {
            overview: {
              totalDistance: 12450.5, totalActivities: 450, completionRate: 68.5, activeMembers: 120, newMembers: 15, challengesCompleted: 2, avgDistance: 27.6, avgActivities: 3.7
            },
            communityGrowth: [
              { date: "2026-06-01", count: 10 }, { date: "2026-06-05", count: 25 }, { date: "2026-06-15", count: 80 }
            ],
            sportDistribution: { cycling: 60, running: 25, walking: 15 },
            dailyVolume: [
              { date: "Jun 01", activities: 12, distance: 340.5 }, { date: "Jun 05", activities: 45, distance: 1250.0 }
            ],
            challengeCompletion: [
              { name: "Summer Century", participants: 12, completed: 8, remaining: 4, completion_percent: 66 }
            ],
            topAthletes: {
              byDistance: [{ name: "Adith", value: 105.4, unit: "km" }],
              byActivities: [{ name: "Adith", value: 4, unit: "acts" }],
              byElevation: [{ name: "Adith", value: 500, unit: "m" }]
            },
            communityInsights: {
              mostActiveAthlete: "Adith", mostActiveAthleteValue: 4, longestRide: "Adith", longestRideValue: 35.2, longestRun: "Emma", longestRunValue: 12.0, highestElevation: "Adith", highestElevationValue: 500, recentlyJoined: "Kevin", inactiveCount: 2
            }
          },
          error: null
        };
      }
      return { data: null, error: null };
    }
  };
}

class MockQueryBuilder {
  private table: string;
  private cookieStore: any;
  private isBrowser: boolean;
  private mutationValues: any = null;
  private limitCount: number = -1;
  private eqFilters: { column: string; value: any }[] = [];
  private inFilters: { column: string; values: any[] }[] = [];
  private gteFilters: { column: string; value: any }[] = [];
  private lteFilters: { column: string; value: any }[] = [];
  private isDelete: boolean = false;
  private orderColumn: string | null = null;
  private orderAscending: boolean = false;

  constructor(table: string, cookieStore?: any) {
    this.table = table;
    this.cookieStore = cookieStore;
    this.isBrowser = typeof window !== "undefined";
  }

  select(columns?: string, options?: any) {
    return this;
  }

  eq(column: string, value: any) {
    this.eqFilters.push({ column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.inFilters.push({ column, values });
    return this;
  }

  gte(column: string, value: any) {
    this.gteFilters.push({ column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.lteFilters.push({ column, value });
    return this;
  }

  order(column: string, options?: any) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  insert(values: any) {
    this.mutationValues = values;
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
    if (values && values.role) {
      this.setCookieOrLocalStorage("kyl-mock-role", values.role);
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
    if (values.tour_completed !== undefined) {
      this.setCookieOrLocalStorage("kyl-mock-tour-completed", values.tour_completed ? "true" : "false");
    }
    if (values.role !== undefined) {
      this.setCookieOrLocalStorage("kyl-mock-role", values.role);
    }
    return this;
  }

  delete() {
    this.isDelete = true;
    if (this.table === "strava_connections") {
      this.mutationValues = { deleted: true };
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

  async maybeSingle() {
    const res = await this.execute();
    return {
      data: Array.isArray(res.data) ? res.data[0] || null : res.data,
      error: null,
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
    // 1. Handle mutation (insert/update/delete)
    if (this.mutationValues !== null || this.isDelete) {
      if (this.table === "challenges") {
        let list = [];
        const stored = this.getCookieOrLocalStorage("kyl-mock-challenges");
        if (stored) {
          try { list = JSON.parse(stored); } catch(e) {}
        } else {
          list = getSeedChallenges();
        }
        
        if (this.mutationValues) {
          // Generate slug
          const title = this.mutationValues.title || "Challenge";
          const baseSlug = title.toLowerCase().trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
          let tempSlug = baseSlug;
          let counter = 1;
          while (list.some((c: any) => c.slug === tempSlug)) {
            tempSlug = `${baseSlug}-${counter}`;
            counter++;
          }

          // Generate challenge_code
          const startDate = this.mutationValues.start_date || "2026-01-01";
          const yearStr = startDate.split("-")[0];
          const yearChallenges = list.filter((c: any) => c.challenge_code?.startsWith(`KYL-${yearStr}-`));
          let maxSeq = 0;
          yearChallenges.forEach((c: any) => {
            const parts = c.challenge_code.split("-");
            const seq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          });
          const nextSeq = maxSeq + 1;
          const challengeCode = `KYL-${yearStr}-${String(nextSeq).padStart(3, "0")}`;

          const newChal = {
            id: this.mutationValues.id || Math.random().toString(36).substring(2, 9),
            title: this.mutationValues.title,
            description: this.mutationValues.description,
            sport_type: this.mutationValues.sport_type,
            goal_metric: this.mutationValues.goal_metric,
            goal_target: Number(this.mutationValues.goal_target),
            start_date: this.mutationValues.start_date,
            end_date: this.mutationValues.end_date,
            banner_url: this.mutationValues.banner_url || "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&w=400&q=80",
            status: this.mutationValues.status || "active",
            created_by: this.mutationValues.created_by || "mock-uuid-12345678",
            created_at: new Date().toISOString(),
            challenge_code: challengeCode,
            slug: tempSlug
          };
          list.unshift(newChal);
          this.setCookieOrLocalStorage("kyl-mock-challenges", JSON.stringify(list));
          return { data: [newChal], error: null, count: 1 };
        }
      }

      if (this.table === "challenge_participants") {
        let list = [];
        const stored = this.getCookieOrLocalStorage("kyl-mock-participants");
        if (stored) {
          try { list = JSON.parse(stored); } catch(e) {}
        } else {
          list = getSeedParticipants();
        }

        if (this.isDelete) {
          const chalIdFilter = this.eqFilters.find(f => f.column === "challenge_id")?.value;
          const userIdFilter = this.eqFilters.find(f => f.column === "user_id")?.value;
          list = list.filter((p: any) => !(p.challenge_id === chalIdFilter && p.user_id === userIdFilter));
          this.setCookieOrLocalStorage("kyl-mock-participants", JSON.stringify(list));
          return { data: null, error: null, count: 0 };
        } else if (this.mutationValues) {
          const newPart = {
            challenge_id: this.mutationValues.challenge_id,
            user_id: this.mutationValues.user_id,
            joined_at: new Date().toISOString()
          };
          // Avoid duplicate
          list = list.filter((p: any) => !(p.challenge_id === newPart.challenge_id && p.user_id === newPart.user_id));
          list.push(newPart);
          this.setCookieOrLocalStorage("kyl-mock-participants", JSON.stringify(list));
          return { data: [newPart], error: null, count: 1 };
        }
      }

      return { data: null, error: null, count: null };
    }

    // 2. Handle selects (queries)
    let provider = "google";
    let isStravaLinked = false;
    let lastSyncedAt = null;
    let tourCompleted = false;
    let mockRole = "super_admin";

    if (this.isBrowser) {
      const mockUser = localStorage.getItem("kyl_mock_user");
      if (mockUser) {
        provider = JSON.parse(mockUser).app_metadata.provider;
      }
      isStravaLinked = localStorage.getItem("kyl_mock_strava_linked") === "true";
      lastSyncedAt = localStorage.getItem("kyl_mock_last_synced_at");
      tourCompleted = localStorage.getItem("kyl_mock_tour_completed") === "true";
      mockRole = localStorage.getItem("kyl_mock_role") || "super_admin";
    } else if (this.cookieStore) {
      provider = this.cookieStore.get("kyl-mock-provider")?.value || "google";
      isStravaLinked = this.cookieStore.get("kyl-mock-strava-linked")?.value === "true";
      lastSyncedAt = this.cookieStore.get("kyl-mock-last-synced-at")?.value || null;
      tourCompleted = this.cookieStore.get("kyl-mock-tour-completed")?.value === "true";
      mockRole = this.cookieStore.get("kyl-mock-role")?.value || "super_admin";
    }

    const isStrava = provider === "strava" || isStravaLinked;

    if (this.table === "profiles") {
      const profilesList = getMockProfiles(isStrava, provider, lastSyncedAt, tourCompleted, mockRole);
      let filtered = profilesList;

      // Apply eq filters
      for (const filter of this.eqFilters) {
        filtered = filtered.filter((p: any) => p[filter.column] === filter.value);
      }
      // Apply in filters
      for (const filter of this.inFilters) {
        filtered = filtered.filter((p: any) => filter.values.includes(p[filter.column]));
      }
      // Apply gte filters
      for (const filter of this.gteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] >= filter.value);
      }
      // Apply lte filters
      for (const filter of this.lteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] <= filter.value);
      }

      return {
        data: filtered,
        error: null,
        count: filtered.length
      };
    }

    if (this.table === "challenges") {
      let list = [];
      const stored = this.getCookieOrLocalStorage("kyl-mock-challenges");
      if (stored) {
        try { list = JSON.parse(stored); } catch(e) {}
      } else {
        list = getSeedChallenges();
      }

      let filtered = list;
      // Apply eq filters
      for (const filter of this.eqFilters) {
        filtered = filtered.filter((c: any) => c[filter.column] === filter.value);
      }
      // Apply gte filters
      for (const filter of this.gteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] >= filter.value);
      }
      // Apply lte filters
      for (const filter of this.lteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] <= filter.value);
      }
      // Apply sorting
      if (this.orderColumn === "created_at" || this.orderColumn === "start_date") {
        filtered = [...filtered].sort((a: any, b: any) => {
          const valA = a[this.orderColumn!] || "";
          const valB = b[this.orderColumn!] || "";
          return this.orderAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
      }
      if (this.limitCount > 0) {
        filtered = filtered.slice(0, this.limitCount);
      }

      return { data: filtered, error: null, count: filtered.length };
    }

    if (this.table === "challenge_participants") {
      let list = [];
      const stored = this.getCookieOrLocalStorage("kyl-mock-participants");
      if (stored) {
        try { list = JSON.parse(stored); } catch(e) {}
      } else {
        list = getSeedParticipants();
      }

      let filtered = list;
      // Apply eq filters
      for (const filter of this.eqFilters) {
        filtered = filtered.filter((p: any) => p[filter.column] === filter.value);
      }
      // Apply in filters
      for (const filter of this.inFilters) {
        filtered = filtered.filter((p: any) => filter.values.includes(p[filter.column]));
      }
      // Apply gte filters
      for (const filter of this.gteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] >= filter.value);
      }
      // Apply lte filters
      for (const filter of this.lteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] <= filter.value);
      }

      return { data: filtered, error: null, count: filtered.length };
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
      let allActs: any[] = [];
      const hasSynced = this.getCookieOrLocalStorage("kyl-mock-activities-synced") === "true";
      
      if (hasSynced || isStrava) {
        // Generate activities for all 15 mock athletes
        const profilesList = getMockProfiles(isStrava, provider, lastSyncedAt, tourCompleted, mockRole);
        profilesList.forEach((prof) => {
          allActs = allActs.concat(generateMockQueryActivitiesForUser(prof.id));
        });
      }

      let filtered = allActs;
      // Apply eq filters (e.g. user_id)
      for (const filter of this.eqFilters) {
        filtered = filtered.filter((a: any) => a[filter.column] === filter.value);
      }
      // Apply in filters
      for (const filter of this.inFilters) {
        filtered = filtered.filter((a: any) => filter.values.includes(a[filter.column]));
      }
      // Apply gte filters
      for (const filter of this.gteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] >= filter.value);
      }
      // Apply lte filters
      for (const filter of this.lteFilters) {
        filtered = filtered.filter((item: any) => item[filter.column] <= filter.value);
      }
      // Sort
      filtered.sort((a, b) => b.start_date.localeCompare(a.start_date));

      if (this.limitCount > 0) {
        filtered = filtered.slice(0, this.limitCount);
      }

      return {
        data: filtered,
        error: null,
        count: filtered.length
      };
    }

    if (this.mutationValues) {
      return { data: Array.isArray(this.mutationValues) ? this.mutationValues : [this.mutationValues], error: null, count: 1 };
    }
    return { data: null, error: null, count: null };
  }
}

function getSeedChallenges() {
  return [
    {
      id: "11111111-1111-1111-1111-111111111111",
      title: "KYL Summer Century",
      description: "Pedal your way to 100 kilometers over the month of June. Ride together, check your limits.",
      sport_type: "Ride",
      goal_metric: "Distance",
      goal_target: 100,
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      banner_url: "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&w=400&q=80",
      status: "active",
      created_by: "mock-uuid-12345678",
      created_at: "2026-06-01T12:00:00.000Z",
      challenge_code: "KYL-2026-001",
      slug: "kyl-summer-century"
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      title: "June Run Challenge",
      description: "Lace up and complete 50 kilometers of running. Stay consistent throughout June.",
      sport_type: "Run",
      goal_metric: "Distance",
      goal_target: 50,
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      banner_url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80",
      status: "active",
      created_by: "mock-uuid-12345678",
      created_at: "2026-06-01T12:00:00.000Z",
      challenge_code: "KYL-2026-002",
      slug: "june-run-challenge"
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      title: "July Elevation Climb",
      description: "Climb 2,000 meters of total elevation gain. Any run, walk, or cycle counts.",
      sport_type: "Multisport",
      goal_metric: "Elevation",
      goal_target: 2000,
      start_date: "2026-07-01",
      end_date: "2026-07-31",
      banner_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
      status: "upcoming",
      created_by: "mock-uuid-12345678",
      created_at: "2026-06-01T12:00:00.000Z",
      challenge_code: "KYL-2026-003",
      slug: "july-elevation-climb"
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      title: "May Walkathon",
      description: "Cover 30 kilometers of walking to kickstart your summer fitness habit.",
      sport_type: "Walk",
      goal_metric: "Distance",
      goal_target: 30,
      start_date: "2026-05-01",
      end_date: "2026-05-31",
      banner_url: "https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=400&q=80",
      status: "archived",
      created_by: "mock-uuid-12345678",
      created_at: "2026-05-01T12:00:00.000Z",
      challenge_code: "KYL-2026-004",
      slug: "may-walkathon"
    }
  ];
}

function getSeedParticipants() {
  const seeds = [];
  // Enroll p1 to p12 in Century
  for (let i = 1; i <= 12; i++) {
    seeds.push({
      challenge_id: "11111111-1111-1111-1111-111111111111",
      user_id: i === 1 ? "mock-uuid-12345678" : `mock-uuid-p${i}`,
      joined_at: "2026-06-02T08:00:00Z"
    });
  }
  // Enroll p1 to p8 in Run
  for (let i = 1; i <= 8; i++) {
    seeds.push({
      challenge_id: "22222222-2222-2222-2222-222222222222",
      user_id: i === 1 ? "mock-uuid-12345678" : `mock-uuid-p${i}`,
      joined_at: "2026-06-03T10:00:00Z"
    });
  }
  return seeds;
}

function getMockProfiles(isStrava: boolean, provider: string, lastSyncedAt: any, tourCompleted: boolean, mockRole: string) {
  return [
    { id: "mock-uuid-12345678", email: isStrava ? "athlete@strava.com" : "athlete@gmail.com", name: isStrava ? "Adith Strava" : "Adith Google", avatar: isStrava ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", auth_provider: provider, strava_connected: isStrava, strava_athlete_id: isStrava ? "strava-athlete-999" : null, last_synced_at: lastSyncedAt || null, tour_completed: tourCompleted, role: mockRole },
    { id: "mock-uuid-p2", email: "sarah.j@outlook.com", name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-101", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p3", email: "mchen@gmail.com", name: "Michael Chen", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-102", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p4", email: "emma.r@yahoo.com", name: "Emma Rodriguez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-103", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p5", email: "dkim@naver.com", name: "David Kim", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-104", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p6", email: "jtaylor@gmail.com", name: "Jessica Taylor", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-105", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p7", email: "jwilson@live.com", name: "James Wilson", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-106", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p8", email: "amanda.m@gmail.com", name: "Amanda Martinez", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-107", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p9", email: "rthompson@gmail.com", name: "Robert Thompson", avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-108", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p10", email: "lisa.a@icloud.com", name: "Lisa Anderson", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-109", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p11", email: "wthomas@gmail.com", name: "William Thomas", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-110", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p12", email: "ajackson@gmail.com", name: "Ashley Jackson", avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-111", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p13", email: "bwhite@gmail.com", name: "Brian White", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-112", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p14", email: "mharris@gmail.com", name: "Megan Harris", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-113", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" },
    { id: "mock-uuid-p15", email: "kmartin@gmail.com", name: "Kevin Martin", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", auth_provider: "strava", strava_connected: true, strava_athlete_id: "strava-athlete-114", last_synced_at: "2026-06-17T12:00:00Z", tour_completed: true, role: "athlete" }
  ];
}

function generateMockQueryActivitiesForUser(userId: string): any[] {
  const activities: any[] = [];
  const idx = userId === "mock-uuid-12345678" ? 1 : Number(userId.replace("mock-uuid-p", "")) || 15;
  
  if (idx > 12) return []; // p13, p14, p15 have no activities

  // Distances completed matching the insights page exactly
  // p1 (Adith): 105.4 km, p2: 92.5, p3: 81.2, p4: 74.0, p5: 68.3, p6: 58.1, p7: 51.5, p8: 45.0, p9: 36.2, p10: 28.4, p11: 12.0, p12: 5.4
  const targetDistances = [0, 105.4, 92.5, 81.2, 74.0, 68.3, 58.1, 51.5, 45.0, 36.2, 28.4, 12.0, 5.4];
  const targetDist = targetDistances[idx] || 0;

  // Let's divide the target distance into a few activities
  const numActivities = idx === 11 || idx === 12 ? 1 : (idx === 10 ? 2 : (idx === 8 || idx === 9 ? 3 : 4));
  const sportTypes = ["Ride", "Run", "Walk"];
  const now = new Date("2026-06-18T12:00:00Z");

  for (let i = 0; i < numActivities; i++) {
    const actDist = Math.round((targetDist / numActivities) * 1000); // meters
    const sportType = idx === 4 ? "Run" : (idx % 2 === 0 ? "Ride" : "Run"); // Emma p4 does run
    const movingTime = Math.round(actDist / (sportType === "Ride" ? 7 : 3.5)); // speed
    const elevation = idx * 25 + i * 10;
    const startDate = new Date(now.getTime() - (i * 2 * 24 * 60 * 60 * 1000));

    activities.push({
      user_id: userId,
      strava_activity_id: 2000000000 + idx * 100 + i,
      name: `${sportType === "Ride" ? "Morning Ride 🚴" : "Tempo Run ⚡"}`,
      distance: actDist,
      moving_time: movingTime,
      elapsed_time: movingTime + 120,
      sport_type: sportType,
      start_date: startDate.toISOString(),
      start_date_local: startDate.toISOString(),
      average_speed: Number((actDist / movingTime).toFixed(2)),
      total_elevation_gain: elevation,
    });
  }

  return activities;
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
