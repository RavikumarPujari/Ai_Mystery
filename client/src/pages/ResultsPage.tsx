import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  FolderOpen,
  PlusCircle,
  FolderClock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Card, CardHeader, CardContent } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { FictionalBadge } from "../components/common/FictionalBadge";
import { apiRequest } from "../services/api";

interface AuthoritativeTimelineEvent {
  id: string;
  time: string;
  trueEvent: string;
  actors: string[];
  isContradictedByLies: boolean;
  correspondingEvidenceIds: string[];
}

export interface InvestigationResultData {
  investigationId: string;
  mysteryId: string;
  status: string;
  isCorrect: boolean;
  submittedSuspectId: string;
  actualCulpritId: string;
  actualCulpritName: string;
  motive: string;
  explanation: string;
  decisiveEvidenceIds: string[];
  redHerringExplanations: string[];
  authoritativeTimeline: AuthoritativeTimelineEvent[];
  completedAt: string;
}

export function ResultsPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<InvestigationResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // 1. Check if result was stored in sessionStorage from accusation submission
    const cached = sessionStorage.getItem(`mystery_result_${id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setResult(parsed);
        setLoading(false);
        return;
      } catch (e) {
        console.warn("Failed to parse cached result:", e);
      }
    }

    // 2. Otherwise fetch from backend session
    apiRequest<{ investigationId: string }>(`/api/v1/investigations/start/${id}`, {
      method: "POST",
    })
      .then((session) => {
        return apiRequest<InvestigationResultData>(
          `/api/v1/investigations/${session.investigationId}/result`
        );
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load investigation result.");
        setLoading(false);
      });
  }, [id]);

  // Voice command listener for reading solution on Results page
  useEffect(() => {
    const handleReadSolution = () => {
      if (result && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const text = `The culprit is ${result.actualCulpritName}. Motive: ${result.motive}. Solution: ${result.explanation}`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    };

    window.addEventListener("ai-mystery:read-solution", handleReadSolution);
    return () => {
      window.removeEventListener("ai-mystery:read-solution", handleReadSolution);
    };
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <div className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Evaluating Accusation &amp; Unsealing Confidential Solution...
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 flex items-center justify-center gap-2 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error || "Solution is unavailable. Please submit an accusation first."}</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/case/${id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Investigation
          </Button>
          <Button onClick={() => navigate("/create")} leftIcon={<PlusCircle className="w-4 h-4" />}>
            New Mystery
          </Button>
        </div>
      </div>
    );
  }

  const isVictory = result.isCorrect;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner Notice */}
      <div className="flex items-center justify-between">
        <FictionalBadge label="CASE CONCLUDED • AUTHORITATIVE SOLUTION UNSEALED" size="sm" />
        <span className="font-mono text-xs text-slate-400">
          Resolved: {new Date(result.completedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Verdict Card */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-2xl relative overflow-hidden backdrop-blur-md ${
          isVictory
            ? "bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-emerald-950/30"
            : "bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-rose-950/30"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isVictory ? (
                <div className="p-2.5 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-500/50 shadow-md">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block font-semibold">
                  Official Verdict
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {isVictory ? "Case Solved — Accusation Confirmed!" : "Deduction Disproved — Wrong Suspect"}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl pl-1">
              {isVictory
                ? "Your deduction correctly singled out the perpetrator based on discoverable evidence and timeline contradictions."
                : "Your accusation targeted an innocent person of interest. Review the decisive evidence breakdown below to see what exposed the true perpetrator."}
            </p>
          </div>

          <Badge variant={isVictory ? "success" : "alert"} size="md" className="shrink-0 self-start sm:self-auto text-xs py-1 px-3">
            {isVictory ? "ACCUSATION ACCURATE" : "MISIDENTIFIED"}
          </Badge>
        </div>

        {/* Perpetrator vs Accused Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Your Accused Target
            </span>
            <div className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span>{result.submittedSuspectId}</span>
              {isVictory ? (
                <Badge variant="success" size="sm">Matches Culprit</Badge>
              ) : (
                <Badge variant="alert" size="sm">Innocent</Badge>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-violet-500/40 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 block font-semibold">
              Actual Sole Perpetrator
            </span>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-violet-200">{result.actualCulpritName}</span>
              <span className="text-xs font-mono text-slate-400">({result.actualCulpritId})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authoritative Explanation & Motive */}
      <Card variant="panel" className="p-6 border-slate-800">
        <CardHeader className="p-0 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>How the Crime Was Committed</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Authoritative Case Breakdown</h2>
        </CardHeader>
        <CardContent className="p-0 pt-5 space-y-6">
          {/* Motive */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-violet-500/30 space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-violet-300 font-bold block">
              Perpetrator&apos;s True Motive:
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {result.motive}
            </p>
          </div>

          {/* Full Narrative Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              Sequence of Events &amp; Discoverable Logic:
            </span>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono">
              {result.explanation}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decisive Evidence Clues */}
      <Card variant="panel" className="p-6 border-slate-800">
        <CardHeader className="p-0 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Decisive Proofs</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Evidence That Exposed the Culprit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            These discoverable clues proved the perpetrator was lying and broke their stated alibi.
          </p>
        </CardHeader>
        <CardContent className="p-0 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.decisiveEvidenceIds && result.decisiveEvidenceIds.map((evId, idx) => (
              <div
                key={evId || idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="accent" size="sm">
                    CLUE #{idx + 1}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-white">{evId}</span>
                </div>
                <Link
                  to={`/case/${id}`}
                  className="text-xs text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1 font-mono font-medium"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Inspect Clue</span>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Red Herrings Deconstructed */}
      {result.redHerringExplanations && result.redHerringExplanations.length > 0 && (
        <Card variant="panel" className="p-6 border-slate-800">
          <CardHeader className="p-0 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-rose-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>Misleading Leads</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">Red Herrings Deconstructed</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Why innocent suspects appeared suspicious and what their genuine explanations were.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-5 space-y-3">
            {result.redHerringExplanations.map((exp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3"
              >
                <span className="p-1 rounded bg-slate-900 font-mono text-[10px] text-violet-300 font-bold shrink-0 mt-0.5 border border-slate-800">
                  LEAD #{idx + 1}
                </span>
                <p>{exp}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Authoritative Timeline Comparison */}
      {result.authoritativeTimeline && result.authoritativeTimeline.length > 0 && (
        <Card variant="panel" className="p-6 border-slate-800">
          <CardHeader className="p-0 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              <Clock className="w-4 h-4 text-violet-400" />
              <span>Full Historical Record</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">Authoritative Reconstructed Timeline</h2>
          </CardHeader>
          <CardContent className="p-0 pt-5 space-y-4">
            <div className="relative pl-6 border-l-2 border-violet-500/30 space-y-4 my-2 ml-2">
              {result.authoritativeTimeline.map((ev, idx) => (
                <div key={ev.id || idx} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border border-violet-400" />
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-mono text-xs text-violet-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span>{ev.time}</span>
                      {ev.isContradictedByLies && (
                        <Badge variant="alert" size="sm">
                          Lie Disproved
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-mono">
                      {ev.trueEvent}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Navigation CTA */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to={`/case/${id}`}>
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Revisit Evidence Locker
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/history">
            <Button variant="ghost" leftIcon={<FolderClock className="w-4 h-4 text-slate-400" />}>
              Case Archives
            </Button>
          </Link>
          <Link to="/create">
            <Button
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="px-6 font-bold shadow-lg shadow-violet-900/30 hover:shadow-violet-700/50"
            >
              Play Again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
