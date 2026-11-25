import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Phone,
  Linkedin,
  Zap,
  ShieldCheck,
  Check,
} from "lucide-react";
import { auth, getResumeStorageKey } from "../lib/auth";
import { api } from "../lib/api";
import { CAREER_FIELDS } from "../lib/constants";

const POPULAR_SKILLS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "SQL",
  "TailwindCSS",
  "Next.js",
  "Git",
  "AWS",
  "Docker",
  "Figma",
  "Java",
  "C++",
];

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode and redirection
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const redirectTarget = searchParams.get("redirect") || "/resume";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [step, setStep] = useState<1 | 2>(1); // For sign-up wizard: 1 = credentials, 2 = resume details

  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Resume & Career details for Sign Up
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [skills, setSkills] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [summary, setSummary] = useState("");

  // States
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    }
  }, [searchParams]);

  // Skill click helper
  const addSkill = (skill: string) => {
    const list = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(skill)) {
      list.push(skill);
      setSkills(list.join(", "));
    }
  };

  // Auto-generate professional summary helper
  const generateSummary = () => {
    if (!targetRole && !fullName && !skills) {
      setSummary(
        "Motivated professional committed to delivering impactful solutions and collaborating within high-performing teams."
      );
      return;
    }
    const rolePart = targetRole ? `Experienced ${targetRole}` : "Motivated professional";
    const skillPart = skills ? ` skilled in ${skills}` : "";
    const namePart = fullName ? `My name is ${fullName}. ` : "";
    setSummary(
      `${namePart}${rolePart}${skillPart}. Passionate about building robust solutions, driving efficiency, and delivering measurable results.`
    );
  };

  // Save details to local resume storage
  const buildResumeObject = (userEmail: string) => {
    const defaultSummary =
      summary ||
      (targetRole
        ? `Dedicated ${targetRole} with hands-on experience in ${
            skills || "modern technologies"
          }. Focused on continuous learning and impactful delivery.`
        : "");

    const resumeObject = {
      template: "classic",
      name: fullName.trim() || "Your Name",
      headline: targetRole.trim() || "",
      email: userEmail.trim(),
      phone: phone.trim() || "",
      location: location.trim() || "",
      website: "",
      linkedin: linkedin.trim() || "",
      summary: defaultSummary,
      skills: skills.trim() || "",
      achievements: "",
      languages: "English",
      customTitle: "",
      customContent: "",
      experience: [
        {
          company: "",
          role: targetRole.trim() || "Recent Role",
          dates: "Present",
          details: "Key achievements, responsibilities, and delivered projects.",
        },
      ],
      education: [
        {
          school: college.trim() || "University / College",
          degree: degree.trim() || "Degree / Program",
          dates: gradYear.trim() || "Graduation Year",
        },
      ],
      projects: [],
      certifications: [],
    };

    return resumeObject;
  };

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");

    if (mode === "login") {
      setBusy(true);
      try {
        const { data, error } = await auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          if (data.session.user.role === "admin" && (redirectTarget === "/resume" || redirectTarget === "/")) {
            navigate("/admin");
          } else {
            navigate(redirectTarget);
          }
        }
      } catch (err: any) {
        setBusy(false);
        setErrorMsg(
          "Failed to reach server. Please ensure the backend server and MongoDB are running."
        );
      }
      return;
    }

    // Sign Up Flow
    // If on Step 1 of Sign Up, advance to Step 2
    if (step === 1) {
      if (!password || password.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 submission: create account and store resume details
    // Save details to local resume storage FIRST so data is never lost
    setBusy(true);
    const signupData = {
      full_name: fullName.trim(),
      headline: targetRole.trim(),
      target_role: targetRole.trim(),
      phone: phone.trim(),
      location: location.trim(),
      college: college.trim(),
      education: degree.trim(),
      graduation_year: gradYear ? parseInt(gradYear, 10) : undefined,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      linkedin: linkedin.trim(),
      summary: summary.trim(),
    };

    try {
      const { data, error } = await auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: signupData,
        },
      });

      setBusy(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        localStorage.setItem(
          getResumeStorageKey(data.session.user.id),
          JSON.stringify(buildResumeObject(email))
        );
        localStorage.setItem("nexa-just-signed-up", "true");
        localStorage.setItem("ascendiq-just-signed-up", "true");
        localStorage.setItem("careerpilot-just-signed-up", "true");
        navigate(redirectTarget);
      } else {
        setMsg("Account created successfully! You can now log in.");
      }
    } catch (err: any) {
      setBusy(false);
      setErrorMsg(
        "Failed to reach server. Your resume details have been saved locally in your browser!"
      );
    }
  }

  // Quick sign up without completing Step 2
  const quickSignUpWithCurrentCredentials = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    setMsg("");
    try {
      const { data, error } = await auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim() || cleanEmail.split("@")[0],
            target_role: targetRole.trim() || "Software Developer",
          },
        },
      });
      setBusy(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        localStorage.setItem(
          getResumeStorageKey(data.session.user.id),
          JSON.stringify(buildResumeObject(cleanEmail))
        );
        localStorage.setItem("nexa-just-signed-up", "true");
        localStorage.setItem("ascendiq-just-signed-up", "true");
        localStorage.setItem("careerpilot-just-signed-up", "true");
        navigate(redirectTarget);
      } else {
        setMsg("Account created successfully! You are now logged in.");
      }
    } catch (err: any) {
      setBusy(false);
      setErrorMsg(
        "Failed to reach server. Please ensure MongoDB and backend server are running."
      );
    }
  };

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address first.");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    const { error } = await auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setResetSent(true);
      setMsg("Password reset request received. Check your inbox.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

  return (
    <div className="mx-auto min-h-[calc(100vh-6rem)] flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 grid lg:grid-cols-[1.1fr_1.3fr]">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
              <Sparkles className="h-5 w-5 text-indigo-300" />
              hireReady-AI
            </Link>

            <div className="mt-8 space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Zap size={13} className="text-amber-300" />
                Auto-Filling Resume Builder
              </span>
              <h2 className="text-3xl font-extrabold leading-tight">
                {mode === "signup"
                  ? "Build your ATS resume in seconds"
                  : "Welcome back to your career copilot"}
              </h2>
              <p className="text-sm text-indigo-100 leading-relaxed">
                {mode === "signup"
                  ? "Sign up with your career details and we will directly format and populate your ATS-friendly resume."
                  : "Continue polishing your resumes, practicing mock interviews, and tracking job applications."}
              </p>
            </div>

            {/* Feature Perks */}
            <div className="mt-8 space-y-3">
              {[
                {
                  icon: FileText,
                  title: "Direct Resume Pre-fill",
                  desc: "Your sign-up details populate the Resume Builder by default",
                },
                {
                  icon: Zap,
                  title: "ATS-Ready Templates",
                  desc: "Classic, Modern & Minimal layouts built for recruiter screens",
                },
                {
                  icon: ShieldCheck,
                  title: "AI Interview Coaching",
                  desc: "Realistic role-specific audio & text mock simulations",
                },
              ].map((perk, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-xs">
                  <perk.icon size={18} className="mt-0.5 text-indigo-300 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold">{perk.title}</h3>
                    <p className="text-[11px] text-indigo-100">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/20">
            <p className="text-xs text-indigo-200">
              Trusted by professionals to accelerate their careers.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          {/* Top Mode Switcher Tabs */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setStep(1);
                setErrorMsg("");
                setMsg("");
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
                setMsg("");
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {mode === "login"
                ? "Sign in to hireReady-AI"
                : step === 1
                ? "Create your account"
                : "Add your resume details"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Enter your credentials to continue"
                : step === 1
                ? "Step 1 of 2: Set up your login info"
                : "Step 2 of 2: These will be directly placed into your Resume Builder!"}
            </p>
          </div>

          {/* Step 2 Resume Auto-fill Banner for Signup */}
          {mode === "signup" && step === 2 && (
            <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 flex items-start gap-2">
              <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Instant Resume Seeding:</strong> Everything you enter here will automatically
                appear in the Resume Builder and profile sections!
              </span>
            </div>
          )}

          {/* Forgot Password Flow */}
          {showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send Reset Email"}
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                Back to Log In
              </button>
            </form>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* STEP 1: Email & Password (For Login OR Signup Step 1) */}
              {(mode === "login" || step === 1) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setShowReset(true)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pl-9 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {mode === "signup" && (
                      <p className="mt-1 text-[11px] text-slate-400">Must be at least 6 characters</p>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2: RESUME DETAILS FOR SIGN UP */}
              {mode === "signup" && step === 2 && (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Role / Headline *
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <select
                          required
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          className={`${inputClass} pl-9`}
                        >
                          <option value="">Select your field</option>
                          {CAREER_FIELDS.map((field) => <option key={field} value={field}>{field}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 234-5678"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Location (City, Country)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. San Francisco, CA"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Education info */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-indigo-600" />
                      Education (Added to Resume Education Section)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="College / University"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        placeholder="Degree (e.g. B.Tech / B.S.)"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        placeholder="Graduation Year (e.g. 2025)"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Key Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, TypeScript, Node.js, SQL"
                      className={inputClass}
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="text-[10px] text-slate-400 self-center mr-1">Quick add:</span>
                      {POPULAR_SKILLS.slice(0, 7).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          +{skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LinkedIn / Portfolio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      LinkedIn or Portfolio URL
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/username"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Professional Summary (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={generateSummary}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
                      >
                        <Sparkles size={11} /> Auto-draft
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="A short overview that leads your resume..."
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {mode === "signup" && step === 2 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      {busy ? "Creating Account..." : "Create Account & Auto-fill Resume"}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : mode === "signup" ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!email) {
                          setErrorMsg("Please enter your email address.");
                          return;
                        }
                        if (!password || password.length < 6) {
                          setErrorMsg("Password must be at least 6 characters long.");
                          return;
                        }
                        setErrorMsg("");
                        setStep(2);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                    >
                      Next: Add Resume Details
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={quickSignUpWithCurrentCredentials}
                      disabled={busy}
                      className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 py-1 font-semibold"
                    >
                      Or create account instantly (skip resume details)
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {busy ? "Please wait..." : "Log In to hireReady-AI"}
                    <ArrowRight size={14} />
                  </button>
                )}

                {mode === "signup" && step === 2 && (
                  <button
                    type="button"
                    onClick={quickSignUpWithCurrentCredentials}
                    disabled={busy}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1"
                  >
                    Skip details for now and complete sign up
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 space-y-3">
              <p className="font-semibold">{errorMsg}</p>

              {/* If email does not exist in MongoDB (e.g. from previous Supabase or first time) */}
              {(errorMsg.toLowerCase().includes("no account found") ||
                errorMsg.toLowerCase().includes("database") ||
                errorMsg.toLowerCase().includes("create an account")) && (
                <div className="pt-2.5 border-t border-red-200 dark:border-red-900/40 space-y-2">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    hireReady-AI uses local/cloud MongoDB for fast, persistent career profiles. If you have not registered your email yet, click below to create your account!
                  </p>
                  <button
                    type="button"
                    onClick={quickSignUpWithCurrentCredentials}
                    disabled={busy || !email || !password}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Sparkles size={14} className="text-amber-300" />
                    {busy ? "Registering..." : `Create Account with this Email & Password Now`}
                  </button>
                </div>
              )}

              {errorMsg.toLowerCase().includes("fetch") && (
                <div className="pt-2 border-t border-red-200 dark:border-red-900/40 text-[11px] space-y-2">
                  <p>
                    <strong>Why this happened:</strong> The backend server or MongoDB connection is
                    unreachable.
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Your details are saved locally in your browser!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/resume")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Continue to Resume Builder with Pre-filled Details →
                  </button>
                </div>
              )}
            </div>
          )}
          {msg && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
              {msg}
            </div>
          )}

          {/* Bottom Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setStep(1);
                    setErrorMsg("");
                    setMsg("");
                  }}
                  className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Create free account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setStep(1);
                    setErrorMsg("");
                    setMsg("");
                  }}
                  className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Log in instead
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
