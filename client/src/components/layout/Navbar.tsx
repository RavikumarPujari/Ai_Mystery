import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, PlusCircle, FolderClock, ShieldCheck, Mic, MicOff } from "lucide-react";
import { getGuestSessionId } from "../../services/api";
import { useVoice } from "../../context/VoiceContext";

export function Navbar(): React.ReactElement {
  const location = useLocation();
  const guestId = getGuestSessionId().substring(0, 10);
  const { isListening, startListening, stopListening } = useVoice();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/create", label: "Create Mystery", icon: PlusCircle },
    { to: "/history", label: "Case Files", icon: FolderClock },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:border-purple-400 group-hover:text-purple-300 transition-all shadow-sm shadow-purple-950/40">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-wider uppercase text-white flex items-center gap-2">
              <span>AI MYSTERY ROOM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-sm shadow-purple-400 animate-pulse" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Interactive Investigation Console
            </div>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  isActive
                    ? "bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-950/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Optional Voice Assistant Button */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            aria-pressed={isListening}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              isListening
                ? "bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950/40 animate-pulse"
                : "bg-slate-900/90 hover:bg-purple-950/50 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 shadow-sm"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Stop Voice Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Voice Assistant</span>
              </>
            )}
          </button>

          {/* Guest Session Identifier */}
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-800/80 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Badge: <strong className="text-slate-200">{guestId}</strong></span>
          </div>
        </nav>
      </div>
    </header>
  );
}

