import React, { useState } from "react";
import {
  FolderOpen,
  MessageSquare,
  Film,
  FileText,
  Binary,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ChatViewer } from "../../components/evidence/ChatViewer";
import { CctvViewer } from "../../components/evidence/CctvViewer";
import { DocumentViewer } from "../../components/evidence/DocumentViewer";

export interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  description: string;
  source: string;
  occurredAt?: string;
  relatedSuspectIds?: string[];
  content: any;
}

interface EvidenceLockerProps {
  evidence: EvidenceItem[];
  reviewedEvidenceIds: string[];
  onMarkReviewed: (evidenceId: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "image", label: "Crime Scene & Clues", icon: Camera },
  { id: "cctv", label: "CCTV Stills", icon: Film },
  { id: "chat", label: "Chat Transcripts", icon: MessageSquare },
  { id: "witness_statement", label: "Statements", icon: FileText },
  { id: "digital_record", label: "Telemetry Logs", icon: Binary },
];

export function EvidenceLocker({
  evidence,
  reviewedEvidenceIds,
  onMarkReviewed,
}: EvidenceLockerProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null);

  const filteredEvidence = evidence.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.type === selectedCategory;
  });

  const handleOpenEvidence = (item: EvidenceItem) => {
    setActiveEvidence(item);
    if (!reviewedEvidenceIds.includes(item.id)) {
      onMarkReviewed(item.id);
    }
  };

  // Safe Voice Command event listeners for Evidence Locker
  React.useEffect(() => {
    const handleFilter = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedCategory(customEvent.detail);
      }
    };
    const handleOpenNext = () => {
      if (filteredEvidence.length > 0) {
        handleOpenEvidence(filteredEvidence[0]);
      }
    };
    const handleClose = () => {
      setActiveEvidence(null);
    };
    const handleReadClue = () => {
      const target = activeEvidence || filteredEvidence[0];
      if (target && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const textToRead = `${target.title}. ${target.description}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        window.speechSynthesis.speak(utterance);
      }
    };

    window.addEventListener("ai-mystery:filter-evidence", handleFilter);
    window.addEventListener("ai-mystery:open-evidence", handleOpenNext);
    window.addEventListener("ai-mystery:close-evidence", handleClose);
    window.addEventListener("ai-mystery:close-modal", handleClose);
    window.addEventListener("ai-mystery:read-clue", handleReadClue);

    return () => {
      window.removeEventListener("ai-mystery:filter-evidence", handleFilter);
      window.removeEventListener("ai-mystery:open-evidence", handleOpenNext);
      window.removeEventListener("ai-mystery:close-evidence", handleClose);
      window.removeEventListener("ai-mystery:close-modal", handleClose);
      window.removeEventListener("ai-mystery:read-clue", handleReadClue);
    };
  }, [filteredEvidence, activeEvidence]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="w-4 h-4 text-violet-400" />;
      case "cctv":
        return <Film className="w-4 h-4 text-violet-400" />;
      case "witness_statement":
        return <FileText className="w-4 h-4 text-violet-400" />;
      case "digital_record":
        return <Binary className="w-4 h-4 text-violet-400" />;
      case "image":
        return <Camera className="w-4 h-4 text-violet-400" />;
      default:
        return <FolderOpen className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Category Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-violet-400" />
            <span>Evidence Locker ({reviewedEvidenceIds.length}/{evidence.length} Examined)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-examine simulated transcripts, surveillance storyboards, and telemetry logs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Evidence category filter tabs">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvidence.map((item) => {
          const isReviewed = reviewedEvidenceIds.includes(item.id);

          // Resolve visual thumbnail if available for CCTV or photographic evidence
          const visualUrl =
            item.type === "image"
              ? item.content?.imageUrl
              : item.type === "cctv"
              ? item.content?.frames?.[0]?.imageUrl
              : null;

          return (
            <Card
              key={item.id}
              variant="interactive"
              onClick={() => handleOpenEvidence(item)}
              className="flex flex-col justify-between border-slate-800 hover:border-violet-500/50 transition-all p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-950/80 border border-violet-500/30 shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug group-hover:text-violet-300 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                        <span>Source: {item.source}</span>
                        {(item.type === "cctv" || item.type === "image") && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Camera className="w-3 h-3" /> Visual Capture
                            </span>
                          </>
                        )}
                        {item.occurredAt && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-violet-300">
                              <Clock className="w-3 h-3" />
                              {item.occurredAt}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isReviewed ? (
                    <Badge variant="success" size="sm" className="shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Reviewed</span>
                    </Badge>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-950/80 border border-violet-500/40 px-2 py-0.5 rounded-full shrink-0">
                      Unexamined
                    </span>
                  )}
                </div>

                {/* Evidence Thumbnail Image Container */}
                {visualUrl && (
                  <div className="relative my-3 w-full h-40 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden group/thumb">
                    <img
                      src={visualUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-70 pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-900/90 text-violet-300 border border-violet-500/30 flex items-center gap-1 backdrop-blur-sm">
                        <Camera className="w-3 h-3 text-violet-400" />
                        {item.type === "cctv" ? "CCTV Frame #1" : "Forensic Still"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-sm flex items-center gap-1 font-semibold">
                        <Eye className="w-3 h-3" /> Inspect Visual
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">ID: {item.id}</span>
                <span className="text-violet-400 font-bold flex items-center gap-1 hover:text-violet-300 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Clue</span>
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dedicated Evidence Viewer Modal */}
      {activeEvidence && (
        <Modal
          isOpen={!!activeEvidence}
          onClose={() => setActiveEvidence(null)}
          title={activeEvidence.title}
          maxWidth="2xl"
        >
          {activeEvidence.type === "chat" ? (
            <ChatViewer content={activeEvidence.content} />
          ) : activeEvidence.type === "cctv" ? (
            <CctvViewer content={activeEvidence.content} />
          ) : (
            <DocumentViewer
              type={activeEvidence.type}
              title={activeEvidence.title}
              source={activeEvidence.source}
              occurredAt={activeEvidence.occurredAt}
              content={activeEvidence.content}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
