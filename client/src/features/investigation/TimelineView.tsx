import React from "react";
import { Clock, ShieldCheck, User, FolderOpen } from "lucide-react";
import { Badge } from "../../components/common/Badge";

export interface TimelineEventItem {
  id: string;
  time: string;
  description: string;
  relatedSuspectIds?: string[];
  relatedEvidenceIds?: string[];
  isVerified: boolean;
}

interface TimelineViewProps {
  timeline: TimelineEventItem[];
  suspectsMap?: Record<string, string>;
}

export function TimelineView({
  timeline,
  suspectsMap = {},
}: TimelineViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            <span>Investigation Timeline ({timeline.length} Events)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict chronological sequence reconstructed from camera timestamps and turnstile telemetry.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/50 flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Incident Record</span>
        </span>
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-violet-500/30 space-y-6 my-4 ml-2">
        {timeline.map((event, idx) => (
          <div key={event.id || idx} className="relative group">
            {/* Timeline Node */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-slate-950 border-2 border-violet-500 flex items-center justify-center shadow-sm shadow-violet-500/50">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 transition-all space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-violet-300 bg-violet-950/60 px-2.5 py-1 rounded-lg border border-violet-500/30">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span>{event.time}</span>
                </div>
                {event.isVerified && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </Badge>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                {event.description}
              </p>

              {/* Linked Suspects & Evidence */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
                {event.relatedSuspectIds && event.relatedSuspectIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-[11px] font-medium">Suspects:</span>
                    <div className="flex flex-wrap gap-1">
                      {event.relatedSuspectIds.map((sId) => (
                        <Badge key={sId} variant="outline" size="sm">
                          {suspectsMap[sId] || sId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {event.relatedEvidenceIds && event.relatedEvidenceIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FolderOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-[11px] font-medium">Evidence:</span>
                    <div className="flex flex-wrap gap-1">
                      {event.relatedEvidenceIds.map((eId) => (
                        <Badge key={eId} variant="accent" size="sm">
                          {eId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
