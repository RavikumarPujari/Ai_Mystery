import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  HelpCircle,
  Users,
  Film,
  Camera,
  MessageSquare,
  FileText,
  Binary,
  Clock,
  ArrowRight,
  Info,
  Trash2,
  BookOpen,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/common/Card";
import { Textarea } from "../components/common/Textarea";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { GenerationProgress } from "../features/mystery-creation/GenerationProgress";
import { apiRequest } from "../services/api";

const GENRES = [
  { id: "theft", label: "Theft & Heist", desc: "Missing artifacts, breached vaults, stolen jewels" },
  { id: "murder", label: "Murder Mystery", desc: "Classic whodunit with conflicting timeline alibis" },
  { id: "disappearance", label: "Disappearance", desc: "Person vanishing under enigmatic circumstances" },
  { id: "corporate", label: "Corporate Intrigue", desc: "Industrial espionage, whistleblowers, and leaks" },
  { id: "museum", label: "Art Heist", desc: "High-value gallery thefts and forged masterworks" },
  { id: "digital", label: "Cyber Breach", desc: "Encrypted server leaks, digital extortions, hacks" },
];

const DIFFICULTIES = [
  {
    id: "easy",
    label: "Easy",
    suspects: 3,
    badge: "easy" as const,
    desc: "3 suspects, straightforward alibis, and direct contradictions.",
  },
  {
    id: "medium",
    label: "Medium",
    suspects: 4,
    badge: "medium" as const,
    desc: "4 suspects, subtle lies, and cross-referencing between chat and CCTV.",
  },
  {
    id: "hard",
    label: "Hard",
    suspects: 5,
    badge: "hard" as const,
    desc: "5 suspects, interwoven motives, hidden clues, and tight timeline windows.",
  },
];

const EVIDENCE_TYPES = [
  { id: "chat", label: "Chat Transcripts", icon: MessageSquare, desc: "WhatsApp & messaging threads" },
  { id: "cctv", label: "CCTV Storyboards", icon: Film, desc: "Surveillance camera frame logs" },
  { id: "image", label: "Crime Scene Stills", icon: Camera, desc: "Photographic evidentiary stills" },
  { id: "witness_statement", label: "Witness Statements", icon: FileText, desc: "Interrogation transcripts" },
  { id: "digital_record", label: "Access Telemetry", icon: Binary, desc: "Door badge & system logins" },
  { id: "timeline", label: "Chronological Clues", icon: Clock, desc: "Timestamped incident markers" },
];

const EXAMPLE_DIAMOND_NECKLACE = {
  title: "The Missing Diamond Necklace",
  scenario:
    "A valuable heirloom diamond necklace disappears from Lady Eleanor's locked penthouse suite during an intimate high-society dinner party. The power flickered momentarily at 9:15 PM, and by 9:20 PM, the display vault stood open and empty with no signs of forced entry. Four guests were present in the adjacent dining salon, each with distinct motives and contradictory accounts of where they were when the lights went out.",
  genre: "theft",
  difficulty: "medium" as const,
  suspectCount: 4,
  evidencePreferences: ["cctv", "chat", "witness_statement", "digital_record"],
};

