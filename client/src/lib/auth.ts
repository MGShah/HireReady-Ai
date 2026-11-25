export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  user_metadata?: {
    full_name?: string;
    target_role?: string;
    headline?: string;
    phone?: string;
    location?: string;
    college?: string;
    education?: string;
    graduation_year?: number;
    skills?: string[];
    linkedin?: string;
    summary?: string;
    [key: string]: any;
  };
}

export interface Session {
  access_token: string;
  token: string;
  user: User;
}

type AuthListener = (
  event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED",
  session: Session | null
) => void;

const listeners: Set<AuthListener> = new Set();

const TOKEN_KEY = "nexa_auth_token";
const USER_KEY = "nexa_auth_user";
const LEGACY_RESUME_KEY = "careerpilot-resume";

export const getResumeStorageKey = (userId: string) => `nexa-resume:${userId}`;

export function getStoredUserId(): string | null {
  try {
    const storedUser =
      localStorage.getItem(USER_KEY) ||
      localStorage.getItem("ascendiq_auth_user") ||
      localStorage.getItem("careerpilot_auth_user");
    const user = storedUser ? (JSON.parse(storedUser) as User) : null;
    return user?.id || null;
  } catch {
    return null;
  }
}


function notifyListeners(
  event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED",
  session: Session | null
) {
  listeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (e) {
      console.error("Auth listener error:", e);
    }
  });
}

// Multi-candidate resilient fetcher
async function apiFetch(endpoint: string, options: RequestInit): Promise<Response> {
  const envBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const candidates: string[] = [
    envBase ? `${envBase}${endpoint}` : null,
    endpoint, // relative URL (works for same-domain or Vite proxy)
    // Only attempt local fallbacks during development mode
    import.meta.env.DEV ? `http://localhost:5001${endpoint}` : null,
    import.meta.env.DEV ? `http://127.0.0.1:5001${endpoint}` : null,
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidates));

  let lastError: any = null;
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Unable to reach backend server. Please verify MongoDB and backend are running.");
}


export const auth = {
  async getSession(): Promise<{ data: { session: Session | null } }> {
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem("ascendiq_auth_token") ||
      localStorage.getItem("careerpilot_auth_token");
    const userStr =
      localStorage.getItem(USER_KEY) ||
      localStorage.getItem("ascendiq_auth_user") ||
      localStorage.getItem("careerpilot_auth_user");

    if (!token || !userStr) {
      return { data: { session: null } };
    }


    try {
      const user: User = JSON.parse(userStr);
      const session: Session = {
        access_token: token,
        token,
        user,
      };
      return { data: { session } };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { data: { session: null } };
    }
  },

  async getUser(): Promise<{ data: { user: User | null } }> {
    const { data } = await this.getSession();
    return { data: { user: data.session?.user ?? null } };
  },

  async refreshSession(): Promise<{ data: { session: Session | null } }> {
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem("ascendiq_auth_token") ||
      localStorage.getItem("careerpilot_auth_token");
    if (!token) return { data: { session: null } };

    try {
      const res = await apiFetch(`/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          const session: Session = {
            access_token: token,
            token,
            user: json.user,
          };
          localStorage.setItem(TOKEN_KEY, session.token);
          localStorage.setItem(USER_KEY, JSON.stringify(session.user));
          notifyListeners("TOKEN_REFRESHED", session);
          return { data: { session } };
        }
      }
    } catch {
      // Ignore background refresh failure
    }
    return this.getSession();
  },

  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{
    data: { session: Session | null; user: User | null };
    error: { message: string } | null;
  }> {
    try {
      const normalizedEmail = email.trim();
      const res = await apiFetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg =
          json.error || json.message || "Invalid email or password";
        return {
          data: { session: null, user: null },
          error: { message: errorMsg },
        };
      }

      if (!json.token || !json.user) {
        return {
          data: { session: null, user: null },
          error: { message: "Login failed: the server returned an invalid session." },
        };
      }

      const session: Session = {
        access_token: json.token,
        token: json.token,
        user: json.user,
      };

      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      localStorage.removeItem(LEGACY_RESUME_KEY);

      notifyListeners("SIGNED_IN", session);

      return {
        data: { session, user: session.user },
        error: null,
      };
    } catch (err: any) {
      return {
        data: { session: null, user: null },
        error: {
          message:
            err?.message ||
            "Unable to reach server. Please check your network connection.",
        },
      };
    }
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: {
      data?: Record<string, any>;
    };
  }): Promise<{
    data: { session: Session | null; user: User | null };
    error: { message: string } | null;
  }> {
    try {
      const payload = {
        email: email.trim(),
        password,
        ...(options?.data || {}),
      };

      const res = await apiFetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        let errorMsg = "Registration failed";
        if (json.error) errorMsg = json.error;
        else if (json.details?.fieldErrors) {
          errorMsg = Object.values(json.details.fieldErrors)
            .flat()
            .join(", ");
        }
        return {
          data: { session: null, user: null },
          error: { message: errorMsg },
        };
      }

      if (!json.token || !json.user) {
        return {
          data: { session: null, user: null },
          error: { message: "Registration failed: the server returned an invalid session." },
        };
      }

      const session: Session = {
        access_token: json.token,
        token: json.token,
        user: json.user,
      };

      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      localStorage.removeItem(LEGACY_RESUME_KEY);

      notifyListeners("SIGNED_IN", session);

      return {
        data: { session, user: session.user },
        error: null,
      };
    } catch (err: any) {
      return {
        data: { session: null, user: null },
        error: {
          message:
            err?.message ||
            "Unable to reach server. Please check your network connection.",
        },
      };
    }
  },

  async signOut(): Promise<{ error: null }> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await apiFetch(`/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LEGACY_RESUME_KEY);
      notifyListeners("SIGNED_OUT", null);
    }

    return { error: null };
  },

  async resetPasswordForEmail(_email: string): Promise<{ error: { message: string } | null }> {
    return {
      error: null,
    };
  },

  onAuthStateChange(callback: AuthListener): {
    data: { subscription: { unsubscribe: () => void } };
  } {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },
};
