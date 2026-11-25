import { api } from "./api";

export interface AdminStats {
  counts: {
    users: number;
    activeUsers: number;
    suspendedUsers: number;
    adminUsers: number;
    verifiedUsers: number;
    usersLast24h: number;
    usersLast7d: number;
    usersLast30d: number;
    profiles: number;
    avgProfileCompletion: number;
    resumes: number;
    interviews: number;
    completedInterviews: number;
    activeInterviews: number;
    applications: number;
    skills: number;
    aiLogs: number;
    aiSuccess: number;
    aiFailed: number;
    aiSuccessRate: number;
    aiAvgLatencyMs: number;
    aiTotalTokens: number;
    aiPromptTokens: number;
    aiCompletionTokens: number;
  };
  applicationsByStatus: Record<string, number>;
  interviewsByType: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: "user_registered" | "application_created" | "interview_started" | "ai_invocation";
    title: string;
    description: string;
    timestamp: string;
    status?: string;
    meta?: any;
  }>;
}

export interface AdminPerformance {
  system: {
    uptimeSeconds: number;
    uptimeFormatted: string;
    memory: {
      rssMB: number;
      heapTotalMB: number;
      heapUsedMB: number;
      externalMB: number;
      heapPercent: number;
    };
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    cpus: number;
    freeMemoryMB: number;
    totalMemoryMB: number;
  };
  database: {
    status: string;
    readyState: number;
    host: string;
    name: string;
    modelsLoaded: number;
  };
  ai: {
    activeProvider: string;
    activeModel: string;
    dailyLimit: number;
    featureStats: Array<{
      feature: string;
      total: number;
      successCount: number;
      successRate: number;
      avgLatencyMs: number;
      totalTokens: number;
    }>;
    providerStats: Array<{
      provider: string;
      total: number;
      avgLatencyMs: number;
    }>;
    latencyTimeline: Array<{
      time: string;
      latency: number;
      feature: string;
      success: boolean;
    }>;
  };
}

export interface AdminUser {
  _id: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    full_name?: string | null;
    target_role?: string | null;
    college?: string | null;
    education?: string | null;
    phone?: string | null;
    skills?: string[];
    profile_completion_percentage?: number;
  } | null;
  counts: {
    resumes: number;
    applications: number;
    interviews: number;
  };
}

