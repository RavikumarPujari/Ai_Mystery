import React, { useState } from "react";
import { User, ShieldCheck, Quote, ArrowRight, X, Maximize2, Fingerprint, AlertCircle } from "lucide-react";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { resolveMediaUrl } from "../../services/api";

export interface SuspectItem {
  id: string;
  name: string;
  role: string;
  relationship: string;
  initialStatement: string;
  knownMotive?: string;
  alibiInfo?: string;
  avatarUrl?: string;
  relevantEvidenceIds?: string[];
}

interface SuspectsPanelProps {
  suspects: SuspectItem[];
  onSelectForAccusation: (suspectId: string) => void;
}

export function SuspectsPanel({
  suspects,
  onSelectForAccusation,
}: SuspectsPanelProps): React.ReactElement {
  const [zoomedSuspect, setZoomedSuspect] = useState<SuspectItem | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            <span>Persons of Interest ({suspects.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-reference suspect claims against physical clues and surveillance timestamps in the Evidence Locker.
          </p>
        </div>
        <span className="text-xs font-mono text-violet-300 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
          One suspect is the sole perpetrator
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {suspects.map((suspect, idx) => (
          <Card
            key={suspect.id}
            variant="panel"
            className="flex flex-col justify-between border-slate-800 hover:border-violet-500/40 transition-all p-5"
          >
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div
                    onClick={() => suspect.avatarUrl && setZoomedSuspect(suspect)}
                    title={suspect.avatarUrl ? "Click to view full portrait" : undefined}
                    className={`w-14 h-14 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold font-mono text-base shadow-sm overflow-hidden shrink-0 group/avatar relative ${
                      suspect.avatarUrl ? "cursor-zoom-in hover:border-violet-400" : ""
                    }`}
                  >
                    {suspect.avatarUrl ? (
                      <>
                        <img
                          src={resolveMediaUrl(suspect.avatarUrl)}
                          alt={suspect.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover/avatar:scale-110"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <span>{suspect.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">{suspect.name}</h3>
                      <Badge variant="outline" size="sm">
                        #{idx + 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-violet-400 font-semibold">{suspect.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {suspect.id}
                </span>
              </div>

              {/* Relationship / Connection */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Connection to Incident
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{suspect.relationship}</p>
              </div>

              {/* Stated Alibi */}
              {suspect.alibiInfo && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Stated Alibi</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    &ldquo;{suspect.alibiInfo}&rdquo;
                  </p>
                </div>
              )}

              {/* Known Motive */}
              {suspect.knownMotive && (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Suspicious Motive</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {suspect.knownMotive}
                  </p>
                </div>
              )}

              {/* Initial Statement */}
              <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 relative">
                <Quote className="w-3.5 h-3.5 text-violet-400/50 absolute top-2.5 right-2.5" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-semibold block mb-1">
                  Official Statement
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  &ldquo;{suspect.initialStatement}&rdquo;
                </p>
              </div>
            </div>

            {/* Accuse Action */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
                <span>Eligible for deduction</span>
              </span>
              <Button
                size="sm"
                variant="accent"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onSelectForAccusation(suspect.id)}
                aria-label={`Accuse ${suspect.name}`}
              >
                Accuse Suspect
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Suspect Dossier Portrait Modal */}
      {zoomedSuspect && zoomedSuspect.avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-lg w-full bg-slate-900 border border-violet-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{zoomedSuspect.name}</h3>
                <p className="text-xs text-violet-400 font-mono">{zoomedSuspect.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomedSuspect(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close portrait view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <img
                src={resolveMediaUrl(zoomedSuspect.avatarUrl)}
                alt={zoomedSuspect.name}
                className="max-h-[60vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="text-xs text-slate-300 font-mono text-center">
              Official Suspect Dossier Photo • ID: {zoomedSuspect.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
