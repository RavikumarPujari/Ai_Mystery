import React, { useState, useEffect } from "react";
import {
  Film,
  ShieldAlert,
  Clock,
  Camera,
  Terminal,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Maximize2,
  X,
} from "lucide-react";
import { CctvEvidenceContent } from "../../types/mystery";
import { Badge } from "../common/Badge";
import { resolveMediaUrl } from "../../services/api";

interface CctvViewerProps {
  content: CctvEvidenceContent;
}

export function CctvViewer({ content }: CctvViewerProps): React.ReactElement {
  const frames = content.frames || [];
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const activeFrame = frames[activeFrameIndex];

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [activeFrameIndex, retryKey]);

  const handleRetry = () => {
    setImageError(false);
    setImageLoading(true);
    setRetryKey((k) => k + 1);
  };

  const isSvgFallback = activeFrame?.imageUrl?.endsWith(".svg");

  return (
    <div className="space-y-4">
      {/* Fictional Disclaimer */}
      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-violet-400" />
          <span className="font-mono uppercase tracking-wider font-bold text-[11px]">
            SIMULATED SURVEILLANCE • FICTIONAL CASE EVIDENCE
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Tag: {content.cameraTag || "CCTV"}
        </span>
      </div>

      {/* Camera Header Banner */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-white font-bold font-mono">{content.cameraTag}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">{content.location}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <Clock className="w-3 h-3 text-violet-400" />
          <span>Window: {content.timeRange || "Incident Duration"}</span>
        </div>
      </div>

      {/* Main Surveillance Monitor Visual */}
      {activeFrame ? (
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          {/* CRT Monitor Top Bar */}
          <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between font-mono text-[11px] text-emerald-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>REC • {activeFrame.cameraTag || content.cameraTag}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300">
                {isSvgFallback ? "FORENSIC VECTOR DIAGRAM" : "SURVEILLANCE OPTICAL STILL"}
              </span>
              <span className="text-violet-300 font-bold">TIMECODE: {activeFrame.timestamp}</span>
            </div>
          </div>

          {/* Frame Display */}
          <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center min-h-[260px] bg-gradient-to-b from-slate-950 to-slate-900">
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {activeFrame.imageUrl ? (
              <div className="flex flex-col items-center justify-center max-w-lg z-10 space-y-3 w-full">
                {/* Loading skeleton */}
                {imageLoading && !imageError && (
                  <div className="w-full h-52 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-xs text-slate-400 font-mono animate-pulse">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin mb-2" />
                    <span>Loading surveillance frame...</span>
                  </div>
                )}

                {/* Error fallback */}
                {imageError && (
                  <div className="w-full p-6 rounded-xl bg-slate-900/90 border border-rose-500/30 text-center space-y-2.5">
                    <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                    <p className="text-xs text-slate-300">Surveillance frame preview temporarily unavailable.</p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Image
                    </button>
                  </div>
                )}

                {/* Rendered Image */}
                {!imageError && (
                  <div className="relative group/frame">
                    <img
                      key={`${activeFrame.imageUrl}_${retryKey}`}
                      src={resolveMediaUrl(activeFrame.imageUrl)}
                      alt={activeFrame.description}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                      className={`max-h-[280px] w-auto object-contain rounded-lg shadow-lg border border-slate-800 cursor-zoom-in transition-opacity duration-200 ${
                        imageLoading ? "hidden" : "block"
                      }`}
                      onClick={() => setIsZoomOpen(true)}
                    />
                    {!imageLoading && (
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 opacity-0 group-hover/frame:opacity-100 transition-opacity cursor-pointer text-[10px] flex items-center gap-1"
                        aria-label="Expand surveillance frame"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Expand</span>
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-300 font-medium text-center italic max-w-md">
                  &ldquo;{activeFrame.description}&rdquo;
                </p>
              </div>
            ) : (
              <div className="text-center max-w-lg z-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-500/30 mx-auto flex items-center justify-center text-violet-400 shadow-inner">
                  <Film className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <Badge variant="outline" size="sm">
                    FRAME #{activeFrameIndex + 1}
                  </Badge>
                  <p className="text-sm font-semibold text-slate-200 leading-relaxed pt-1">
                    &ldquo;{activeFrame.description}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Observed Entities Tag */}
            {activeFrame.observedEntities && activeFrame.observedEntities.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2 z-10">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Identified in frame:
                </span>
                {activeFrame.observedEntities.map((ent: string, idx: number) => (
                  <Badge key={idx} variant="accent" size="sm">
                    {ent}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Frame Stepper */}
          {frames.length > 1 && (
            <div className="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                disabled={activeFrameIndex === 0}
                onClick={() => setActiveFrameIndex((p) => Math.max(0, p - 1))}
                aria-label="Previous CCTV surveillance frame"
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 cursor-pointer transition-colors"
              >
                &larr; Prev Frame
              </button>
              <span className="text-slate-400 font-medium">
                Frame {activeFrameIndex + 1} of {frames.length}
              </span>
              <button
                type="button"
                disabled={activeFrameIndex === frames.length - 1}
                onClick={() => setActiveFrameIndex((p) => Math.min(frames.length - 1, p + 1))}
                aria-label="Next CCTV surveillance frame"
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Next Frame &rarr;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
          <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-violet-400" />
          <span>No visual still frames available. Review surveillance text log below.</span>
        </div>
      )}

      {/* Raw Surveillance Telemetry Terminal Log */}
      {content.surveillanceLog && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px] text-emerald-400 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pb-1.5 border-b border-slate-800">
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
            <span>OPTICAL SENSOR EVENT LOG</span>
          </div>
          <pre className="whitespace-pre-wrap font-mono pt-1 text-slate-300">{content.surveillanceLog}</pre>
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {isZoomOpen && activeFrame?.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl w-full bg-slate-900 border border-violet-500/40 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="font-mono text-xs text-violet-300 font-bold">
                {content.cameraTag} • TIMECODE: {activeFrame.timestamp}
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close zoom preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center p-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden max-h-[75vh]">
              <img
                src={resolveMediaUrl(activeFrame.imageUrl)}
                alt={activeFrame.description}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-xs text-slate-300 font-medium text-center">
              {activeFrame.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
