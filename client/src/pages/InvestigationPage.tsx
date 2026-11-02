import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { apiRequest } from "../services/api";
import { InvestigationDashboard, InvestigationCaseData } from "../features/investigation/InvestigationDashboard";
import { Button } from "../components/common/Button";

interface InvestigationSessionData {
  investigationId: string;
  mysteryId: string;
  status: string;
  reviewedEvidenceIds: string[];
}

export function InvestigationPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<InvestigationCaseData | null>(null);
  const [investigationSession, setInvestigationSession] = useState<InvestigationSessionData | null>(null);
  const [reviewedEvidenceIds, setReviewedEvidenceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);

    // 1. Fetch public mystery dossier
    apiRequest<InvestigationCaseData>(`/api/v1/mysteries/${id}`)
      .then((data) => {
        if (!isMounted) return;
        setCaseData(data);

        // 2. Start / resume player investigation session
        return apiRequest<InvestigationSessionData>(`/api/v1/investigations/start/${id}`, {
          method: "POST",
        });
      })
      .then((session) => {
        if (!isMounted || !session) return;
        setInvestigationSession(session);
        setReviewedEvidenceIds(session.reviewedEvidenceIds || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load case file.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Mark an evidence item as reviewed and sync with backend
  const handleMarkReviewed = async (evidenceId: string) => {
    if (reviewedEvidenceIds.includes(evidenceId)) return;

    const nextReviewed = [...reviewedEvidenceIds, evidenceId];
    setReviewedEvidenceIds(nextReviewed);

    if (investigationSession?.investigationId) {
      try {
        await apiRequest(`/api/v1/investigations/${investigationSession.investigationId}/progress`, {
          method: "PATCH",
          body: JSON.stringify({
            reviewedEvidenceIds: nextReviewed,
          }),
        });
      } catch (err) {
        console.warn("Failed to persist evidence progress:", err);
      }
    }
  };

  // Submit final accusation
  const handleSubmitAccusation = async (suspectId: string, reasoning?: string) => {
    if (!investigationSession?.investigationId) {
      throw new Error("No active investigation session.");
    }

    const result = await apiRequest(`/api/v1/investigations/${investigationSession.investigationId}/accusation`, {
      method: "POST",
      body: JSON.stringify({
        suspectId,
        reasoning,
      }),
    });

    // Store evaluated result in session/history and navigate to results view
    sessionStorage.setItem(`mystery_result_${id}`, JSON.stringify(result));
    navigate(`/case/${id}/results`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <div className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Decrypting Case Dossier &amp; Evidence Records...
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 flex items-center justify-center gap-2 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error || "Case record could not be found."}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate("/")} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Bureau
        </Button>
      </div>
    );
  }

  return (
    <InvestigationDashboard
      caseData={caseData}
      investigationId={investigationSession?.investigationId || ""}
      reviewedEvidenceIds={reviewedEvidenceIds}
      onMarkReviewed={handleMarkReviewed}
      onSubmitAccusation={handleSubmitAccusation}
    />
  );
}
