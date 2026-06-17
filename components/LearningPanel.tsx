"use client";

import { useState, useEffect } from "react";

interface LessonSection {
  title: string;
  emoji: string;
  concept: string;
  explanation: string;
  codeHint: string;
  takeaway: string;
}

type PanelPhase = "intro" | "loading" | "lesson" | "error";

interface Props {
  code: string;
  prompt: string;
  onClose: () => void;
}

export default function LearningPanel({ code, prompt, onClose }: Props) {
  const [panelPhase, setPanelPhase] = useState<PanelPhase>("intro");
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  async function startLesson() {
    setPanelPhase("loading");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate lesson");
      const data = await res.json();
      if (!data.sections?.length) throw new Error("No lesson sections returned");
      setSections(data.sections);
      setStep(0);
      setPanelPhase("lesson");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPanelPhase("error");
    }
  }

  const section = sections[step];
  const isLast = step === sections.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        visible ? "bg-slate-950/75 backdrop-blur-sm" : "bg-transparent backdrop-blur-none pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-md bg-slate-900 border border-violet-500/25 rounded-3xl shadow-2xl shadow-violet-950/60 overflow-hidden transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] to-fuchsia-500/[0.04] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[10px]">✨</div>
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Learning Path</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-600 hover:text-slate-300 transition-colors w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-800 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* ── Intro ── */}
        {panelPhase === "intro" && (
          <div className="px-6 pt-6 pb-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/20 flex items-center justify-center text-3xl mx-auto mb-5">
              🎉
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Your app is ready!</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Want to understand what Claude just built? I can walk you through the key concepts in your code — great for learning how to build apps.
            </p>
            <button
              type="button"
              onClick={startLesson}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 mb-3"
            >
              🧠 Yes, teach me what was built
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-2 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {panelPhase === "loading" && (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-2xl mx-auto mb-5 animate-pulse">
              🧠
            </div>
            <p className="text-white font-semibold mb-1.5">Analyzing your code…</p>
            <p className="text-slate-500 text-sm">Claude is preparing your lesson</p>
            <div className="flex justify-center gap-1 mt-5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {panelPhase === "error" && (
          <div className="px-6 py-10 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Lesson ── */}
        {panelPhase === "lesson" && section && (
          <>
            {/* Progress bar */}
            <div className="flex items-center gap-1.5 px-6 mt-5">
              {sections.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step
                      ? "bg-violet-500 flex-1"
                      : i < step
                      ? "bg-violet-700 w-5"
                      : "bg-slate-700 w-5"
                  }`}
                />
              ))}
              <span className="text-[10px] text-slate-500 ml-1.5 flex-shrink-0 tabular-nums">
                {step + 1}/{sections.length}
              </span>
            </div>

            <div className="px-6 pt-5 pb-0 space-y-4">
              {/* Emoji + title + concept */}
              <div>
                <span className="text-3xl leading-none">{section.emoji}</span>
                <h3 className="text-base font-bold text-white mt-2 mb-2">{section.title}</h3>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-3.5 py-2.5">
                  <p className="text-xs text-violet-300 leading-relaxed font-medium">{section.concept}</p>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-sm text-slate-300 leading-relaxed">{section.explanation}</p>

              {/* Code hint */}
              {section.codeHint && (
                <div className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 overflow-x-auto">
                  <p className="text-[11px] font-mono text-violet-300 whitespace-pre leading-relaxed">
                    {section.codeHint}
                  </p>
                </div>
              )}

              {/* Takeaway */}
              <div className="flex gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-3">
                <span className="text-emerald-400 flex-shrink-0 mt-0.5">💡</span>
                <p className="text-xs text-emerald-300 leading-relaxed font-medium">{section.takeaway}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-6 py-5">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-xl hover:bg-slate-800"
              >
                ← Back
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-900/30"
                >
                  Done — Show me the app ✨
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-900/30"
                >
                  Next →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
