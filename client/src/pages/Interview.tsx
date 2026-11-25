import { useEffect, useRef, useState } from "react";
import { api, errMsg } from "../lib/api";
import {
  Sparkles,
  Lightbulb,
  AlertCircle,
  RotateCcw,
  Trophy,
  ChevronDown,
  ChevronUp,
  Brain,
  Send,
  UserRound,
  Video,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CAREER_FIELDS } from "../lib/constants";
import { loadCareerContext, subscribeToCareerContext } from "../lib/careerContext";

type Fb = {
  correctness: number;
  relevance: number;
  clarity: number;
  missing: string[];
  example: string;
};

type Turn = { q: string; a?: string; fb?: Fb };
type SpeechRecognitionResultEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
};
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const TYPES = ["technical", "coding", "project"];

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const color =
    score >= 8
      ? "bg-green-500"
      : score >= 6.5
      ? "bg-indigo-600"
      : "bg-amber-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-900 dark:text-white">{score} / 10</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Interview() {
  const [cfg, setCfg] = useState({
    role: "Software Developer",
    type: "technical",
    difficulty: "medium",
    question_count: 5,
  });
  const [sid, setSid] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const answerBeforeListeningRef = useRef("");

  // AI Hint state
  const [hintLoading, setHintLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<{
    framework: string;
    keyPoints: string[];
    hint: string;
  } | null>(null);

  // Expanded model answers map
  const [expandedExamples, setExpandedExamples] = useState<Record<number, boolean>>({});

  const toggleExample = (index: number) => {
    setExpandedExamples((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setVoiceSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    loadCareerContext()
      .then((context) => {
        if (context.targetRole) {
          setCfg((current) => ({ ...current, role: context.targetRole }));
        }
      })
      .catch(() => undefined);
    return subscribeToCareerContext(() => {
      loadCareerContext()
        .then((context) => {
          if (context.targetRole) {
            setCfg((current) => ({ ...current, role: context.targetRole }));
          }
        })
        .catch(() => undefined);
    });
  }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setErr("Voice input is not supported in this browser. You can still type your answer.");
      return;
    }

    const recognition = new Recognition();
    answerBeforeListeningRef.current = answer.trim();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index]![0]!.transcript;
      }
      setAnswer([answerBeforeListeningRef.current, transcript.trim()].filter(Boolean).join(" "));
    };
    recognition.onerror = () => {
      setIsListening(false);
      setErr("Microphone input stopped. Check browser microphone permission and try again.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setErr("");
    setIsListening(true);
    recognition.start();
  }

  async function start() {
    setBusy(true);
    setErr("");
    setActiveHint(null);
    try {
      const context = await loadCareerContext().catch(() => null);
      const { data } = await api.post("/api/interviews", {
        ...cfg,
        ...(context ? {
          candidate_skills: context.skills,
          resume_context: {
            summary: context.resume.summary,
            experience: context.resume.experience,
          },
        } : {}),
      });
      setSid(data.session.id);
      setTurns([{ q: data.question }]);
      setDone(false);
      speak(data.question);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function requestHint() {
    if (!sid) return;
    setHintLoading(true);
    try {
      const { data } = await api.post(`/api/interviews/${sid}/hint`);
      setActiveHint(data);
    } catch {
      setActiveHint({
        framework: "Role checkpoint method",
        keyPoints: [
          "Identify the role responsibility being tested and define a strong result.",
          "Describe the concrete role-specific steps, decisions, and methods.",
          "Conclude with quality checks and measurable evidence of impact.",
        ],
        hint: `Focus on ${cfg.role}-specific practice and evidence rather than general statements.`,
      });
    } finally {
      setHintLoading(false);
    }
  }

  async function send() {
    if (!sid || !answer.trim()) return;
    setBusy(true);
    setErr("");
    setActiveHint(null);
    try {
      const { data } = await api.post(`/api/interviews/${sid}/answer`, { answer });
      setTurns((t) => [
        ...t.slice(0, -1),
        { ...t[t.length - 1]!, a: answer, fb: data.feedback },
        ...(data.nextQuestion ? [{ q: data.nextQuestion as string }] : []),
      ]);
      setAnswer("");
      setDone(data.completed);
      if (data.nextQuestion) speak(data.nextQuestion);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  // Calculate overall performance summary if completed
  const completedFeedback = turns.filter((t) => t.fb).map((t) => t.fb!);
  const avgScore = completedFeedback.length
    ? Math.round(
        (completedFeedback.reduce(
          (acc, f) => acc + (f.correctness + f.relevance + f.clarity) / 3,
          0
        ) /
          completedFeedback.length) *
          10
      ) / 10
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Career practice studio
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Interview Lab</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles size={12} /> Adaptive AI Coach
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Practice role-specific interview checkpoints. Receive instant critiques and model answers focused on the selected role.
          </p>
        </div>

        {sid && (
          <button
            onClick={() => {
              setSid(null);
              setTurns([]);
              setDone(false);
              setActiveHint(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <RotateCcw size={14} /> New Interview
          </button>
        )}
      </div>

      {/* Configuration Section (if not active session) */}
      {!sid && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid lg:grid-cols-[0.8fr_1.7fr]">
            <div className="border-b border-slate-200 bg-slate-950 p-6 text-white dark:border-slate-800 lg:border-b-0 lg:border-r">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/25">
                <Brain size={20} />
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Build your round</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight">A focused practice session, tuned to your next role.</h2>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                Choose the pressure level and checkpoint style. Your AI interviewer will adapt every question to your role and answers.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                <div>
                  <p className="text-lg font-extrabold text-white">5</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Default Qs</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">1:1</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Feedback</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">AI</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Adaptive</p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configure your interview session</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Set the context, then let the coaching begin.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Role
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                value={cfg.role}
                onChange={(e) => setCfg({ ...cfg, role: e.target.value })}
              >
                {CAREER_FIELDS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Round Focus
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white capitalize"
                value={cfg.type}
                onChange={(e) => setCfg({ ...cfg, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Difficulty
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white capitalize"
                value={cfg.difficulty}
                onChange={(e) => setCfg({ ...cfg, difficulty: e.target.value })}
              >
                {["easy", "medium", "hard"].map((d) => (
                  <option key={d} value={d} className="capitalize">
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Questions
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                value={cfg.question_count}
                onChange={(e) => setCfg({ ...cfg, question_count: Number(e.target.value) })}
              >
                {[3, 5, 8].map((c) => (
                  <option key={c} value={c}>
                    {c} Questions
                  </option>
                ))}
              </select>
            </label>
          </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck size={13} className="mr-1 inline text-emerald-500" />
                  Your answers stay inside this practice session.
                </p>
            <button
              disabled={busy}
              onClick={start}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Brain size={16} />
              {busy ? "Starting AI Session..." : "Begin Mock Interview"}
            </button>
              </div>
          </div>
          </div>
        </section>
      )}

      {/* Interview Dialogue Turns */}
      {sid && (
        <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 text-white shadow-lg shadow-indigo-950/15 dark:border-indigo-900">
          <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-indigo-500 text-white shadow-lg shadow-indigo-950/40">
              <UserRound size={30} />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-indigo-950 bg-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <div className="min-w-[12rem] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold">Maya Chen</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-100">AI Interviewer</span>
              </div>
              <p className="mt-1 text-xs text-indigo-100/80">Senior Engineering Manager · Your calm, supportive practice partner</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-semibold text-indigo-100">
              <Video size={14} /> Live practice room
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 bg-black/10 px-4 py-2.5 text-[11px] text-indigo-100/90 sm:px-5">
            <ShieldCheck size={14} className="text-emerald-300" />
            No pressure here — take a breath, think out loud, and build confidence one answer at a time.
          </div>
          <div className="border-t border-white/10 px-4 py-3 sm:px-5">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-indigo-100/80">
              <span>Round progress</span>
              <span>{completedFeedback.length} of {cfg.question_count} answered</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (completedFeedback.length / cfg.question_count) * 100)}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {turns.map((t, i) => (
        <div key={i} className="space-y-4">
          {/* Question Card */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-950/60 dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Question {i + 1} of {cfg.question_count}
              </span>
              <span className="text-[11px] text-slate-500 font-medium capitalize">
                {cfg.role} · {cfg.type}
              </span>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
              {t.q}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => (isSpeaking ? stopSpeaking() : speak(t.q))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                {isSpeaking ? "Stop interviewer" : "Hear interviewer"}
              </button>
              <span className="text-[10px] text-slate-400">Maya can read this question aloud</span>
            </div>
          </div>

          {/* Candidate Answer Card */}
          {t.a && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Your Answer
              </span>
              <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {t.a}
              </p>
            </div>
          )}

          {/* AI Evaluation Card */}
          {t.fb && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" /> AI Interviewer Feedback
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Overall Score: {Math.round(((t.fb.correctness + t.fb.relevance + t.fb.clarity) / 3) * 10) / 10} / 10
                </span>
              </div>

              {/* Score Bars */}
              <div className="grid gap-3 sm:grid-cols-3">
                <ScoreBar label="Correctness" score={t.fb.correctness} />
                <ScoreBar label="Relevance" score={t.fb.relevance} />
                <ScoreBar label="Clarity & Depth" score={t.fb.clarity} />
              </div>

              {/* Missing Considerations */}
              {t.fb.missing.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <AlertCircle size={13} className="text-amber-500" /> Key Elements to Address:
                  </span>
                  <div className="space-y-1">
                    {t.fb.missing.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-amber-50/70 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 flex items-start gap-1.5"
                      >
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Senior Model Answer Toggle */}
              {t.fb.example && (
                <div className="pt-2">
                  <button
                    onClick={() => toggleExample(i)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <Lightbulb size={13} />
                    {expandedExamples[i] ? "Hide Senior Model Answer" : "View Senior Model Answer"}
                    {expandedExamples[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {expandedExamples[i] && (
                    <div className="mt-2 rounded-xl bg-indigo-50/60 p-4 text-xs leading-relaxed text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/50">
                      <strong className="block mb-1 text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        Senior Engineering Lead Approach:
                      </strong>
                      {t.fb.example}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Answering Form (Active Question) */}
      {sid && !done && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Compose Your Response
            </label>
            <button
              type="button"
              onClick={requestHint}
              disabled={hintLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
            >
              <Lightbulb size={13} className={hintLoading ? "animate-spin text-indigo-600" : "text-indigo-600"} />
              {hintLoading ? "Thinking..." : "💡 AI Suggest Answer Hint"}
            </button>
          </div>

          {/* AI Hint Card */}
          {activeHint && (
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 text-xs dark:border-indigo-900 dark:from-indigo-950/50 dark:to-blue-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-indigo-600" /> Answer Framework: {activeHint.framework}
                </span>
                <button
                  onClick={() => setActiveHint(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-1 text-indigo-800 dark:text-indigo-300">
                {activeHint.keyPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-500 italic pt-1">{activeHint.hint}</p>
            </div>
          )}

          <textarea
            className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            rows={5}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Be specific about technologies, trade-offs, and measurable outcomes."
            aria-label="Your answer"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                type="button"
                onClick={toggleListening}
                disabled={!voiceSupported}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isListening
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                }`}
                title={voiceSupported ? "Use your microphone to answer" : "Voice input is not supported in this browser"}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? "Stop recording" : "Answer by voice"}
              </button>
            </div>
            <button
              disabled={busy || !answer.trim()}
              onClick={send}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send size={14} />
              {busy ? "Evaluating Answer..." : "Submit Answer"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            {voiceSupported ? (isListening ? "Listening… speak naturally. Your transcript will appear above." : "Use the microphone for a hands-free mock interview, or type your answer.") : "Voice input is unavailable in this browser; typed answers are still available."}
          </p>
        </div>
      )}

      {/* Completion Report Card */}
      {done && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 p-6 text-center dark:border-indigo-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Trophy size={28} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Interview Round Complete!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              You answered all {cfg.question_count} questions for the {cfg.role} position.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-white dark:bg-slate-800 px-5 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500">Overall Rating:</span>
            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {avgScore} / 10
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${avgScore >= 8 ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800"}`}>
              {avgScore >= 8 ? "Strong Recommendation" : "Pass & Proceed"}
            </span>
          </div>

          <div className="pt-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
              onClick={() => {
                setSid(null);
                setTurns([]);
                setDone(false);
                setActiveHint(null);
              }}
            >
              <RotateCcw size={14} /> Practice Another Interview
            </button>
          </div>
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </div>
      )}
    </div>
  );
}
