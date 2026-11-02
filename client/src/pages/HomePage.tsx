import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  PlusCircle,
  Users,
  MessageSquare,
  Video,
  CheckCircle2,
  ArrowRight,
  Fingerprint,
  Lock,
  Cpu,
  BookOpen,
  User,
  Sparkles,
  ArrowDown,
  HelpCircle,
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Card, CardHeader, CardContent } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";

export function HomePage(): React.ReactElement {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Global voice command integration for Guide modal
  React.useEffect(() => {
    const handleOpenGuide = () => setIsGuideOpen(true);
    const handleCloseGuide = () => setIsGuideOpen(false);

    window.addEventListener("ai-mystery:open-guide", handleOpenGuide);
    window.addEventListener("ai-mystery:close-guide", handleCloseGuide);
    window.addEventListener("ai-mystery:close-modal", handleCloseGuide);

    return () => {
      window.removeEventListener("ai-mystery:open-guide", handleOpenGuide);
      window.removeEventListener("ai-mystery:close-guide", handleCloseGuide);
      window.removeEventListener("ai-mystery:close-modal", handleCloseGuide);
    };
  }, []);
  return (
    <div className="space-y-20 py-6">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 pt-8 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span>AI Detective Simulation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4 leading-[1.1]">
          Every Mystery Has A{" "}
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            Secret.
          </span>
        </h1>

        <p className="text-xl sm:text-2xl font-bold text-violet-300/90 tracking-wider uppercase font-mono mb-4">
          Investigate. Discover. Accuse.
        </p>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
          Synthesize high-stakes criminal investigations with Google Gemini. Interrogate suspect dossiers, cross-examine CCTV timestamps, and uncover hidden contradictions to solve the crime.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/create">
            <Button
              size="lg"
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-lg shadow-violet-900/30 hover:shadow-violet-700/50"
            >
              Create Mystery
            </Button>
          </Link>
          <a href="#example-case">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Search className="w-5 h-5 text-violet-400" />}
              className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold"
            >
              View Example Case
            </Button>
          </a>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setIsGuideOpen(true)}
            leftIcon={<BookOpen className="w-4 h-4 text-violet-400" />}
            className="w-full sm:w-auto px-5 py-3.5 text-base font-semibold border-slate-700/80 hover:border-violet-500/60 text-slate-200"
            aria-label="How AI Mystery Room Works Guide"
          >
            Guide
          </Button>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400 mb-2 font-mono">
            <span>Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How to Play</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
            Four streamlined steps from scenario prompt to final accusation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="panel" className="p-5 flex flex-col justify-between border-slate-800 hover:border-violet-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold font-mono text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Define Premise</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe a theft, heist, or disappearance. Select your genre and investigation difficulty.
              </p>
            </div>
          </Card>

          <Card variant="panel" className="p-5 flex flex-col justify-between border-slate-800 hover:border-violet-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold font-mono text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Synthesize Case</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini constructs an airtight backstory, suspect profiles, alibis, and discoverable evidence.
              </p>
            </div>
          </Card>

          <Card variant="panel" className="p-5 flex flex-col justify-between border-slate-800 hover:border-violet-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold font-mono text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Analyze Evidence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-reference chat threads, CCTV footage, and access logs to uncover lies and broken alibis.
              </p>
            </div>
          </Card>

          <Card variant="panel" className="p-5 flex flex-col justify-between border-slate-800 hover:border-violet-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold font-mono text-sm mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Accuse &amp; Reveal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit your prime suspect with reasoning. Reveal the sealed culprit and full timeline breakdown.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Example Mystery Section */}
      <section id="example-case" className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-violet-400 font-semibold">
                Case Specimen
              </span>
              <Badge variant="accent" size="sm">
                Active Example
              </Badge>
            </div>
            <h2 className="text-2xl font-extrabold text-white">The St. Jude Gallery Blackout</h2>
          </div>
          <Badge variant="medium">Medium Difficulty</Badge>
        </div>

        <Card variant="interactive" className="overflow-hidden border-violet-500/30 shadow-xl shadow-slate-950/60">
          <CardHeader className="bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-0.5">
                <span>FILE #MR-2026-084</span>
                <span>•</span>
                <span>Art Theft</span>
              </div>
              <h3 className="text-lg font-bold text-white">The Golden Eclipse Extraction</h3>
            </div>
            <Link to="/create">
              <Button size="sm" variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Similar Case
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="space-y-4 p-5 sm:p-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              During an invitation-only preview at the St. Jude Contemporary Gallery, a 14-minute power grid failure disabled secondary security sensors. When auxiliary emergency lights activated, &ldquo;The Golden Eclipse&rdquo; canvas had been cleanly extracted from its frame.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] font-medium">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  <span>Suspects</span>
                </div>
                <div className="font-bold text-white text-sm">4 Persons</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] font-medium">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Chat Threads</span>
                </div>
                <div className="font-bold text-white text-sm">3 Transcripts</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] font-medium">
                  <Video className="w-3.5 h-3.5 text-violet-400" />
                  <span>Surveillance</span>
                </div>
                <div className="font-bold text-white text-sm">5 CCTV Frames</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Proof Metric</span>
                </div>
                <div className="font-bold text-white text-sm">2 Key Contradictions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card variant="panel" className="p-6 border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Deterministic Logic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every mystery is mathematically validated for chronological consistency and proof integrity before it is presented.
            </p>
          </Card>

          <Card variant="panel" className="p-6 border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Cheat-Proof Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The true culprit is isolated server-side. Network inspections and browser developer tools cannot expose the answer early.
            </p>
          </Card>

          <Card variant="panel" className="p-6 border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Simulated Forensic Artifacts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore surveillance camera stills, badge telemetry, and message logs formatted specifically for detective deduction.
            </p>
          </Card>
        </div>
      </section>

      {/* How AI Mystery Room Works - Guide Modal */}
      <Modal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="How AI Mystery Room Works"
        subtitle="Follow this 4-step workflow to investigate and solve any crime"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {/* Step 1: YOU - Enter a Mystery */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">01</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                <User className="w-3 h-3 text-emerald-400" /> YOU
              </span>
              <h3 className="text-sm font-bold text-white">Enter a Mystery</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc marker:text-emerald-400">
              <li>Enter your own mystery scenario.</li>
              <li>
                <span className="text-slate-400">Example:</span>{" "}
                <span className="text-emerald-300/90 font-medium italic">&ldquo;A diamond disappears from a hotel.&rdquo;</span>
              </li>
            </ul>
          </div>

          {/* Arrow Connector */}
          <div className="flex justify-center -my-1">
            <div className="p-1 rounded-full bg-slate-900 border border-violet-500/30 text-violet-400 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2: AI - Creates the Investigation */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">02</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-violet-950/80 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-3 h-3 text-violet-400" /> AI
              </span>
              <h3 className="text-sm font-bold text-white">Creates the Investigation</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc marker:text-violet-400">
              <li>Generates the investigation based on the scenario.</li>
              <li>Creates suspects, clues, evidence and a hidden solution.</li>
            </ul>
          </div>

          {/* Arrow Connector */}
          <div className="flex justify-center -my-1">
            <div className="p-1 rounded-full bg-slate-900 border border-violet-500/30 text-violet-400 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3: YOU - Investigate */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">03</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                <User className="w-3 h-3 text-emerald-400" /> YOU
              </span>
              <h3 className="text-sm font-bold text-white">Investigate</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc marker:text-emerald-400">
              <li>Explore the evidence.</li>
              <li>Examine suspects and clues.</li>
              <li>Accuse the person you think is responsible.</li>
            </ul>
          </div>

          {/* Arrow Connector */}
          <div className="flex justify-center -my-1">
            <div className="p-1 rounded-full bg-slate-900 border border-violet-500/30 text-violet-400 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 4: AI - Reveals the Result */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">04</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-violet-950/80 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-3 h-3 text-violet-400" /> AI
              </span>
              <h3 className="text-sm font-bold text-white">Reveals the Result</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc marker:text-violet-400">
              <li>Checks your accusation.</li>
              <li>Reveals whether you are correct.</li>
              <li>Explains the mystery and solution.</li>
            </ul>
          </div>
        </div>

        {/* Example Mystery & Expected Result Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300 font-mono">Example Mystery</span>
              <p className="text-xs text-slate-200 font-medium">A diamond disappears from a hotel.</p>
            </div>
          </div>
          <div className="flex items-start sm:items-center gap-2 sm:border-l sm:border-violet-500/30 sm:pl-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-300">
              Solve the mystery by finding the culprit!
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsGuideOpen(false)}
          >
            Close
          </Button>
          <Link to="/create" onClick={() => setIsGuideOpen(false)}>
            <Button
              type="button"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Start Investigating
            </Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}