export interface AdminApplication {
  _id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  company: string;
  title: string;
  url: string | null;
  status: "saved" | "applied" | "assessment" | "interview" | "offer" | "rejected" | "withdrawn";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  _id: string;
  user_id: string;
  email?: string;
  role: "user" | "admin";
  full_name: string | null;
  education: string | null;
  college: string | null;
  graduation_year: number | null;
  skills: string[];
  target_role: string | null;
  location: string | null;
  phone: string | null;
  linkedin: string | null;
  website: string | null;
  summary: string | null;
  profile_completion_percentage: number;
  daily_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AdminResume {
  _id: string;
  user_id: string;
  email?: string;
  candidate_name?: string;
  headline?: string;
  template?: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface AdminInterview {
  _id: string;
  user_id: string;
  email?: string;
  role: string;
  type: "hr" | "technical" | "behavioral" | "coding" | "project";
  difficulty: "easy" | "medium" | "hard";
  question_count: number;
  status: "active" | "completed";
  demo: boolean;
  messages?: Array<{
    role: "assistant" | "user";
    content: string;
    feedback?: any;
    created_at: string;
  }>;
  created_at: string;
}

export interface AdminAiLog {
  _id: string;
  user_id: string;
  email?: string;
  feature: string;
  provider: string;
  model: string;
  latency_ms: number | null;
  request_tokens?: number | null;
  response_tokens?: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface AdminSettings {
  announcement: {
    active: boolean;
    text: string;
    type: "info" | "warning" | "success" | "alert";
  };
  maintenance: {
    active: boolean;
    message: string;
  };
  environment: {
    nodeEnv: string;
    port: number;
    frontendUrl: string;
    aiProvider: string;
    aiModel: string;
    dailyAiLimit: number;
    database: string;
    hasGroqKey: boolean;
    hasGeminiKey: boolean;
    hasOpenAiKey: boolean;
    hasHfToken: boolean;
  };
}

export const adminApi = {
  // Verification & Bootstrap
  async checkAdmin() {
    const res = await api.get<{ ok: boolean; isAdmin: boolean; user?: any }>("/api/admin/check");
    return res.data;
  },

  async getBootstrapStatus() {
    const res = await api.get<{ hasAdmin: boolean; adminCount: number }>("/api/admin/bootstrap-status");
    return res.data;
  },

  async claimFirstAdmin() {
    const res = await api.post<{ success: boolean; message: string; user?: any }>("/api/admin/claim-first-admin");
    return res.data;
  },

  // Stats & Performance
  async getStats() {
    const res = await api.get<AdminStats>("/api/admin/stats");
    return res.data;
  },

  async getPerformance() {
    const res = await api.get<AdminPerformance>("/api/admin/performance");
    return res.data;
  },

  async testDbPing() {
    const res = await api.post<{ success: boolean; latencyMs: number; host: string; database: string }>("/api/admin/test-db");
    return res.data;
  },

  async testAiPing() {
    const res = await api.post<{ success: boolean; provider: string; model: string; latencyMs: number; response?: string; error?: string }>("/api/admin/test-ai");
    return res.data;
  },

  // User Management
  async getUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    order?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const res = await api.get<{ users: AdminUser[]; total: number; page: number; totalPages: number }>("/api/admin/users", { params });
    return res.data;
  },

  async getUser(id: string) {
    const res = await api.get<{
      user: AdminUser;
      profile: AdminProfile | null;
      resume: AdminResume | null;
      applications: AdminApplication[];
      interviews: AdminInterview[];
    }>(`/api/admin/users/${id}`);
    return res.data;
  },

  async createUser(payload: {
    email: string;
    password: string;
    role?: "user" | "admin";
    isActive?: boolean;
    emailVerified?: boolean;
    full_name?: string;
    target_role?: string;
    phone?: string;
    college?: string;
    education?: string;
  }) {
    const res = await api.post<{ success: boolean; message: string; user: AdminUser }>("/api/admin/users", payload);
    return res.data;
  },

  async updateUser(id: string, payload: Partial<AdminUser & AdminProfile & { password?: string }>) {
    const res = await api.put<{ success: boolean; message: string; user: AdminUser; profile: AdminProfile }>(`/api/admin/users/${id}`, payload);
    return res.data;
  },

  async toggleUserStatus(id: string) {
    const res = await api.patch<{ success: boolean; message: string; isActive: boolean }>(`/api/admin/users/${id}/toggle-status`);
    return res.data;
  },

  async toggleUserRole(id: string) {
    const res = await api.patch<{ success: boolean; message: string; role: "user" | "admin" }>(`/api/admin/users/${id}/toggle-role`);
    return res.data;
  },

  async deleteUser(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/admin/users/${id}`);
    return res.data;
  },

  // Job Applications
  async getApplications(params: {
    search?: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const res = await api.get<{ applications: AdminApplication[]; total: number; page: number; totalPages: number }>("/api/admin/applications", { params });
    return res.data;
  },

  async createApplication(payload: {
    user_id: string;
    company: string;
    title: string;
    url?: string;
    status?: string;
    notes?: string;
  }) {
    const res = await api.post<{ success: boolean; message: string; application: AdminApplication }>("/api/admin/applications", payload);
    return res.data;
  },

  async updateApplication(id: string, payload: Partial<AdminApplication>) {
    const res = await api.put<{ success: boolean; message: string; application: AdminApplication }>(`/api/admin/applications/${id}`, payload);
    return res.data;
  },

  async deleteApplication(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/admin/applications/${id}`);
    return res.data;
  },

  // Profiles & Resumes
  async getProfiles(params: { search?: string; page?: number; limit?: number } = {}) {
    const res = await api.get<{ profiles: AdminProfile[]; total: number; page: number; totalPages: number }>("/api/admin/profiles", { params });
    return res.data;
  },

  async updateProfile(id: string, payload: Partial<AdminProfile>) {
    const res = await api.put<{ success: boolean; message: string; profile: AdminProfile }>(`/api/admin/profiles/${id}`, payload);
    return res.data;
  },

  async getResumes(params: { page?: number; limit?: number } = {}) {
    const res = await api.get<{ resumes: AdminResume[]; total: number; page: number; totalPages: number }>("/api/admin/resumes", { params });
    return res.data;
  },

  async deleteResume(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/admin/resumes/${id}`);
    return res.data;
  },

  // Interview Sessions
  async getInterviews(params: {
    search?: string;
    status?: string;
    type?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const res = await api.get<{ interviews: AdminInterview[]; total: number; page: number; totalPages: number }>("/api/admin/interviews", { params });
    return res.data;
  },

  async getInterview(id: string) {
    const res = await api.get<{ interview: AdminInterview }>(`/api/admin/interviews/${id}`);
    return res.data;
  },

  async updateInterview(id: string, payload: Partial<AdminInterview>) {
    const res = await api.put<{ success: boolean; message: string; interview: AdminInterview }>(`/api/admin/interviews/${id}`, payload);
    return res.data;
  },

  async deleteInterview(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/admin/interviews/${id}`);
    return res.data;
  },

  // AI Logs & Telemetry
  async getAiLogs(params: {
    feature?: string;
    provider?: string;
    success?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const res = await api.get<{ logs: AdminAiLog[]; total: number; page: number; totalPages: number }>("/api/admin/ai-logs", { params });
    return res.data;
  },

  async pruneAiLogs(days: number = 0) {
    const res = await api.delete<{ success: boolean; message: string; deletedCount: number }>("/api/admin/ai-logs", { params: { days } });
    return res.data;
  },

  // System Settings
  async getSettings() {
    const res = await api.get<AdminSettings>("/api/admin/settings");
    return res.data;
  },

  async updateSetting(key: string, value: any) {
    const res = await api.post<{ success: boolean; message: string; setting: any }>("/api/admin/settings", { key, value });
    return res.data;
  },
};
