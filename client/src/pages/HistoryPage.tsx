import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderClock,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { FictionalBadge } from "../components/common/FictionalBadge";
import { apiRequest, getGuestSessionId } from "../services/api";

interface HistoryItem {
  investigationId: string;
  mysteryId: string;
  caseTitle: string;
  caseNumber: string;
  genre: string;
  difficulty: "easy" | "medium" | "hard";
  status: "in_progress" | "completed" | "abandoned";
  isCorrect?: boolean;
  reviewedEvidenceCount: number;
  totalEvidenceCount: number;
  createdAt: string;
  completedAt?: string;
}

export function HistoryPage(): React.ReactElement {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const guestBadge = getGuestSessionId().substring(0, 10);

  useEffect(() => {
    apiRequest<HistoryItem[]>("/api/v1/investigations")
      .then((data) => {
        setHistory(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load case history.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <div className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Retrieving Classified Investigation Archives...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-violet-400 uppercase tracking-wider mb-1 font-bold">
            <FolderClock className="w-4 h-4" />
            <span>Investigation Archives</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Your Case Files</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and resume ongoing detective investigations linked to your current detective session badge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <span>Badge: <strong className="text-white">{guestBadge}</strong></span>
          </div>
          <Link to="/create">
            <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              New Mystery
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Case List or Empty State */}
      {history.length === 0 ? (
        <Card variant="panel" className="p-12 text-center max-w-lg mx-auto space-y-4 border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-500/30 mx-auto flex items-center justify-center text-violet-400">
            <FileSearch className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">No Case Files on Record</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You haven&apos;t started any investigations with this session badge yet. Generate your first AI crime scenario to begin deduction.
            </p>
          </div>
          <Link to="/create" className="inline-block pt-2">
            <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
              Synthesize Your First Mystery
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {history.map((item) => {
            const isCompleted = item.status === "completed";
            const isSolved = isCompleted && item.isCorrect === true;

            return (
              <Card
                key={item.investigationId}
                variant="interactive"
                className="flex flex-col justify-between border-slate-800 hover:border-violet-500/40 transition-all p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-violet-400 uppercase font-bold">
                          {item.caseNumber}
                        </span>
                        <span>•</span>
                        <Badge variant={item.difficulty} size="sm">
                          {item.difficulty}
                        </Badge>
                      </div>
                      <h3 className="text-base font-extrabold text-white leading-snug">
                        {item.caseTitle}
                      </h3>
                    </div>

                    {isCompleted ? (
                      isSolved ? (
                        <Badge variant="success" size="sm" className="shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Solved</span>
                        </Badge>
                      ) : (
                        <Badge variant="alert" size="sm" className="shrink-0 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Unsolved</span>
                        </Badge>
                      )
                    ) : (
                      <Badge variant="accent" size="sm" className="shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>In Progress</span>
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                      <span>Genre: <strong className="text-slate-200">{item.genre.toUpperCase()}</strong></span>
                      <span>
                        Evidence: <strong className="text-violet-300">{item.reviewedEvidenceCount}/{item.totalEvidenceCount}</strong>
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500">
                      Opened: {new Date(item.createdAt).toLocaleDateString()} at{" "}
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {item.investigationId.substring(0, 10)}...
                  </span>

                  {isCompleted ? (
                    <Link to={`/case/${item.mysteryId}/results`}>
                      <Button size="sm" variant="accent" rightIcon={<ArrowRight className="w-3 h-3" />}>
                        View Solution
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/case/${item.mysteryId}`}>
                      <Button size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                        Resume Case
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <FictionalBadge label="CASE ARCHIVES PROTECTED BY SESSION INTEGRITY" size="sm" />
        <span className="text-xs font-mono text-slate-500">
          AI Mystery Room &copy; 2026
        </span>
      </div>
    </div>
  );
}
