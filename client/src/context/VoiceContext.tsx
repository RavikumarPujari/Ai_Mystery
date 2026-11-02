import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type VoiceStatus = "idle" | "listening" | "processing" | "error";

export interface PendingConfirmation {
  action: "generate" | "accuse" | "clear";
  prompt: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface VoiceContextType {
  isListening: boolean;
  status: VoiceStatus;
  transcript: string;
  interimTranscript: string;
  lastFeedback: string | null;
  error: string | null;
  isSupported: boolean;
  pendingConfirmation: PendingConfirmation | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  confirmAction: () => void;
  cancelAction: () => void;
  clearFeedback: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

/**
 * Text normalization for speech input:
 * Removes punctuation, filler words, extra whitespace, and converts to lowercase.
 */
function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
    .replace(/\b(please|can you|could you|would you|hey|antigravity|now|just|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Helper to safely speak text aloud using the browser's native SpeechSynthesis API
 */
export function speakText(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function VoiceProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);

  const recognitionRef = useRef<any>(null);
  const userStoppedRef = useRef<boolean>(true);
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  // Duplicate execution guard: stores last executed command ID and timestamp
  const lastExecutedRef = useRef<{ id: string; time: number }>({
    id: "",
    time: 0,
  });

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      (window as IWindowWithSpeech).SpeechRecognition ||
      (window as IWindowWithSpeech).webkitSpeechRecognition
    );

  const clearFeedback = useCallback(() => {
    setLastFeedback(null);
  }, []);

  const confirmAction = useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.onConfirm();
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  const cancelAction = useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.onCancel();
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  const stopListening = useCallback(() => {
    userStoppedRef.current = true;
    stopSpeaking();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Safe to ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus("idle");
    setInterimTranscript("");
    setPendingConfirmation(null);
    setLastFeedback("Voice assistant deactivated.");
  }, []);

  /**
   * Central Website-Wide Command Processing Engine:
   * Fast intent matching, context awareness, and duplicate debounce protection.
   */
  const processVoiceCommand = useCallback(
    (rawText: string, isFinal: boolean) => {
      const normalized = normalizeSpeech(rawText);
      if (!normalized) return;

      const now = Date.now();
      const currentPath = locationRef.current;

      // Helper to execute command with debounce protection
      const execute = (
        commandId: string,
        feedback: string,
        action: () => void
      ): boolean => {
        if (
          lastExecutedRef.current.id === commandId &&
          now - lastExecutedRef.current.time < 1200
        ) {
          return true; // Already executed recently, skip duplicate
        }
        lastExecutedRef.current = { id: commandId, time: now };
        setStatus("processing");
        action();
        setLastFeedback(feedback);
        setTimeout(() => setStatus("listening"), 300);
        return true;
      };

      // 1. Pending Confirmation Handling (Consequential Actions Safeguard)
      if (pendingConfirmation) {
        if (/\b(yes|confirm|proceed|sure|do it|ok|okay)\b/.test(normalized)) {
          return execute("confirm", "Confirmed action.", () => {
            confirmAction();
          });
        }
        if (/\b(no|cancel|abort|stop|never mind|dont)\b/.test(normalized)) {
          return execute("cancel", "Action cancelled.", () => {
            cancelAction();
          });
        }
        return;
      }

      // 2. Deactivation / Stop Commands
      if (
        /\b(stop listening|stop voice assistant|stop voice|turn off voice|deactivate voice|stop assistant|mute microphone)\b/.test(
          normalized
        )
      ) {
        stopListening();
        return;
      }

      // 3. Audio Reading Cancellation
      if (/\b(stop reading|stop speaking|be quiet|silence)\b/.test(normalized)) {
        return execute("stop_reading", "Stopped reading.", () => {
          stopSpeaking();
        });
      }

      // 4. Modal / Viewer Dismissal
      if (
        /\b(close guide|close modal|close viewer|close evidence|close window|dismiss|exit popup)\b/.test(
          normalized
        )
      ) {
        return execute("close_modal", "Closed modal window.", () => {
          stopSpeaking();
          window.dispatchEvent(new CustomEvent("ai-mystery:close-modal"));
          window.dispatchEvent(new CustomEvent("ai-mystery:close-guide"));
          window.dispatchEvent(new CustomEvent("ai-mystery:close-evidence"));
        });
      }

      // 5. Guide Popup Commands (Website-Wide)
      if (
        /\b(open guide|show guide|how to play|workflow guide|help me|show instructions|tutorial)\b/.test(
          normalized
        )
      ) {
        return execute("open_guide", "Opening Guide...", () => {
          if (currentPath !== "/") {
            navigate("/");
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("ai-mystery:open-guide"));
            }, 300);
          } else {
            window.dispatchEvent(new CustomEvent("ai-mystery:open-guide"));
          }
        });
      }

      // 6. Global Navigation Commands
      if (/\b(open home|go home|go to home|home page|dashboard|bureau)\b/.test(normalized)) {
        return execute("nav_home", "Navigating to Home", () => {
          navigate("/");
        });
      }

      if (
        /\b(create mystery|start a new case|start new case|new mystery|create case|open create)\b/.test(
          normalized
        )
      ) {
        return execute("nav_create", "Navigating to Create Mystery", () => {
          navigate("/create");
        });
      }

      if (
        /\b(show history|open my cases|my cases|case files|case history|past investigations|archives)\b/.test(
          normalized
        )
      ) {
        return execute("nav_history", "Navigating to Case Files Archive", () => {
          navigate("/history");
        });
      }

      if (/\b(go back|navigate back|previous page|back)\b/.test(normalized)) {
        return execute("nav_back", "Navigating back", () => {
          navigate(-1);
        });
      }

      // 7. Viewport Scrolling
      if (/\b(scroll down|page down)\b/.test(normalized)) {
        return execute("scroll_down", "Scrolled down", () => {
          window.scrollBy({ top: 450, behavior: "smooth" });
        });
      }

      if (/\b(scroll up|page up)\b/.test(normalized)) {
        return execute("scroll_up", "Scrolled up", () => {
          window.scrollBy({ top: -450, behavior: "smooth" });
        });
      }

      if (/\b(scroll to top|top of page|go to top)\b/.test(normalized)) {
        return execute("scroll_top", "Scrolled to top", () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      if (/\b(scroll to bottom|bottom of page|go to bottom)\b/.test(normalized)) {
        return execute("scroll_bottom", "Scrolled to bottom", () => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        });
      }

      // 8. Create Mystery Page Specific Commands
      if (
        /\b(load example|fill example|sample case|load sample|example mystery)\b/.test(
          normalized
        )
      ) {
        return execute("load_example", "Loaded example mystery scenario", () => {
          if (currentPath !== "/create") {
            navigate("/create");
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("ai-mystery:load-example"));
            }, 300);
          } else {
            window.dispatchEvent(new CustomEvent("ai-mystery:load-example"));
          }
        });
      }

      if (/\b(clear scenario|clear form|clear text|reset form)\b/.test(normalized)) {
        if (currentPath === "/create") {
          return execute("clear_scenario", "Cleared scenario text", () => {
            window.dispatchEvent(new CustomEvent("ai-mystery:clear-scenario"));
          });
        }
      }

      if (/\b(difficulty easy|set easy|easy difficulty)\b/.test(normalized)) {
        if (currentPath === "/create") {
          return execute("set_easy", "Set difficulty: Easy", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:set-difficulty", { detail: "easy" })
            );
          });
        }
      }

      if (/\b(difficulty medium|set medium|medium difficulty)\b/.test(normalized)) {
        if (currentPath === "/create") {
          return execute("set_medium", "Set difficulty: Medium", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:set-difficulty", { detail: "medium" })
            );
          });
        }
      }

      if (/\b(difficulty hard|set hard|hard difficulty)\b/.test(normalized)) {
        if (currentPath === "/create") {
          return execute("set_hard", "Set difficulty: Hard", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:set-difficulty", { detail: "hard" })
            );
          });
        }
      }

      // Consequential Action: Generate Mystery
      if (
        /\b(generate mystery|generate case|synthesize case|create case now|submit mystery)\b/.test(
          normalized
        )
      ) {
        if (currentPath === "/create") {
          setPendingConfirmation({
            action: "generate",
            prompt: "Voice command received to Generate Mystery. Confirm to proceed?",
            onConfirm: () => {
              window.dispatchEvent(new CustomEvent("ai-mystery:generate-mystery"));
              setLastFeedback("Initiating mystery synthesis...");
            },
            onCancel: () => {
              setLastFeedback("Generation cancelled.");
            },
          });
          return;
        } else {
          setLastFeedback("To generate a mystery, open Create Mystery first.");
          return;
        }
      }

      // 9. Investigation Dashboard & Evidence Locker Commands
      if (
        /\b(open evidence locker|show evidence|view evidence|evidence locker|evidence)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("tab_evidence", "Switched to Evidence Locker", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "evidence" })
            );
          });
        } else {
          setLastFeedback("Evidence Locker is available inside an active investigation.");
          return;
        }
      }

      if (
        /\b(show suspects|view suspects|suspect dossiers|who are the suspects|suspects)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("tab_suspects", "Switched to Suspect Dossiers", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "suspects" })
            );
          });
        } else {
          setLastFeedback("Suspects are available inside an active investigation.");
          return;
        }
      }

      if (
        /\b(show timeline|view timeline|investigation timeline|incident timeline|timeline)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("tab_timeline", "Switched to Investigation Timeline", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "timeline" })
            );
          });
        } else {
          setLastFeedback("Timeline is available inside an active investigation.");
          return;
        }
      }

      // Evidence Locker Category Filters
      if (/\b(show cctv|filter cctv|surveillance stills|cctv)\b/.test(normalized)) {
        if (currentPath.startsWith("/case/")) {
          return execute("filter_cctv", "Filtered Evidence: CCTV Stills", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "evidence" })
            );
            window.dispatchEvent(
              new CustomEvent("ai-mystery:filter-evidence", { detail: "cctv" })
            );
          });
        }
      }

      if (
        /\b(show images|show photos|crime scene stills|photos|pictures|crime scene)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("filter_photos", "Filtered Evidence: Crime Scene & Clues", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "evidence" })
            );
            window.dispatchEvent(
              new CustomEvent("ai-mystery:filter-evidence", { detail: "image" })
            );
          });
        }
      }

      if (
        /\b(show documents|show statements|witness statements|telemetry|digital records)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("filter_docs", "Filtered Evidence: Statements & Documents", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "evidence" })
            );
            window.dispatchEvent(
              new CustomEvent("ai-mystery:filter-evidence", { detail: "witness_statement" })
            );
          });
        }
      }

      if (/\b(show all evidence|all items|reset filter)\b/.test(normalized)) {
        if (currentPath.startsWith("/case/")) {
          return execute("filter_all", "Showing All Evidence Items", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "evidence" })
            );
            window.dispatchEvent(
              new CustomEvent("ai-mystery:filter-evidence", { detail: "all" })
            );
          });
        }
      }

      // Open / Examine Evidence
      if (
        /\b(open next evidence|open evidence|inspect clue|inspect evidence|view clue)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("open_evidence", "Examining evidence clue...", () => {
            window.dispatchEvent(
              new CustomEvent("ai-mystery:switch-tab", { detail: "evidence" })
            );
            window.dispatchEvent(new CustomEvent("ai-mystery:open-evidence"));
          });
        }
      }

      // Read Active Clue Aloud via Text-to-Speech
      if (
        /\b(read clue|read this clue|read description|read message|read statement|read evidence)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute("read_clue", "Reading clue aloud...", () => {
            window.dispatchEvent(new CustomEvent("ai-mystery:read-clue"));
          });
        } else {
          setLastFeedback("Clue reading is available inside an active investigation.");
          return;
        }
      }

      // Consequential Action: Accuse (Never submits without explicit confirmation)
      if (
        /\b(accuse|make accusation|open accusation|accuse suspect|who is the culprit)\b/.test(
          normalized
        )
      ) {
        if (currentPath.startsWith("/case/")) {
          return execute(
            "open_accuse",
            "Opened Accusation Dossier. Explicit confirmation required to submit.",
            () => {
              window.dispatchEvent(new CustomEvent("ai-mystery:open-accuse"));
            }
          );
        } else {
          setLastFeedback("Accusations can only be made inside an active investigation.");
          return;
        }
      }

      // 10. Results Page Commands
      if (
        /\b(read solution|explain mystery|show solution|explain result)\b/.test(
          normalized
        )
      ) {
        if (currentPath.includes("/results")) {
          return execute("read_solution", "Reading investigation solution...", () => {
            window.dispatchEvent(new CustomEvent("ai-mystery:read-solution"));
          });
        } else {
          setLastFeedback("Solution reading is available on the Results page.");
          return;
        }
      }

      if (/\b(show culprit|who did it|who is the culprit|who was it)\b/.test(normalized)) {
        if (currentPath.includes("/results")) {
          return execute("read_culprit", "Revealing culprit details...", () => {
            window.dispatchEvent(new CustomEvent("ai-mystery:read-solution"));
          });
        }
      }

      // If final transcript was processed and no intent matched, show gentle guidance
      if (isFinal && normalized.length > 5) {
        setLastFeedback(`Unrecognized command: "${rawText.trim()}". Say "Help" or "Open Guide" for options.`);
      }
    },
    [navigate, stopListening, pendingConfirmation, confirmAction, cancelAction]
  );

  /**
   * Start speech recognition manually on explicit user click.
   */
  const startListening = useCallback(async () => {
    setError(null);
    setLastFeedback(null);
    setTranscript("");
    setInterimTranscript("");

    const win = window as IWindowWithSpeech;
    const SpeechRecognitionClass =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError(
        "Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari."
      );
      setStatus("error");
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    userStoppedRef.current = false;

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus("listening");
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        setInterimTranscript(interim);

        // Fast intent check on interim speech for zero-lag responsiveness
        if (interim.trim()) {
          processVoiceCommand(interim, false);
        }

        // Full check on final speech
        if (final.trim()) {
          const trimmedFinal = final.trim();
          setTranscript(trimmedFinal);
          processVoiceCommand(trimmedFinal, true);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[VoiceAssistant] Recognition event error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError(
            "Microphone permission was denied. Please allow microphone access in your browser to use Voice Assistant."
          );
          setStatus("error");
          stopListening();
        } else if (event.error === "no-speech") {
          // No speech detected; continue listening quietly
        } else if (event.error === "network") {
          setError("Speech recognition service temporarily unavailable.");
          setStatus("error");
          stopListening();
        } else if (event.error !== "aborted") {
          setError(`Voice recognition encountered an issue (${event.error}).`);
          setStatus("error");
          stopListening();
        }
      };

      recognition.onend = () => {
        // If user manually stopped or permission was denied, do NOT restart
        if (userStoppedRef.current) {
          setIsListening(false);
          setStatus("idle");
          setInterimTranscript("");
          return;
        }

        // Browser speech engines can time out during quiet periods; restart cleanly only if user didn't stop
        try {
          if (!userStoppedRef.current && recognitionRef.current) {
            recognitionRef.current.start();
          }
        } catch {
          setIsListening(false);
          setStatus("idle");
        }
      };

      recognition.start();
    } catch (err) {
      console.error("[VoiceAssistant] Failed to start recognition:", err);
      setError(
        "Could not access microphone. Please check your browser permissions."
      );
      setStatus("error");
      setIsListening(false);
    }
  }, [processVoiceCommand, stopListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      userStoppedRef.current = true;
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        status,
        transcript,
        interimTranscript,
        lastFeedback,
        error,
        isSupported,
        pendingConfirmation,
        startListening,
        stopListening,
        confirmAction,
        cancelAction,
        clearFeedback,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}
