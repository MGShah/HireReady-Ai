import { useState } from "react";
import { Sparkles, Send, Bot, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { api, errMsg } from "../lib/api";

const QUICK_PROMPTS = [
  "What are the top 3 skills for a full stack engineer?",
  "How should I prepare for a behavioral interview?",
  "Key guidelines to optimize my resume for ATS screening?",
  "How to answer: 'Describe a difficult bug you solved'?",
];

export default function AiAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [model, setModel] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAsk(promptToAsk?: string) {
    const q = (promptToAsk ?? question).trim();
    if (!q) return;

    if (promptToAsk) {
      setQuestion(promptToAsk);
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setNotice(null);
    setIsDemo(false);

    try {
      const { data } = await api.post("/api/ai/ask", { question: q });
      setAnswer(data.answer);
      setModel(data.model || "Hugging Face Model");
      setIsDemo(Boolean(data.demo));
      setNotice(data.notice || null);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-xs dark:border-indigo-950/60 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Bot size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>hireReady-AI AI Copilot</span>
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">

                {model || "AI Career Copilot"}
              </span>
            </h2>
            <p className="text-xs text-slate-500">Instant role-specific career advice, interview strategy, and skill guidance.</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleAsk(prompt)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything (e.g. How to explain a microservices project in an interview?)..."
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Thinking…</span>
            </>
          ) : (
            <>
              <Send size={13} />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Error notification */}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Output */}
      {answer && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400" />
              <span>Generated by {model}</span>
              {isDemo && (
                <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Preview
                </span>
              )}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {notice && (
            <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
              💡 {notice}
            </p>
          )}

          <div className="mt-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
