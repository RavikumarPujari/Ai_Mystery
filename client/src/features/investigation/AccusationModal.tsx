import React, { useState } from "react";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Textarea } from "../../components/common/Textarea";
import { Badge } from "../../components/common/Badge";
import { SuspectItem } from "./SuspectsPanel";

interface AccusationModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspects: SuspectItem[];
  preselectedSuspectId?: string;
  onSubmitAccusation: (suspectId: string, reasoning?: string) => Promise<void>;
}

export function AccusationModal({
  isOpen,
  onClose,
  suspects,
  preselectedSuspectId,
  onSubmitAccusation,
}: AccusationModalProps): React.ReactElement {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>(
    preselectedSuspectId || (suspects[0]?.id ?? "")
  );
  const [reasoning, setReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedSuspectId) {
      setSelectedSuspectId(preselectedSuspectId);
    }
  }, [preselectedSuspectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspectId) {
      setError("Please designate a prime suspect.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmitAccusation(selectedSuspectId, reasoning.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit accusation. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Official Case Accusation" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-xs text-rose-300">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold tracking-wide uppercase font-mono text-rose-200">
              Irreversible Accusation Notice
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Filing your deduction triggers permanent verification against the confidential crime record. The true perpetrator, secret motive, and complete sequence of events will be unsealed.
            </p>
          </div>
        </div>

        {/* Suspect Radio Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            1. Select Prime Suspect ({suspects.length} Eligible)
          </label>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1"
            role="radiogroup"
            aria-label="Prime Suspect Selection"
          >
            {suspects.map((suspect) => {
              const isSelected = selectedSuspectId === suspect.id;

              return (
                <button
                  key={suspect.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Accuse ${suspect.name}, ${suspect.role}`}
                  onClick={() => setSelectedSuspectId(suspect.id)}
                  className={`p-3.5 rounded-xl text-left transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/50 shadow-md shadow-violet-950"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {suspect.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className={`text-xs font-bold truncate ${isSelected ? "text-violet-200" : "text-white"}`}>
                        {suspect.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{suspect.role}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <Badge variant="accent" size="sm" className="shrink-0">
                      Target
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reasoning Textarea */}
        <div className="space-y-2">
          <label
            htmlFor="accusation-reasoning"
            className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono"
          >
            2. Detective&apos;s Deductive Reasoning (Optional)
          </label>
          <Textarea
            id="accusation-reasoning"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Explain which contradictions or timestamp discrepancies exposed this suspect..."
            rows={3}
            maxChars={1000}
            showCharCount
            aria-label="Detective Deductive Reasoning"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={submitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="font-bold shadow-lg shadow-rose-950/40 hover:shadow-rose-900/60"
          >
            Confirm &amp; Reveal Truth
          </Button>
        </div>
      </form>
    </Modal>
  );
}
