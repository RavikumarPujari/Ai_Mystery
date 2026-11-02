import React, { useState } from "react";
import {
  Users,
  FolderOpen,
  Clock,
  MapPin,
  AlertOctagon,
  Calendar,
} from "lucide-react";
import { Tabs } from "../../components/common/Tabs";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { SuspectsPanel } from "./SuspectsPanel";
import { EvidenceLocker } from "./EvidenceLocker";
import { TimelineView } from "./TimelineView";
import { AccusationModal } from "./AccusationModal";

export interface InvestigationCaseData {
  id: string;
  caseNumber: string;
  title: string;
  summary: string;
  location: string;
  incidentTime: string;
  difficulty: "easy" | "medium" | "hard";
  genre: string;
  status: string;
  suspects: any[];
  evidence: any[];
  timeline: any[];
}

interface InvestigationDashboardProps {
  caseData: InvestigationCaseData;
  investigationId: string;
  reviewedEvidenceIds: string[];
  onMarkReviewed: (evidenceId: string) => void;
  onSubmitAccusation: (suspectId: string, reasoning?: string) => Promise<void>;
}

export function InvestigationDashboard({
  caseData,
  reviewedEvidenceIds,
  onMarkReviewed,
  onSubmitAccusation,
}: InvestigationDashboardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState("evidence");
  const [isAccusationOpen, setIsAccusationOpen] = useState(false);
  const [targetSuspectId, setTargetSuspectId] = useState<string | undefined>();

  // Map suspect IDs to names for timeline visualization
  const suspectsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    caseData.suspects.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [caseData.suspects]);

  const handleSelectSuspectForAccusation = (suspectId: string) => {
    setTargetSuspectId(suspectId);
    setIsAccusationOpen(true);
  };

  // Safe Voice Command event listeners
  React.useEffect(() => {
    const handleVoiceOpenAccuse = () => {
      setIsAccusationOpen(true);
    };
    const handleVoiceCloseModal = () => {
      setIsAccusationOpen(false);
    };
    const handleVoiceSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && ["evidence", "suspects", "timeline"].includes(customEvent.detail)) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener("ai-mystery:open-accuse", handleVoiceOpenAccuse);
    window.addEventListener("ai-mystery:close-modal", handleVoiceCloseModal);
    window.addEventListener("ai-mystery:switch-tab", handleVoiceSwitchTab);

    return () => {
      window.removeEventListener("ai-mystery:open-accuse", handleVoiceOpenAccuse);
      window.removeEventListener("ai-mystery:close-modal", handleVoiceCloseModal);
      window.removeEventListener("ai-mystery:switch-tab", handleVoiceSwitchTab);
    };
  }, []);

  const tabs = [
    {
      id: "evidence",
      label: "Evidence Locker",
      count: caseData.evidence.length,
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: "suspects",
      label: "Suspect Dossiers",
      count: caseData.suspects.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "timeline",
      label: "Investigation Timeline",
      count: caseData.timeline.length,
      icon: <Clock className="w-4 h-4" />,
    },
  ];

  const reviewedCount = reviewedEvidenceIds.length;
  const totalEvidence = caseData.evidence.length;
  const progressPercent = totalEvidence > 0 ? Math.round((reviewedCount / totalEvidence) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Case Overview */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-violet-500/20 backdrop-blur-md shadow-2xl shadow-slate-950/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-violet-400 font-bold uppercase tracking-wider bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-500/30">
                {caseData.caseNumber}
              </span>
              <span>•</span>
              <Badge variant={caseData.difficulty}>{caseData.difficulty} Case</Badge>
              <span>•</span>
              <Badge variant="outline">{caseData.genre}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {caseData.title}
            </h1>

            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-violet-400" />
                <span>{caseData.location}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>{caseData.incidentTime}</span>
              </span>
            </div>
          </div>

          {/* Action Hub & Deduction Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0">
            {/* Evidence Progress Bar */}
            <div className="w-full sm:w-52 lg:w-60 space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Examined:</span>
                <span className="text-violet-300 font-mono font-bold">
                  {reviewedCount}/{totalEvidence} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-300 shadow-sm shadow-violet-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <Button
              size="md"
              variant="danger"
              leftIcon={<AlertOctagon className="w-4 h-4" />}
              onClick={() => {
                setTargetSuspectId(undefined);
                setIsAccusationOpen(true);
              }}
              className="w-full sm:w-auto font-bold shadow-lg shadow-rose-950/40 hover:shadow-rose-900/60"
            >
              Submit Final Accusation
            </Button>
          </div>
        </div>

        {/* Incident Summary */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <strong className="text-violet-300 font-mono uppercase text-xs tracking-wider block mb-1">
            Incident Briefing
          </strong>
          {caseData.summary}
        </div>
      </div>

      {/* Detective Workspace Tabs */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-5 pt-2" />

        <div
          className="p-5 sm:p-7"
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "evidence" && (
            <EvidenceLocker
              evidence={caseData.evidence}
              reviewedEvidenceIds={reviewedEvidenceIds}
              onMarkReviewed={onMarkReviewed}
            />
          )}

          {activeTab === "suspects" && (
            <SuspectsPanel
              suspects={caseData.suspects}
              onSelectForAccusation={handleSelectSuspectForAccusation}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineView timeline={caseData.timeline} suspectsMap={suspectsMap} />
          )}
        </div>
      </div>

      {/* Accusation Modal */}
      <AccusationModal
        isOpen={isAccusationOpen}
        onClose={() => setIsAccusationOpen(false)}
        suspects={caseData.suspects}
        preselectedSuspectId={targetSuspectId}
        onSubmitAccusation={onSubmitAccusation}
      />
    </div>
  );
}
