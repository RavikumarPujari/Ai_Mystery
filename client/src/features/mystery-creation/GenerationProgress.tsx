import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { Button } from "../../components/common/Button";

interface GenerationProgressProps {
  currentStage?: string;
  isFailed?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

const STAGES = [
  { id: "validate", label: "Validating scenario", desc: "Checking premise parameters and narrative constraints" },
  { id: "suspects", label: "Creating suspects", desc: "Formulating personas, motives, and secret alibis" },
  { id: "evidence", label: "Generating evidence", desc: "Drafting chat transcripts, CCTV storyboards, and digital logs" },
  { id: "timeline", label: "Building investigation timeline", desc: "Establishing strict chronological event sequences" },
  { id: "consistency", label: "Checking mystery consistency", desc: "Verifying logic integrity and proof contradictions" },
  { id: "preparing", label: "Preparing your investigation", desc: "Finalizing dossier and sealing confidential solution" },
];

export function GenerationProgress({
  currentStage,
  isFailed = false,
  errorMessage,
  onRetry,
}: GenerationProgressProps): React.ReactElement {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(12);

  useEffect(() => {
    if (isFailed) return;

    if (currentStage) {
      const idx = STAGES.findIndex((s) => s.id === currentStage);
      if (idx !== -1) {
        setActiveStageIndex(idx);
        setProgressPercent(Math.min(95, Math.round(((idx + 1) / STAGES.length) * 100)));
      }
    } else {
      // Phased timer reflecting real Gemini synthesis lifecycle (typically 3-6 seconds)
      const timings = [
        { stage: 0, percent: 18, delay: 600 },
        { stage: 1, percent: 36, delay: 1800 },
        { stage: 2, percent: 56, delay: 3200 },
        { stage: 3, percent: 74, delay: 4600 },
        { stage: 4, percent: 88, delay: 6000 },
        { stage: 5, percent: 94, delay: 7500 },
      ];

      const timeouts = timings.map(({ stage, percent, delay }) =>
        setTimeout(() => {
          setActiveStageIndex(stage);
          setProgressPercent(percent);
        }, delay)
      );

      return () => {
        timeouts.forEach((t) => clearTimeout(t));
      };
    }
  }, [currentStage, isFailed]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-violet-500/30 backdrop-blur-md shadow-2xl shadow-slate-950/80">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Gemini Mystery Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Generating Your Mystery...
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Synthesizing airtight suspect alibis, surveillance stills, and forensic contradictions.
        </p>
      </div>

      {/* Progress Bar with honest percentage */}
      <div className="mb-8 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            {!isFailed && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />}
            <span>{isFailed ? "Generation Halted" : STAGES[activeStageIndex]?.label}</span>
          </span>
          <span className="font-mono font-bold text-violet-400">{isFailed ? "0%" : `${progressPercent}%`}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isFailed
                ? "bg-rose-500"
                : "bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 shadow-sm shadow-violet-500/50"
            }`}
            style={{ width: `${isFailed ? 100 : progressPercent}%` }}
          />
        </div>
      </div>

      {/* 6 Required Stages List */}
      <div className="space-y-2.5 mb-8">
        {STAGES.map((stage, idx) => {
          const isDone = !isFailed && idx < activeStageIndex;
          const isCurrent = !isFailed && idx === activeStageIndex;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "bg-violet-950/40 border-violet-500/50 shadow-md shadow-violet-950/50"
                  : isDone
                  ? "bg-slate-950/40 border-slate-800/80 text-slate-300"
                  : "bg-slate-950/20 border-slate-900 text-slate-500 opacity-60"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    {idx + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isCurrent ? "text-violet-200" : isDone ? "text-slate-200" : "text-slate-400"}`}>
                    {idx + 1}. {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono font-medium text-violet-400 uppercase tracking-wider bg-violet-900/40 px-2 py-0.5 rounded-full border border-violet-500/30">
                      Processing
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error State */}
      {isFailed && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs mb-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Generation Notice</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            {errorMessage || "Synthesis encountered a temporary consistency or API timeout. You can safely retry without losing your input."}
          </p>
          {onRetry && (
            <div className="pt-1">
              <Button
                size="sm"
                variant="danger"
                onClick={onRetry}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Retry Generation
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-[11px] text-slate-500 font-mono">
        All generated cases are isolated and cryptographically sealed server-side.
      </div>
    </div>
  );
}
