import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Briefcase,
  Mic,
  FileText,
  Activity,
  Cpu,
  Database,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Sliders,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Server,
  Bell,
  Clock,
  Sparkles,
  KeyRound,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Session } from "../lib/auth";
import { auth } from "../lib/auth";
import {
  adminApi,
  AdminStats,
  AdminPerformance,
  AdminUser,
  AdminApplication,
  AdminProfile,
  AdminResume,
  AdminInterview,
  AdminAiLog,
  AdminSettings,
} from "../lib/adminApi";
import { errMsg } from "../lib/api";

interface AdminDashboardProps {
  session?: Session | null;
}

type TabType = "overview" | "users" | "applications" | "interviews" | "logs" | "settings";

export default function AdminDashboard({ session }: AdminDashboardProps) {
  // Navigation & Tabs
  const [tab, setTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Role & Admin check state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true);

  // Core Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [performance, setPerformance] = useState<AdminPerformance | null>(null);

  // User Management State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewUserDetails, setViewUserDetails] = useState<{
    user: AdminUser;
    profile: AdminProfile | null;
    resume: AdminResume | null;
    applications: AdminApplication[];
    interviews: AdminInterview[];
  } | null>(null);

  // Modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState<any>({
    email: "",
    password: "",
    role: "user",
    isActive: true,
    emailVerified: true,
    full_name: "",
    target_role: "",
    phone: "",
    college: "",
    education: "",
  });

  // Applications State
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [appPage, setAppPage] = useState(1);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [showAppModal, setShowAppModal] = useState(false);
  const [appFormData, setAppFormData] = useState<any>({
    user_id: "",
    company: "",
    title: "",
    url: "",
    status: "applied",
    notes: "",
  });

  // Interviews & Resumes State
  const [interviewSubTab, setInterviewSubTab] = useState<"interviews" | "resumes">("interviews");
  const [interviews, setInterviews] = useState<AdminInterview[]>([]);
  const [interviewTotal, setInterviewTotal] = useState(0);
  const [interviewPage, setInterviewPage] = useState(1);
  const [interviewSearch, setInterviewSearch] = useState("");
  const [selectedInterview, setSelectedInterview] = useState<AdminInterview | null>(null);
  const [resumes, setResumes] = useState<AdminResume[]>([]);
  const [resumeTotal, setResumeTotal] = useState(0);

  // AI Logs State
  const [aiLogs, setAiLogs] = useState<AdminAiLog[]>([]);
  const [aiLogTotal, setAiLogTotal] = useState(0);
  const [aiLogPage, setAiLogPage] = useState(1);
  const [aiLogFeature, setAiLogFeature] = useState("all");
  const [aiLogSuccess, setAiLogSuccess] = useState("all");

  // System Settings State
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    active: false,
    text: "",
    type: "info" as "info" | "warning" | "success" | "alert",
  });

  // Real-time ping testing
  const [dbPingResult, setDbPingResult] = useState<{ latencyMs: number; host: string } | null>(null);
  const [aiPingResult, setAiPingResult] = useState<{ latencyMs: number; provider: string; model: string; response?: string } | null>(null);
  const [isPingingDb, setIsPingingDb] = useState(false);
  const [isPingingAi, setIsPingingAi] = useState(false);

  // Set message notification helper
  const notify = (type: "success" | "error" | "info", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Initial Check & Load
  useEffect(() => {
    let mounted = true;

    async function initCheck() {
      try {
        setLoading(true);
        // Sync session first to ensure latest role from MongoDB
        await auth.refreshSession().catch(() => {});

        const checkRes = await adminApi.checkAdmin().catch(() => ({ isAdmin: false }));
        if (!mounted) return;

        if (!checkRes.isAdmin) {
          setIsAdmin(false);
          const bootstrapRes = await adminApi.getBootstrapStatus().catch(() => ({ hasAdmin: true }));
          if (mounted) setHasAnyAdmin(bootstrapRes.hasAdmin);
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        await loadAllDashboardData();
      } catch (err) {
        if (mounted) {
          setIsAdmin(false);
          notify("error", errMsg(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initCheck();

    return () => {
      mounted = false;
    };
  }, []);

  // Load core dashboard data
  const loadAllDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsData, perfData, settingsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPerformance(),
        adminApi.getSettings(),
      ]);

      setStats(statsData);
      setPerformance(perfData);
      setSettings(settingsData);
      if (settingsData?.announcement) {
        setAnnouncementForm({
          active: Boolean(settingsData.announcement.active),
          text: settingsData.announcement.text || "",
          type: settingsData.announcement.type || "info",
        });
      }
    } catch (err) {
      notify("error", errMsg(err));
    } finally {
      setRefreshing(false);
    }
  };

  // Tab-specific loaders
  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "users") loadUsers();
    else if (tab === "applications") loadApplications();
    else if (tab === "interviews") {
      loadInterviews();
      loadResumes();
    } else if (tab === "logs") loadAiLogs();
    else if (tab === "overview") loadAllDashboardData();
  }, [tab, isAdmin]);

  // Load Users
  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers({
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        page: userPage,
        limit: 10,
      });
      setUsers(data.users);
      setUserTotal(data.total);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  useEffect(() => {
    if (isAdmin && tab === "users") {
      const timer = setTimeout(() => {
        setUserPage(1);
        loadUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (isAdmin && tab === "users") {
      loadUsers();
    }
  }, [userPage]);

  // Load Applications
  const loadApplications = async () => {
    try {
      const data = await adminApi.getApplications({
        search: appSearch,
        status: appStatusFilter,
        page: appPage,
        limit: 10,
      });
      setApplications(data.applications);
      setAppTotal(data.total);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  useEffect(() => {
    if (isAdmin && tab === "applications") {
      const timer = setTimeout(() => {
        setAppPage(1);
        loadApplications();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appSearch, appStatusFilter]);

  useEffect(() => {
    if (isAdmin && tab === "applications") {
      loadApplications();
    }
  }, [appPage]);

  // Load Interviews & Resumes
  const loadInterviews = async () => {
    try {
      const data = await adminApi.getInterviews({
        search: interviewSearch,
        page: interviewPage,
        limit: 10,
      });
      setInterviews(data.interviews);
      setInterviewTotal(data.total);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const loadResumes = async () => {
    try {
      const data = await adminApi.getResumes({ limit: 15 });
      setResumes(data.resumes);
      setResumeTotal(data.total);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  useEffect(() => {
    if (isAdmin && tab === "interviews") {
      loadInterviews();
    }
  }, [interviewPage, interviewSearch]);

  // Load AI Logs
  const loadAiLogs = async () => {
    try {
      const data = await adminApi.getAiLogs({
        feature: aiLogFeature,
        success: aiLogSuccess,
        page: aiLogPage,
        limit: 15,
      });
      setAiLogs(data.logs);
      setAiLogTotal(data.total);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  useEffect(() => {
    if (isAdmin && tab === "logs") {
      loadAiLogs();
    }
  }, [aiLogPage, aiLogFeature, aiLogSuccess]);

  // Actions: User Management
  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const res = await adminApi.toggleUserStatus(user._id);
      notify("success", res.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: res.isActive } : u))
      );
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleToggleUserRole = async (user: AdminUser) => {
    try {
      const res = await adminApi.toggleUserRole(user._id);
      notify("success", res.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: res.role } : u))
      );
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleOpenUserDetail = async (user: AdminUser) => {
    try {
      const data = await adminApi.getUser(user._id);
      setViewUserDetails(data);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setUserFormData({
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      full_name: user.profile?.full_name || "",
      target_role: user.profile?.target_role || "",
      phone: user.profile?.phone || "",
      college: user.profile?.college || "",
      education: user.profile?.education || "",
    });
    setShowEditUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showCreateUserModal) {
        const res = await adminApi.createUser(userFormData);
        notify("success", res.message);
        setShowCreateUserModal(false);
        loadUsers();
      } else if (showEditUserModal && selectedUser) {
        const payload: any = { ...userFormData };
        if (!payload.password) delete payload.password;
        const res = await adminApi.updateUser(selectedUser._id, payload);
        notify("success", res.message);
        setShowEditUserModal(false);
        loadUsers();
      }
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await adminApi.deleteUser(selectedUser._id);
      notify("success", res.message);
      setShowDeleteUserModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  // Actions: Applications Management
  const handleOpenCreateApp = () => {
    setSelectedApp(null);
    setAppFormData({
      user_id: users[0]?._id || "",
      company: "",
      title: "",
      url: "",
      status: "applied",
      notes: "",
    });
    setShowAppModal(true);
  };

  const handleOpenEditApp = (app: AdminApplication) => {
    setSelectedApp(app);
    setAppFormData({
      user_id: app.user_id,
      company: app.company,
      title: app.title,
      url: app.url || "",
      status: app.status,
      notes: app.notes || "",
    });
    setShowAppModal(true);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedApp) {
        const res = await adminApi.updateApplication(selectedApp._id, appFormData);
        notify("success", res.message);
      } else {
        const res = await adminApi.createApplication(appFormData);
        notify("success", res.message);
      }
      setShowAppModal(false);
      loadApplications();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleUpdateAppStatusQuick = async (appId: string, status: string) => {
    try {
      await adminApi.updateApplication(appId, { status: status as any });
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: status as any } : a))
      );
      notify("success", `Application status updated to ${status}`);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm("Are you sure you want to delete this job application record?")) return;
    try {
      const res = await adminApi.deleteApplication(appId);
      notify("success", res.message);
      loadApplications();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  // Actions: Interview Details & Delete
  const handleInspectInterview = async (interviewId: string) => {
    try {
      const data = await adminApi.getInterview(interviewId);
      setSelectedInterview(data.interview);
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!window.confirm("Delete this mock interview session and transcript?")) return;
    try {
      const res = await adminApi.deleteInterview(interviewId);
      notify("success", res.message);
      loadInterviews();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!window.confirm("Delete this candidate ATS resume?")) return;
    try {
      const res = await adminApi.deleteResume(resumeId);
      notify("success", res.message);
      loadResumes();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  // Actions: AI Logs Pruning
  const handlePruneLogs = async (days: number) => {
    const prompt = days === 0 ? "Are you sure you want to clear ALL AI usage logs?" : `Prune AI logs older than ${days} days?`;
    if (!window.confirm(prompt)) return;
    try {
      const res = await adminApi.pruneAiLogs(days);
      notify("success", res.message);
      loadAiLogs();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  // Actions: Diagnostics
  const handleRunDbPing = async () => {
    setIsPingingDb(true);
    try {
      const res = await adminApi.testDbPing();
      setDbPingResult({ latencyMs: res.latencyMs, host: res.host });
      notify("success", `MongoDB Ping successful: ${res.latencyMs}ms`);
    } catch (err) {
      notify("error", `Database ping failed: ${errMsg(err)}`);
    } finally {
      setIsPingingDb(false);
    }
  };

  const handleRunAiPing = async () => {
    setIsPingingAi(true);
    try {
      const res = await adminApi.testAiPing();
      if (res.success) {
        setAiPingResult({
          latencyMs: res.latencyMs,
          provider: res.provider,
          model: res.model,
          response: res.response,
        });
        notify("success", `AI Model ${res.model} responded in ${res.latencyMs}ms`);
      } else {
        notify("error", `AI test failed: ${res.error}`);
      }
    } catch (err) {
      notify("error", `AI ping failed: ${errMsg(err)}`);
    } finally {
      setIsPingingAi(false);
    }
  };

  // Actions: Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        active: Boolean(announcementForm.active),
        text: announcementForm.text.trim(),
        type: announcementForm.type || "info",
      };
      const res = await adminApi.updateSetting("announcement", payload);
      setAnnouncementForm(payload);
      notify("success", res.message || "Announcement updated and broadcast successfully!");
      window.dispatchEvent(new CustomEvent("nexa_announcement_updated", { detail: payload }));
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  // Actions: Claim First Admin (Bootstrap)
  const handleClaimFirstAdmin = async () => {
    try {
      const res = await adminApi.claimFirstAdmin();
      notify("success", res.message);
      await auth.refreshSession();
      setIsAdmin(true);
      await loadAllDashboardData();
    } catch (err) {
      notify("error", errMsg(err));
    }
  };

  // Unauthorized / Guest / Non-Admin Screen
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/60 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
            <ShieldAlert size={34} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Access Restricted: Administrator Privileges Required
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The hireReady-AI Administration Dashboard is restricted to verified system operators. You are currently signed in as{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{session?.user?.email || "Guest"}</span> (Role:{" "}
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-mono font-bold dark:bg-slate-800">
              {session?.user?.role || "none"}
            </span>).
          </p>

          {!hasAnyAdmin ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/60 dark:bg-amber-950/40">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                <Sparkles size={16} /> Initial Platform Bootstrap Available
              </div>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                No administrative accounts have been configured yet in this environment. You can claim initial ownership now:
              </p>
              <button
                onClick={handleClaimFirstAdmin}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition"
              >
                <KeyRound size={14} /> Promote My Account to Platform Admin
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login?mode=login&redirect=%2Fadmin"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                Sign In as Admin (mahekgshah@gmail.com)
              </Link>
              <button
                onClick={async () => {
                  await auth.refreshSession();
                  window.location.reload();
                }}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                Recheck Permissions
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                Return to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all ${
            feedback.type === "success"
              ? "border border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
              : feedback.type === "error"
              ? "border border-red-500/30 bg-red-950/90 text-red-200"
              : "border border-blue-500/30 bg-blue-950/90 text-blue-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={16} className="text-emerald-400" />
          ) : feedback.type === "error" ? (
            <XCircle size={16} className="text-red-400" />
          ) : (
            <AlertTriangle size={16} className="text-blue-400" />
          )}
          <span>{feedback.msg}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30 shadow-inner">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  hireReady-AI Admin Portal
                </h1>
                <span className="rounded-md bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300 ring-1 ring-indigo-400/40 uppercase">
                  SUPERUSER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full-spectrum platform control, database telemetry, AI engine performance & CRUD operations
              </p>
            </div>
          </div>

          {/* Quick Diagnostics Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunDbPing}
              disabled={isPingingDb}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              title="Ping MongoDB cluster"
            >
              <Database size={13} className={isPingingDb ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              <span>{dbPingResult ? `${dbPingResult.latencyMs}ms` : "Test DB"}</span>
            </button>

            <button
              onClick={handleRunAiPing}
              disabled={isPingingAi}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/50 transition"
              title="Test active AI model connection and latency"
            >
              <Zap size={13} className={isPingingAi ? "animate-pulse text-amber-400" : "text-amber-400"} />
              <span>{aiPingResult ? `${aiPingResult.latencyMs}ms` : "Test AI Model"}</span>
            </button>

            <button
              onClick={loadAllDashboardData}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              title="Refresh all metrics"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-indigo-400" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Indicators Pill Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-800 text-[11px]">
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Database:</span>
            <span className="font-semibold text-slate-200">{performance?.database?.status || "Connected"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-1.5">
            <Cpu size={13} className="text-indigo-400" />
            <span className="text-slate-400">AI Engine:</span>
            <span className="font-semibold text-slate-200 truncate">{performance?.ai?.activeProvider} ({performance?.ai?.activeModel})</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-1.5">
            <Clock size={13} className="text-violet-400" />
            <span className="text-slate-400">Uptime:</span>
            <span className="font-semibold text-slate-200">{performance?.system?.uptimeFormatted || "Active"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-1.5">
            <Activity size={13} className="text-amber-400" />
            <span className="text-slate-400">Heap:</span>
            <span className="font-semibold text-slate-200">{performance?.system?.memory?.heapUsedMB || 0} MB ({performance?.system?.memory?.heapPercent || 0}%)</span>
          </div>
        </div>
      </header>

      {/* Admin Tab Navigation Bar */}
      <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        {[
          { key: "overview", label: "Overview & Analytics", icon: Activity },
          { key: "users", label: `Users (${stats?.counts?.users ?? users.length})`, icon: Users },
          { key: "applications", label: `Applications (${stats?.counts?.applications ?? applications.length})`, icon: Briefcase },
          { key: "interviews", label: `Mock Interviews (${stats?.counts?.interviews ?? 0})`, icon: Mic },
          { key: "logs", label: `AI Telemetry (${stats?.counts?.aiLogs ?? 0})`, icon: Zap },
          { key: "settings", label: "System Config", icon: Sliders },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as TabType)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              tab === key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {/* ========================================================================= */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total Users</span>
                <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts?.users ?? 0}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {stats?.counts?.activeUsers ?? 0} Active
                </span>
                <span className="text-slate-400">
                  +{stats?.counts?.usersLast7d ?? 0} this week
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Job Applications</span>
                <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts?.applications ?? 0}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {stats?.applicationsByStatus?.interview ?? 0} In Interview
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {stats?.applicationsByStatus?.offer ?? 0} Offers
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mock Interviews</span>
                <Mic size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts?.interviews ?? 0}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  {stats?.counts?.completedInterviews ?? 0} Completed
                </span>
                <span className="text-slate-400">
                  {stats?.counts?.resumes ?? 0} ATS Resumes
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>AI Success Rate</span>
                <Zap size={16} className="text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts?.aiSuccessRate ?? 100}%
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Avg: {stats?.counts?.aiAvgLatencyMs ?? 0}ms
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {stats?.counts?.aiTotalTokens?.toLocaleString() ?? 0} tokens
                </span>
              </div>
            </div>
          </div>

          {/* Performance & Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Latency Realtime Trend Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
                    AI Response Latency Timeline (ms)
                  </h3>
                  <p className="text-[11px] text-slate-500">Roundtrip generation latency across recent model invocations</p>
                </div>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Real-time
                </span>
              </div>
              <div className="h-60 w-full">
                {performance?.ai?.latencyTimeline?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performance.ai.latencyTimeline}>
                      <defs>
                        <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="ms" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: 10,
                          fontSize: 11,
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="latency"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#latencyGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No latency data recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Application Pipeline Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                    Application Pipeline Funnel
                  </h3>
                  <p className="text-[11px] text-slate-500">Distribution of candidates across hiring stages</p>
                </div>
              </div>
              <div className="h-60 w-full">
                {stats?.applicationsByStatus ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Saved", count: stats.applicationsByStatus.saved || 0 },
                        { name: "Applied", count: stats.applicationsByStatus.applied || 0 },
                        { name: "Assessment", count: stats.applicationsByStatus.assessment || 0 },
                        { name: "Interview", count: stats.applicationsByStatus.interview || 0 },
                        { name: "Offer", count: stats.applicationsByStatus.offer || 0 },
                        { name: "Rejected", count: stats.applicationsByStatus.rejected || 0 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: 10,
                          fontSize: 11,
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No applications recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Feature Telemetry Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />
              AI Engine Performance by Feature
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2.5 font-semibold">Feature Module</th>
                    <th className="pb-2.5 font-semibold">Invocations</th>
                    <th className="pb-2.5 font-semibold">Success Rate</th>
                    <th className="pb-2.5 font-semibold">Avg Latency</th>
                    <th className="pb-2.5 font-semibold">Tokens Consumed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {performance?.ai?.featureStats?.map((f) => (
                    <tr key={f.feature} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white capitalize">
                        {f.feature}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{f.total}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            f.successRate >= 95
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {f.successRate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{f.avgLatencyMs}ms</td>
                      <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                        {f.totalTokens?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(!performance?.ai?.featureStats || performance.ai.featureStats.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No AI feature calls recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time System Updates / Activity Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-indigo-600 dark:text-indigo-400" />
                  Live Platform Activity & Updates Feed
                </h3>
                <p className="text-[11px] text-slate-500">Real-time log of registrations, applications, and sessions</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {stats?.recentActivity?.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        act.type === "user_registered"
                          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                          : act.type === "application_created"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                          : act.type === "interview_started"
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                      }`}
                    >
                      {act.type === "user_registered" ? (
                        <Users size={15} />
                      ) : act.type === "application_created" ? (
                        <Briefcase size={15} />
                      ) : act.type === "interview_started" ? (
                        <Mic size={15} />
                      ) : (
                        <Zap size={15} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{act.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{act.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {act.status && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          act.status === "active" || act.status === "success" || act.status === "applied"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : act.status === "completed" || act.status === "interview"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {act.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activity events recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER MANAGEMENT (CRUD) */}
      {/* ========================================================================= */}
      {tab === "users" && (
        <div className="space-y-4">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user email or candidate name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Roles</option>
                <option value="user">Candidate Users</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>

            <button
              onClick={() => {
                setUserFormData({
                  email: "",
                  password: "",
                  role: "user",
                  isActive: true,
                  emailVerified: true,
                  full_name: "",
                  target_role: "",
                  phone: "",
                  college: "",
                  education: "",
                });
                setShowCreateUserModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus size={14} />
              <span>Create User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="p-3.5 font-semibold">User / Candidate</th>
                    <th className="p-3.5 font-semibold">Role</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold">Activity</th>
                    <th className="p-3.5 font-semibold">Registered</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-950 dark:text-indigo-300">
                            {(u.profile?.full_name || u.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {u.profile?.full_name || "Unnamed"}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            u.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span>{u.counts?.resumes ?? 0} Resumes</span>
                          <span>•</span>
                          <span>{u.counts?.applications ?? 0} Apps</span>
                          <span>•</span>
                          <span>{u.counts?.interviews ?? 0} Ints</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenUserDetail(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                            title="Inspect User Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                            title="Edit User & Profile"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                            title={u.isActive ? "Suspend User" : "Activate User"}
                          >
                            {u.isActive ? <UserX size={14} className="text-amber-500" /> : <UserCheck size={14} className="text-emerald-500" />}
                          </button>
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                            title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          >
                            <KeyRound size={14} className="text-indigo-500" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDeleteUserModal(true);
                            }}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No users match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800">
              <span>Showing {users.length} of {userTotal} users</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-semibold">Page {userPage}</span>
                <button
                  disabled={userPage * 10 >= userTotal}
                  onClick={() => setUserPage((p) => p + 1)}
                  className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPLICATIONS MANAGEMENT (CRUD) */}
      {/* ========================================================================= */}
      {tab === "applications" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search company or job title..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Application Stages</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreateApp}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus size={14} />
              <span>Log Application</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="p-3.5 font-semibold">Company & Role</th>
                    <th className="p-3.5 font-semibold">Candidate</th>
                    <th className="p-3.5 font-semibold">Stage Pipeline</th>
                    <th className="p-3.5 font-semibold">Logged Date</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{app.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{app.company}</span>
                          {app.url && (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-900 dark:text-white font-medium">{app.user_name || "Candidate"}</div>
                        <div className="text-[11px] text-slate-400">{app.user_email}</div>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateAppStatusQuick(app._id, e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="assessment">Assessment</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer 🎉</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditApp(app)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Application"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteApp(app._id)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete Application"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800">
              <span>Showing {applications.length} of {appTotal} applications</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={appPage <= 1}
                  onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-semibold">Page {appPage}</span>
                <button
                  disabled={appPage * 10 >= appTotal}
                  onClick={() => setAppPage((p) => p + 1)}
                  className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MOCK INTERVIEWS & RESUMES */}
      {/* ========================================================================= */}
      {tab === "interviews" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setInterviewSubTab("interviews")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                interviewSubTab === "interviews"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Mock Interviews ({interviewTotal})
            </button>
            <button
              onClick={() => setInterviewSubTab("resumes")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                interviewSubTab === "resumes"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              ATS Candidate Resumes ({resumeTotal})
            </button>
          </div>

          {interviewSubTab === "interviews" ? (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="p-3.5 font-semibold">Candidate Email</th>
                      <th className="p-3.5 font-semibold">Target Role</th>
                      <th className="p-3.5 font-semibold">Interview Type</th>
                      <th className="p-3.5 font-semibold">Difficulty</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold">Date</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {interviews.map((int) => (
                      <tr key={int._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{int.email}</td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300">{int.role}</td>
                        <td className="p-3.5 uppercase text-[10px] font-bold text-slate-500">{int.type}</td>
                        <td className="p-3.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              int.difficulty === "easy"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : int.difficulty === "medium"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {int.difficulty}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              int.status === "completed"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {int.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-500">
                          {new Date(int.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleInspectInterview(int._id)}
                              className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                              title="Inspect Transcript & AI Feedback"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteInterview(int._id)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                              title="Delete Session"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="p-3.5 font-semibold">Candidate Email</th>
                      <th className="p-3.5 font-semibold">Candidate Name</th>
                      <th className="p-3.5 font-semibold">Headline</th>
                      <th className="p-3.5 font-semibold">Template</th>
                      <th className="p-3.5 font-semibold">Updated</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {resumes.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{r.email}</td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300">{r.candidate_name}</td>
                        <td className="p-3.5 text-slate-500">{r.headline || "—"}</td>
                        <td className="p-3.5 uppercase text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {r.template}
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-500">
                          {new Date(r.updated_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteResume(r._id)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete Resume"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AI & SYSTEM AUDIT LOGS */}
      {/* ========================================================================= */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <select
                value={aiLogFeature}
                onChange={(e) => setAiLogFeature(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Features</option>
                <option value="resume">Resume Features</option>
                <option value="interview">Mock Interviews</option>
                <option value="skills">Skill Analyses</option>
                <option value="career">Career Fit</option>
              </select>

              <select
                value={aiLogSuccess}
                onChange={(e) => setAiLogSuccess(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="true">Successes Only</option>
                <option value="false">Failures Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePruneLogs(30)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Prune &gt;30 Days
              </button>
              <button
                onClick={() => handlePruneLogs(0)}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Clear All Logs
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="p-3.5 font-semibold">User</th>
                    <th className="p-3.5 font-semibold">Feature Module</th>
                    <th className="p-3.5 font-semibold">Model / Provider</th>
                    <th className="p-3.5 font-semibold">Latency</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {aiLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3.5 text-slate-900 dark:text-white font-medium">{log.email}</td>
                      <td className="p-3.5 capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                        {log.feature}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {log.provider} / {log.model}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        <span
                          className={`font-semibold ${
                            (log.latency_ms || 0) < 1000
                              ? "text-emerald-600"
                              : (log.latency_ms || 0) < 2500
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {log.latency_ms ?? 0}ms
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            log.success
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }`}
                          title={log.error_message || undefined}
                        >
                          {log.success ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {aiLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No AI logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SYSTEM SETTINGS & BROADCASTS */}
      {/* ========================================================================= */}
      {tab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Announcement Broadcast Manager */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
              Global Platform Broadcast Announcement
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Display a dynamic banner message across the top of all user screens in real time.
            </p>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="annActive"
                  checked={Boolean(announcementForm.active)}
                  onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="annActive" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                  Broadcast banner currently active
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Banner Message Text
                </label>
                <textarea
                  rows={3}
                  value={announcementForm.text}
                  onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="e.g. Scheduled platform maintenance tonight at 2:00 AM UTC. All features will remain online."
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Banner Alert Level
                </label>
                <select
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, type: e.target.value as any }))}
                  className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="info">Info (Blue Accent)</option>
                  <option value="warning">Warning (Amber Accent)</option>
                  <option value="success">Success (Emerald Accent)</option>
                  <option value="alert">Critical Alert (Red Accent)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                Save &amp; Broadcast Announcement
              </button>
            </form>
          </div>

          {/* Environment & Configuration Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Server size={16} className="text-indigo-600 dark:text-indigo-400" />
              Runtime Environment Inspection
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Status of backend connectors, active AI engines, and database cluster.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-900 dark:text-white">MongoDB Atlas (Multi-Shard)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <span className="text-slate-500">Active AI Provider</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                  {settings?.environment?.aiProvider || "groq"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <span className="text-slate-500">Primary AI Model</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {settings?.environment?.aiModel || "llama-3.1-8b-instant"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <span className="text-slate-500">Daily Per-User AI Limit</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {settings?.environment?.dailyAiLimit || 50} requests / day
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <span className="text-slate-500">Groq API Key Configured</span>
                <span className={`font-semibold ${settings?.environment?.hasGroqKey ? "text-emerald-600" : "text-slate-400"}`}>
                  {settings?.environment?.hasGroqKey ? "Active (Configured)" : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <span className="text-slate-500">Hugging Face Token</span>
                <span className={`font-semibold ${settings?.environment?.hasHfToken ? "text-emerald-600" : "text-slate-400"}`}>
                  {settings?.environment?.hasHfToken ? "Active (Configured)" : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: CREATE & EDIT USER */}
      {/* ========================================================================= */}
      {(showCreateUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {showCreateUserModal ? "Create Platform User" : `Edit User: ${selectedUser?.email}`}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {showCreateUserModal ? "Password *" : "Reset Password (leave empty to keep)"}
                  </label>
                  <input
                    type="password"
                    required={showCreateUserModal}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Role
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, role: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="user">Candidate User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={userFormData.isActive ? "active" : "suspended"}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, isActive: e.target.value === "active" }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userFormData.full_name}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, full_name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={userFormData.target_role}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, target_role: e.target.value }))}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    value={userFormData.college}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, college: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData((p: any) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setShowEditUserModal(false);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
                >
                  {showCreateUserModal ? "Create Account" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {showDeleteUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Account</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete account{" "}
              <span className="font-bold text-slate-900 dark:text-white">{selectedUser.email}</span>?
            </p>
            <p className="mt-2 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40">
              Warning: This is a cascading delete. All associated profiles, resumes, job applications, interview sessions, and AI telemetry logs for this user will be deleted permanently.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteUserModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: USER DETAILS INSPECTOR */}
      {/* ========================================================================= */}
      {viewUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {viewUserDetails.profile?.full_name || "User Profile Details"}
                </h3>
                <p className="text-[11px] text-slate-500">{viewUserDetails.user.email} (ID: {viewUserDetails.user._id})</p>
              </div>
              <button
                onClick={() => setViewUserDetails(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <div className="text-slate-500 font-semibold mb-1">Target Role</div>
                <div className="font-bold text-slate-900 dark:text-white">{viewUserDetails.profile?.target_role || "Not specified"}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <div className="text-slate-500 font-semibold mb-1">College & Education</div>
                <div className="font-bold text-slate-900 dark:text-white">{viewUserDetails.profile?.college || "—"} ({viewUserDetails.profile?.education || "—"})</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Candidate Skills:</div>
              <div className="flex flex-wrap gap-1.5">
                {viewUserDetails.profile?.skills?.map((s) => (
                  <span key={s} className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {s}
                  </span>
                )) || <span className="text-slate-400">No skills listed.</span>}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Logged Applications ({viewUserDetails.applications?.length ?? 0}):
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {viewUserDetails.applications?.map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40 text-[11px]">
                    <span className="font-semibold text-slate-900 dark:text-white">{a.company} — {a.title}</span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold dark:bg-slate-700 uppercase">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewUserDetails(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLICATION CREATE / EDIT */}
      {/* ========================================================================= */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {selectedApp ? "Edit Job Application" : "Log Candidate Job Application"}
            </h3>

            <form onSubmit={handleSaveApp} className="space-y-3.5 text-xs">
              {!selectedApp && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Candidate *
                  </label>
                  <select
                    required
                    value={appFormData.user_id}
                    onChange={(e) => setAppFormData((p: any) => ({ ...p, user_id: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Candidate...</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.profile?.full_name ? `${u.profile.full_name} (${u.email})` : u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={appFormData.company}
                  onChange={(e) => setAppFormData((p: any) => ({ ...p, company: e.target.value }))}
                  placeholder="e.g. Google, Microsoft, Stripe"
                  className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={appFormData.title}
                  onChange={(e) => setAppFormData((p: any) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={appFormData.status}
                  onChange={(e) => setAppFormData((p: any) => ({ ...p, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="assessment">Assessment</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Posting URL (Optional)
                </label>
                <input
                  type="url"
                  value={appFormData.url}
                  onChange={(e) => setAppFormData((p: any) => ({ ...p, url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
                >
                  {selectedApp ? "Save Updates" : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTERVIEW TRANSCRIPT INSPECTOR */}
      {/* ========================================================================= */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mic size={18} className="text-purple-600" />
                  Mock Interview Session: {selectedInterview.role}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Candidate: {selectedInterview.email} • Difficulty: {selectedInterview.difficulty} • Type: {selectedInterview.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedInterview.messages?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-3.5 ${
                    msg.role === "assistant"
                      ? "border border-purple-200 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/20"
                      : "border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold uppercase">
                    <span className={msg.role === "assistant" ? "text-purple-700 dark:text-purple-300" : "text-slate-600 dark:text-slate-400"}>
                      {msg.role === "assistant" ? "AI Interviewer" : "Candidate Response"}
                    </span>
                    <span className="text-slate-400">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {/* AI Evaluation Feedback Card */}
                  {msg.feedback && (
                    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/80 p-2.5 text-[11px] dark:border-indigo-900/60 dark:bg-indigo-950/40">
                      <div className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 flex items-center gap-2">
                        <Sparkles size={12} /> AI Scoring &amp; Feedback:
                        <span className="text-slate-500">
                          (Correctness: {msg.feedback.correctness}/10 • Relevance: {msg.feedback.relevance}/10)
                        </span>
                      </div>
                      {msg.feedback.example && (
                        <div className="mt-1 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">Recommended exemplar: </span>
                          {msg.feedback.example}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!selectedInterview.messages || selectedInterview.messages.length === 0) && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No turn messages recorded in this session.
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedInterview(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
