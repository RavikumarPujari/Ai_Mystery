import React from "react";
import { Sparkles, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-slate-800/80 bg-[#080C14] text-slate-400 text-xs">
      {/* Prominent Fictional Content Notice */}
      <div className="bg-slate-950/60 border-b border-slate-800/50 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            <strong className="text-slate-200">Entertainment Disclaimer:</strong> AI Mystery Room creates fictional investigations. All case materials, transcripts, photographs, and records are simulated for detective entertainment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
          <span className="font-bold text-slate-300">AI MYSTERY ROOM &copy; 2026</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Powered by Google Gemini</span>
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="text-[11px] text-slate-400">Zero-Leak Server Architecture</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400 hover:text-purple-300 cursor-default transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Investigation Rules</span>
          </span>
          <span className="text-slate-700">/</span>
          <span className="flex items-center gap-1 text-slate-400 hover:text-purple-300 cursor-default transition-colors">
            <span>Fictional Privacy</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </footer>
  );
}

