"use client";

import { useState, useRef, useCallback } from "react";
import { EXAMPLE_PROMPTS } from "@/lib/prompts";

type Phase = "idle" | "generating" | "done" | "error";
type Tab = "preview" | "code";

interface HistoryEntry {
  id: string;
  prompt: string;
  code: string;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (promptText: string) => {
    if (!promptText.trim() || phase === "generating") return;

    abortControllerRef.current = new AbortController();

    setPhase("generating");
    setGeneratedCode("");
    setError(null);
    setTokenCount(0);
    setActiveTab("code"); // Show code streaming in real time

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error || "Generation failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (fullCode === "" && chunk.startsWith("ERROR:")) {
          throw new Error(chunk.replace("ERROR:", ""));
        }

        fullCode += chunk;
        setGeneratedCode(fullCode);
        setTokenCount(Math.round(fullCode.length / 4));

        if (codeRef.current) {
          codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
      }

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        prompt: promptText,
        code: fullCode,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 3));

      setPhase("done");
      setActiveTab("preview");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setPhase("idle");
        return;
      }
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setPhase("error");
    }
  }, [phase]);

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    generate(prompt);
  }

  function handleExampleClick(ex: { label: string; prompt: string }) {
    setPrompt(ex.prompt);
    generate(ex.prompt);
  }

  function handleHistoryClick(entry: HistoryEntry) {
    setPrompt(entry.prompt);
    setGeneratedCode(entry.code);
    setPhase("done");
    setActiveTab("preview");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vibemint-app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleNewApp() {
    setPhase("idle");
    setGeneratedCode("");
    setPrompt("");
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  const isGenerating = phase === "generating";
  const isDone = phase === "done";
  const isError = phase === "error";
  const isIdle = phase === "idle";

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white">Lovable.dev Clone</h1>
              </div>
              <p className="text-[10px] text-violet-400 -mt-0.5 font-medium">
                Describe it. Mint it.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDone && (
            <button
              onClick={handleNewApp}
              className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all"
            >
              + New App
            </button>
          )}
          <div className="text-[10px] text-slate-600 font-medium">
            Built by Juan Fernandez & Andres Ballares
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ── */}
        <aside className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden">
          {/* Prompt form */}
          <form onSubmit={handleSubmit} className="p-4 border-b border-white/10 space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              What do you want to build?
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  generate(prompt);
                }
              }}
              placeholder="Describe your app in plain English…"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all leading-relaxed"
              rows={4}
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
            >
              {isGenerating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>Generate App ✨</>
              )}
            </button>
            {!isGenerating && (
              <p className="text-[10px] text-slate-600 text-center">⌘ + Enter to generate</p>
            )}
            {isGenerating && (
              <button
                type="button"
                onClick={handleStop}
                className="w-full text-xs font-bold py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all"
              >
                ■ Stop generating
              </button>
            )}
            {isGenerating && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Generating…</span>
                  <span>~{tokenCount} tokens</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}
          </form>

          {/* Scrollable area for examples + history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Try an example
              </p>
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleExampleClick(ex)}
                  disabled={isGenerating}
                  className="w-full text-left text-xs text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-white/5 hover:border-violet-500/40 px-3 py-2.5 rounded-lg transition-all disabled:opacity-40 group"
                >
                  <span className="font-semibold text-slate-300 group-hover:text-violet-300 block text-[11px]">
                    {ex.label}
                  </span>
                  <span className="text-slate-500 text-[10px] leading-relaxed line-clamp-2 mt-0.5">
                    {ex.prompt}
                  </span>
                </button>
              ))}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Recent sessions
                </p>
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleHistoryClick(entry)}
                    className="w-full text-left bg-slate-900/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 px-3 py-2.5 rounded-lg transition-all"
                  >
                    <p className="text-[10px] text-slate-300 truncate">{entry.prompt}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {Math.round(entry.code.length / 4)} tokens
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {isIdle ? (
            /* ── Empty state ── */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/20 flex items-center justify-center text-4xl mb-6">
                ✨
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Describe any app. Watch it appear.
              </h2>
              <p className="text-slate-400 max-w-sm text-sm leading-relaxed mb-8">
                Type what you want to build in plain English — a todo list, a dashboard, a booking form. VibeMint turns it into a real, working web app in seconds.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => handleExampleClick(ex)}
                    className="text-xs font-medium text-violet-300 border border-violet-500/30 hover:border-violet-400/60 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-full transition-all"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          ) : isError ? (
            /* ── Error state ── */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-base font-bold text-red-400 mb-2">Generation failed</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-sm font-mono bg-slate-900 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
              <button
                onClick={() => generate(prompt)}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* ── Preview / Code view ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tab bar */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-950/50">
                <div className="flex gap-1 bg-slate-900 border border-white/5 p-1 rounded-xl">
                  {(["preview", "code"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                        activeTab === tab
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {tab === "preview" ? "🖥 Preview" : "</>  Code"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-[11px] text-violet-400 font-medium mr-2">
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                            style={{ animationDelay: `${i * 120}ms` }}
                          />
                        ))}
                      </span>
                      AI is writing your app…
                    </div>
                  )}

                  {isDone && (
                    <>
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          copied
                            ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                            : "text-slate-400 hover:text-white border-white/10 hover:border-white/20 bg-slate-900 hover:bg-slate-800"
                        }`}
                      >
                        {copied ? "✓ Copied!" : "Copy code"}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
                      >
                        ↓ .html
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === "preview" ? (
                  isDone ? (
                    <iframe
                      srcDoc={generatedCode}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      className="w-full h-full border-0 bg-white"
                      title="Generated App Preview"
                    />
                  ) : (
                    /* Streaming: show code building up in preview tab too */
                    <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse">
                          ✨
                        </div>
                        <p className="text-sm font-semibold text-white mb-1">Building your app…</p>
                        <p className="text-xs text-slate-500">Preview will appear when ready</p>
                      </div>
                    </div>
                  )
                ) : (
                  /* Code tab */
                  <pre
                    ref={codeRef}
                    className="w-full h-full overflow-auto p-5 text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-950 m-0"
                  >
                    {generatedCode || (
                      <span className="text-slate-600">// Code will appear here as it streams…</span>
                    )}
                    {isGenerating && (
                      <span className="inline-block w-2 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </pre>
                )}
              </div>

              {/* Status bar */}
              {(isDone || isGenerating) && (
                <div className="flex-shrink-0 border-t border-white/5 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isGenerating ? "bg-violet-400 animate-pulse" : "bg-emerald-400"
                      }`}
                    />
                    <span>{isGenerating ? "Generating" : "Ready"}</span>
                    {generatedCode && (
                      <>
                        <span>·</span>
                        <span>{generatedCode.split("\n").length} lines</span>
                        <span>·</span>
                        <span>{(generatedCode.length / 1024).toFixed(1)} KB</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    claude-sonnet-4-6 · VibeMint v1
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