export function CreateMysteryPage(): React.ReactElement {
  const navigate = useNavigate();

  const [scenario, setScenario] = useState("");
  const [genre, setGenre] = useState("theft");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [suspectCount, setSuspectCount] = useState(4);
  const [evidencePreferences, setEvidencePreferences] = useState<string[]>([
    "chat",
    "cctv",
    "image",
    "witness_statement",
    "digital_record",
  ]);
  const [generateMedia, setGenerateMedia] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleDifficultySelect = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    const found = DIFFICULTIES.find((d) => d.id === diff);
    if (found) setSuspectCount(found.suspects);
  };

  const toggleEvidence = (id: string) => {
    setEvidencePreferences((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLoadExample = () => {
    setScenario(EXAMPLE_DIAMOND_NECKLACE.scenario);
    setGenre(EXAMPLE_DIAMOND_NECKLACE.genre);
    setDifficulty(EXAMPLE_DIAMOND_NECKLACE.difficulty);
    setSuspectCount(EXAMPLE_DIAMOND_NECKLACE.suspectCount);
    setEvidencePreferences(EXAMPLE_DIAMOND_NECKLACE.evidencePreferences);
    setErrorMsg(null);
    setIsHelpOpen(false);
  };

  const handleClearScenario = () => {
    setScenario("");
    setErrorMsg(null);
  };

  // Safe Voice Command event listeners
  React.useEffect(() => {
    const handleVoiceLoadExample = () => {
      handleLoadExample();
    };
    const handleVoiceClearScenario = () => {
      handleClearScenario();
    };
    const handleVoiceSetDifficulty = (e: Event) => {
      const customEvent = e as CustomEvent<"easy" | "medium" | "hard">;
      if (customEvent.detail) {
        handleDifficultySelect(customEvent.detail);
      }
    };
    const handleVoiceSetGenre = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setGenre(customEvent.detail);
      }
    };
    const handleVoiceGenerate = () => {
      const form = document.getElementById("create-mystery-form") as HTMLFormElement | null;
      if (form) {
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.submit();
        }
      }
    };

    window.addEventListener("ai-mystery:load-example", handleVoiceLoadExample);
    window.addEventListener("ai-mystery:clear-scenario", handleVoiceClearScenario);
    window.addEventListener("ai-mystery:set-difficulty", handleVoiceSetDifficulty);
    window.addEventListener("ai-mystery:set-genre", handleVoiceSetGenre);
    window.addEventListener("ai-mystery:generate-mystery", handleVoiceGenerate);

    return () => {
      window.removeEventListener("ai-mystery:load-example", handleVoiceLoadExample);
      window.removeEventListener("ai-mystery:clear-scenario", handleVoiceClearScenario);
      window.removeEventListener("ai-mystery:set-difficulty", handleVoiceSetDifficulty);
      window.removeEventListener("ai-mystery:set-genre", handleVoiceSetGenre);
      window.removeEventListener("ai-mystery:generate-mystery", handleVoiceGenerate);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return; // Prevent duplicate requests
    setErrorMsg(null);

    const trimmed = scenario.trim();
    if (trimmed.length < 50) {
      setErrorMsg(`Scenario must contain at least 50 characters (currently ${trimmed.length}).`);
      return;
    }
    if (trimmed.length > 3000) {
      setErrorMsg(`Scenario cannot exceed 3,000 characters (currently ${trimmed.length}).`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await apiRequest<{ id: string; status: string }>("/api/v1/mysteries", {
        method: "POST",
        body: JSON.stringify({
          scenario: trimmed,
          genre,
          difficulty,
          suspectCount,
          evidencePreferences,
          generateMedia,
        }),
      });

      if (response && response.id) {
        navigate(`/case/${response.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to synthesize investigation. Please check connection and retry.";
      setGenerationError(message);
    }
  };

  if (isGenerating) {
    return (
      <div className="py-12 px-4">
        <GenerationProgress
          isFailed={!!generationError}
          errorMessage={generationError || undefined}
          onRetry={() => {
            setIsGenerating(false);
            setGenerationError(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Case Synthesis Setup</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Create Mystery
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Configure the incident premise, genre, difficulty, and evidence formats. Gemini will build the suspect dossiers, alibis, and discoverable contradictions.
        </p>
      </div>

      <form id="create-mystery-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Field 1: Incident Premise / Scenario */}
        <Card variant="panel" className="p-5 sm:p-6 border-slate-800">
          <CardHeader className="p-0 pb-4 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    1. Incident Premise / Scenario
                  </h2>
                  <Badge variant="accent" size="sm">Required</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Describe what happened, where the crime took place, and the key circumstances.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleLoadExample}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                  className="text-xs"
                >
                  Load Example
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHelpOpen(true)}
                  leftIcon={<HelpCircle className="w-4 h-4 text-slate-400" />}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Guide
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 space-y-3">
            <Textarea
              id="mystery-scenario-input"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe the incident here... (e.g., During an intimate dinner at the penthouse, the host's rare diamond necklace disappeared while the lights flickered off for two minutes...)"
              rows={6}
              showCharCount
              minChars={50}
              maxChars={3000}
              error={errorMsg || undefined}
              aria-label="Incident Premise or Scenario description"
              className="text-sm sm:text-base"
            />

            {/* Quick Starters & Clear Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-medium">Quick Starters:</span>
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-500/30 text-xs font-medium transition-all"
                >
                  💎 Diamond Necklace
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScenario(
                      "During an invitation-only preview at the St. Jude Contemporary Gallery, a 14-minute power grid failure disabled secondary security sensors. When auxiliary emergency lights activated, 'The Golden Eclipse' canvas had been cleanly extracted from its frame."
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 text-xs font-medium transition-all"
                >
                  🖼️ Gallery Blackout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScenario(
                      "At 11:45 PM on a luxury overnight train through the Alps, the conductor discovered the private cabin of software mogul Victor Vance open. Vance was missing, his encrypted prototype drive was gone, and three nervous passengers were lingering in the adjacent lounge."
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 text-xs font-medium transition-all"
                >
                  🚂 Alpine Express
                </button>
              </div>

              {scenario.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearScenario}
                  className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Field 2: Investigation Genre */}
        <Card variant="panel" className="p-5 sm:p-6 border-slate-800">
          <CardHeader className="p-0 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">2. Investigation Genre</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Determines the thematic backdrop, suspect occupations, and clue terminology.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {GENRES.map((g) => {
                const isSelected = genre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenre(g.id)}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500 shadow-sm shadow-violet-950"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-bold ${isSelected ? "text-violet-300" : "text-white"}`}>
                        {g.label}
                      </span>
                      {isSelected && <Badge variant="accent" size="sm">Selected</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Field 3: Complexity & Difficulty */}
        <Card variant="panel" className="p-5 sm:p-6 border-slate-800">
          <CardHeader className="p-0 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">3. Complexity &amp; Difficulty</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Controls the number of suspects, timeline intricacy, and subtlety of contradictions.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIFFICULTIES.map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => handleDifficultySelect(diff.id as "easy" | "medium" | "hard")}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500 shadow-sm shadow-violet-950"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={diff.badge}>{diff.label}</Badge>
                      <span className="text-xs font-mono text-slate-400">
                        {diff.suspects} suspects
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{diff.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Suspect Count Selector */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Suspect Count:
                </span>
                <span className="text-xs text-slate-500">
                  (Adjustable between 3 and 5)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSuspectCount(count)}
                    aria-pressed={suspectCount === count}
                    className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all border cursor-pointer ${
                      suspectCount === count
                        ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/50"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field 4: Evidence Preferences & Media */}
        <Card variant="panel" className="p-5 sm:p-6 border-slate-800">
          <CardHeader className="p-0 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">4. Evidence Preferences &amp; Media</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select which investigation artifacts Gemini synthesizes for your dossier.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {EVIDENCE_TYPES.map((ev) => {
                const isChecked = evidencePreferences.includes(ev.id);
                const Icon = ev.icon;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => toggleEvidence(ev.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? "bg-violet-950/40 border-violet-500 text-white shadow-sm"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isChecked ? "text-violet-400" : "text-slate-500"}`} />
                    <div>
                      <div className={`text-xs font-bold ${isChecked ? "text-white" : "text-slate-300"}`}>
                        {ev.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ev.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional AI Media Stills */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-white">Synthesize AI Image Stills</span>
                  <Badge variant="outline" size="sm">Optional</Badge>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When enabled, generates visual snapshots for CCTV cameras and evidence items. If disabled, interactive storyboards are used.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={generateMedia}
                  onChange={(e) => setGenerateMedia(e.target.checked)}
                  aria-label="Toggle AI Image Stills"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>
          </CardContent>

          <CardFooter className="p-0 pt-6 mt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Info className="w-4 h-4 text-violet-400 shrink-0" />
              <span>All generated evidence items are tagged as fictional simulations.</span>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-violet-900/30 hover:shadow-violet-700/50"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Generate Mystery
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Guide / Field Manual Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Field Guide: How to Craft and Solve Mysteries"
        maxWidth="2xl"
      >
        <div className="space-y-6 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/30 space-y-1">
            <div className="flex items-center gap-2 text-violet-300 font-mono text-xs font-bold uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Investigation Core Loop</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              In AI Mystery Room, you play as the lead detective. Google Gemini synthesizes an airtight crime scenario with persons of interest, alibis, WhatsApp chat logs, surveillance frames, and access telemetry. Spot the contradictions, identify the sole culprit, and file your official accusation.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-400" />
              <span>Deduction Methodology</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-violet-400 font-bold">1. Review Suspect Alibis</span>
                <p className="text-slate-400 text-xs">
                  Read each suspect&apos;s initial statement and note their claimed location during the crime window.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-violet-400 font-bold">2. Cross-Reference Telemetry</span>
                <p className="text-slate-400 text-xs">
                  Compare statements with CCTV storyboard timestamps, access logs, and message histories.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-violet-400 font-bold">3. Spot Contradictions</span>
                <p className="text-slate-400 text-xs">
                  Innocent suspects have verifiable alibis. The perpetrator&apos;s story conflicts with at least two clues.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-violet-400 font-bold">4. Submit Accusation</span>
                <p className="text-slate-400 text-xs">
                  Select your prime suspect, record your deductive reasoning, and reveal the sealed resolution.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsHelpOpen(false)}>
              Close Guide
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={handleLoadExample}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Load Example Case
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
