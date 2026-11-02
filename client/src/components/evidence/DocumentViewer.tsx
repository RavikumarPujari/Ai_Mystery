import React, { useState, useEffect } from "react";
import {
  FileText,
  Binary,
  ShieldAlert,
  User,
  Clock,
  Camera,
  Loader2,
  RefreshCw,
  Maximize2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { resolveMediaUrl } from "../../services/api";

interface DocumentViewerProps {
  type: string;
  title: string;
  source: string;
  occurredAt?: string;
  content: any;
}

export function DocumentViewer({
  type,
  title,
  source,
  occurredAt,
  content,
}: DocumentViewerProps): React.ReactElement {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [content?.imageUrl, retryKey]);

  const handleRetry = () => {
    setImageError(false);
    setImageLoading(true);
    setRetryKey((k) => k + 1);
  };

  const isSvgFallback = content?.imageUrl?.endsWith(".svg");
  return (
    <div className="space-y-4">
      {/* Fictional Disclaimer */}
      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-violet-400" />
          <span className="font-mono uppercase tracking-wider font-bold text-[11px]">
            SIMULATED RECORD • FICTIONAL CASE EVIDENCE
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Format: {type.toUpperCase()}
        </span>
      </div>

      {/* Metadata Banner */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-white font-bold">{title}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono">{source}</span>
        </div>
        {occurredAt && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-violet-400" />
            <span>{occurredAt}</span>
          </div>
        )}
      </div>

      {/* Specific Content Type Presentations */}
      {type === "witness_statement" && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-white">
              <User className="w-3.5 h-3.5 text-violet-400" />
              <span>Witness: <strong className="text-violet-200">{content.witnessName || "Unknown"}</strong> ({content.witnessRole || "Subject"})</span>
            </div>
            <div className="text-slate-400">
              Interrogator: {content.interrogator || "Lead Detective"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-line">
            {content.transcript || "No transcript recorded."}
          </div>
        </div>
      )}

      {type === "digital_record" && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Binary className="w-3.5 h-3.5" />
              <span>SYSTEM: {content.systemName || "ACCESS_GATEWAY_V2"}</span>
            </div>
            <span className="text-violet-400">LOG FORMAT: TELEMETRY_STREAM</span>
          </div>

          {content.entries && content.entries.length > 0 ? (
            <div className="space-y-2">
              {content.entries.map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{entry.timestamp}</span>
                    <span className="text-slate-600">•</span>
                    <Badge variant={entry.action === "ENTRY" ? "success" : "accent"} size="sm">
                      {entry.action}
                    </Badge>
                    <span className="text-white font-bold">{entry.actor}</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px]">
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              No digital records captured in this dump.
            </div>
          )}
        </div>
      )}

      {type === "document" && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">
              {content.documentTitle || title}
            </h3>
            <p className="text-xs text-slate-400">
              Issued by {content.issuedBy || "Confidential Authority"} • {content.date || occurredAt}
            </p>
          </div>

          {content.summary && (
            <p className="text-xs text-violet-300 font-medium leading-relaxed bg-violet-950/40 p-3 rounded-lg border border-violet-500/30">
              {content.summary}
            </p>
          )}

          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            {content.bodyText || content.transcript || "Document contents not available."}
          </div>
        </div>
      )}

      {type === "image" && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 sm:p-5 text-center space-y-3">
          {/* Top Format Banner */}
          <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800 pb-2">
            <span className="text-violet-400 font-bold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>FORENSIC VISUAL RECORD</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
              {isSvgFallback ? "FORENSIC VECTOR DIAGRAM" : "HIGH-RESOLUTION PHOTOGRAPH"}
            </span>
          </div>

          {content.imageUrl ? (
            <div className="relative group/photo py-2">
              {/* Loading Skeleton */}
              {imageLoading && !imageError && (
                <div className="w-full h-64 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-xs text-slate-400 font-mono animate-pulse">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin mb-2" />
                  <span>Loading forensic evidence photo...</span>
                </div>
              )}

              {/* Error fallback */}
              {imageError && (
                <div className="w-full p-8 rounded-xl bg-slate-900/90 border border-rose-500/30 text-center space-y-2.5">
                  <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="text-xs text-slate-300">Evidence image preview temporarily unavailable.</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Image
                  </button>
                </div>
              )}

              {/* Rendered Photograph */}
              {!imageError && (
                <div className="relative inline-block">
                  <img
                    key={`${content.imageUrl}_${retryKey}`}
                    src={resolveMediaUrl(content.imageUrl)}
                    alt={content.caption || title}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                    className={`max-h-[380px] w-auto mx-auto rounded-lg shadow-xl border border-slate-800 cursor-zoom-in transition-opacity duration-200 ${
                      imageLoading ? "hidden" : "block"
                    }`}
                    onClick={() => setIsZoomOpen(true)}
                  />
                  {!imageLoading && (
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer text-[10px] flex items-center gap-1"
                      aria-label="Expand forensic photo"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-slate-500 text-xs">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
              <span>Photograph archive preview: {content.caption || title}</span>
            </div>
          )}

          {content.caption && (
            <p className="text-xs font-mono text-slate-300 italic max-w-lg mx-auto">
              &ldquo;{content.caption}&rdquo;
            </p>
          )}

          {content.location && (
            <div className="text-[11px] text-slate-400 font-mono">
              Captured at: <strong className="text-slate-200">{content.location}</strong>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {isZoomOpen && content?.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl w-full bg-slate-900 border border-violet-500/40 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="font-mono text-xs text-violet-300 font-bold">
                {title} • {content.location || "FORENSIC CAPTURE"}
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
                src={resolveMediaUrl(content.imageUrl)}
                alt={content.caption || title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            {content.caption && (
              <p className="text-xs text-slate-300 font-medium text-center italic">
                &ldquo;{content.caption}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      <div className="text-[11px] font-mono text-slate-500 text-right px-1">
        Fictional case evidence. Correlate with witness interrogation statements.
      </div>
    </div>
  );
}
