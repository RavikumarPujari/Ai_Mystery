import React from "react";
import { MessageSquare, ShieldAlert, Clock, User } from "lucide-react";
import { ChatEvidenceContent, ChatMessage } from "../../types/mystery";

interface ChatViewerProps {
  content: ChatEvidenceContent;
}

export function ChatViewer({ content }: ChatViewerProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Fictional Chat Disclaimer */}
      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-violet-400" />
          <span className="font-mono uppercase tracking-wider font-bold text-[11px]">
            SIMULATED CHAT • FICTIONAL CASE EVIDENCE
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Channel: {content.channelName || "#general"}
        </span>
      </div>

      {/* Participants Header */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <User className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-medium">Participants:</span>
          <span className="text-white font-bold">
            {content.participants ? content.participants.join(", ") : "Unknown"}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          ID: {content.conversationId}
        </span>
      </div>

      {/* Chat Messages Container */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5 min-h-[250px] max-h-[420px] overflow-y-auto">
        {content.messages && content.messages.length > 0 ? (
          content.messages.map((msg: ChatMessage, index: number) => {
            const isFirstParticipant =
              content.participants && msg.senderName === content.participants[0];

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${
                  isFirstParticipant ? "items-start" : "items-end"
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 mb-1 px-1 flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">{msg.senderName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-violet-400">
                    <Clock className="w-2.5 h-2.5" />
                    {msg.timestamp}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    isFirstParticipant
                      ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                      : "bg-violet-950/60 border border-violet-500/40 text-violet-100 rounded-tr-none"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-violet-400" />
            <span>No messages recovered in this transcript.</span>
          </div>
        )}
      </div>

      <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between px-1">
        <span>Transcribed from recovered mobile telemetry.</span>
        <span className="text-violet-400 font-semibold">Cross-reference timestamps with suspect claims.</span>
      </div>
    </div>
  );
}
