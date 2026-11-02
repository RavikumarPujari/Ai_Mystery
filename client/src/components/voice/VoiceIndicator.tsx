import React from "react";
import {
  Mic,
  MicOff,
  AlertCircle,
  X,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { useVoice } from "../../context/VoiceContext";

export function VoiceIndicator(): React.ReactElement | null {
  const {
    isListening,
    status,
    transcript,
    interimTranscript,
    lastFeedback,
    error,
    pendingConfirmation,
    stopListening,
    confirmAction,
    cancelAction,
    clearFeedback,
  } = useVoice();

  // If completely idle and no error, render nothing
  if (!isListening && status !== "error" && !lastFeedback) {
    return null;
  }

  return (
    <aside
      aria-label="Voice Assistant Status and Controls"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 sm:px-0 pointer-events-auto transition-all duration-200"
    >
      <div className="bg-slate-950/95 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-950/80 backdrop-blur-xl p-4 text-white space-y-3">
        {/* Header row: Status & Stop Button */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            {status === "listening" && (
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
              </div>
            )}
            {status === "processing" && (
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            )}
            {status === "error" && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            )}

            <div>
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {status === "listening"
                    ? "Voice Assistant Active"
                    : status === "processing"
                    ? "Executing Command..."
                    : status === "error"
                    ? "Voice Assistant Notice"
                    : "Voice Assistant"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {status === "listening"
                  ? "Listening for navigation and investigation commands"
                  : status === "processing"
                  ? "Processing recognized phrase"
                  : "Inactive"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isListening && (
              <button
                type="button"
                onClick={stopListening}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                aria-label="Stop Voice Assistant"
              >
                <MicOff className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}
            {!isListening && (
              <button
                type="button"
                onClick={clearFeedback}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pending Confirmation Modal (Consequential Action Safeguard) */}
        {pendingConfirmation && (
          <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/60 space-y-2.5">
            <div className="text-xs font-semibold text-purple-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{pendingConfirmation.prompt}</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelAction}
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel (Say &quot;No&quot;)
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer shadow-sm shadow-purple-600/40"
              >
                Confirm (Say &quot;Yes&quot;)
              </button>
            </div>
          </div>
        )}

        {/* Live Recognized Speech Transcript */}
        {isListening && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 font-mono text-xs space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span>Live Transcription</span>
            </div>
            <p className="text-slate-200 min-h-[1.25rem] break-words">
              {interimTranscript || transcript ? (
                <span>
                  {transcript}{" "}
                  <span className="text-purple-400 italic">
                    {interimTranscript}
                  </span>
                </span>
              ) : (
                <span className="text-slate-500 italic">
                  Say a command like &quot;Go to Home&quot;, &quot;Create Mystery&quot;, or &quot;Case Files&quot;...
                </span>
              )}
            </p>
          </div>
        )}

        {/* Command Feedback */}
        {lastFeedback && !pendingConfirmation && (
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{lastFeedback}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">{error}</span>
            </div>
          </div>
        )}

        {/* Privacy Footnote */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400/70" />
            <span>Processed in-memory • Zero audio storage</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <HelpCircle className="w-3 h-3" />
            <span>Say &quot;Stop Listening&quot; to exit</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

