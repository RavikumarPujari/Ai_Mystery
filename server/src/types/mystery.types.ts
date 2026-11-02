export type MysteryGenre =
  | "theft"
  | "murder"
  | "disappearance"
  | "corporate"
  | "museum"
  | "digital"
  | "suspicious_incident"
  | "general";

export type MysteryDifficulty = "easy" | "medium" | "hard";

export type MysteryStatus =
  | "generating"
  | "validating"
  | "generating_media"
  | "ready"
  | "failed";

export type EvidenceType =
  | "chat"
  | "cctv"
  | "image"
  | "witness_statement"
  | "document"
  | "digital_record"
  | "timeline";

export interface PublicSuspect {
  id: string; // e.g. "suspect_001"
  name: string;
  role: string;
  relationship: string;
  initialStatement: string;
  knownMotive?: string;
  alibiInfo?: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId?: string;
  timestamp: string;
  text: string;
  isFlagged?: boolean;
}

export interface ChatEvidenceContent {
  conversationId: string;
  channelName: string;
  participants: string[];
  messages: ChatMessage[];
  disclaimer: string;
}

export interface CctvFrame {
  frameId: string;
  timestamp: string;
  cameraLocation: string;
  cameraTag: string;
  description: string;
  observedEntities: string[];
  imageUrl?: string;
}

export interface CctvEvidenceContent {
  cameraTag: string;
  location: string;
  timeRange: string;
  frames: CctvFrame[];
  surveillanceLog: string;
  disclaimer: string;
}

export interface StatementEvidenceContent {
  witnessName: string;
  witnessRole: string;
  recordedAt: string;
  interrogator: string;
  transcript: string;
}

export interface DocumentEvidenceContent {
  documentTitle: string;
  issuedBy: string;
  date: string;
  summary: string;
  bodyText: string;
}

export interface DigitalRecordEvidenceContent {
  systemName: string;
  recordType: "access_log" | "transaction" | "sensor" | "email";
  entries: Array<{
    timestamp: string;
    action: string;
    actor: string;
    status: string;
    metadata?: Record<string, string>;
  }>;
}

export type EvidenceContent =
  | { type: "chat"; data: ChatEvidenceContent }
  | { type: "cctv"; data: CctvEvidenceContent }
  | { type: "witness_statement"; data: StatementEvidenceContent }
  | { type: "document"; data: DocumentEvidenceContent }
  | { type: "digital_record"; data: DigitalRecordEvidenceContent }
  | { type: "image"; data: { imageUrl: string; caption: string; capturedAt?: string } }
  | { type: "timeline"; data: { eventSummary: string; timestamp: string } };

export interface PublicEvidence {
  id: string; // e.g. "evidence_001"
  type: EvidenceType;
  title: string;
  description: string;
  source: string;
  occurredAt?: string;
  relatedSuspectIds: string[];
  relatedEventIds?: string[];
  content: EvidenceContent["data"];
  mediaAssetIds?: string[];
}

export interface PublicTimelineEvent {
  id: string;
  time: string;
  description: string;
  relatedSuspectIds: string[];
  relatedEvidenceIds: string[];
  isVerified: boolean;
}

export interface PublicCaseData {
  caseNumber: string;
  title: string;
  summary: string;
  location: string;
  incidentTime: string;
  difficulty: MysteryDifficulty;
  genre: MysteryGenre;
  suspects: PublicSuspect[];
  evidence: PublicEvidence[];
  timeline: PublicTimelineEvent[];
}

// Private server-side solution data (ADR-001: strictly isolated)
export interface AuthoritativeTimelineEvent {
  id: string;
  time: string;
  trueEvent: string;
  actors: string[];
  isContradictedByLies: boolean;
  correspondingEvidenceIds: string[];
}

export interface SuspectTruthRecord {
  suspectId: string;
  isCulprit: boolean;
  trueAlibi: string;
  statedAlibi: string;
  liesTold: string[];
  factsKnown: string[];
}

export interface PrivateSolutionData {
  mysteryId: string;
  culpritSuspectId: string;
  motive: string;
  opportunity: string;
  method: string;
  explanation: string;
  authoritativeTimeline: AuthoritativeTimelineEvent[];
  decisiveEvidenceIds: string[];
  redHerringExplanations: string[];
  suspectTruthRecords: SuspectTruthRecord[];
}

export interface InvestigationResultPayload {
  investigationId: string;
  mysteryId: string;
  status: "completed";
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

